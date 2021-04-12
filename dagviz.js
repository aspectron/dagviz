const crypto = require('crypto');
const util = require('util');
const fs = require('fs');
//const mysql = require('mysql');
const {Pool: PgPool, Client} = require('pg');
const format = require('pg-format');
var http = require('http')
var serveStatic = require('serve-static')
const rp = require('request-promise');
const utils = require('@aspectron/flow-utils');
const {dpc} = require("@aspectron/flow-async");
//const MySQL = require('./lib/mysql');
const PgSQL = require('./lib/pgsql');
const basicAuth = require('basic-auth');
const io = require('socket.io');//(http);
// const mqtt = require('mqtt');
const path = require('path');
const WebApp = require('./web-app.js');
const FlowRouter = require('@aspectron/flow-router');
const colors = require('colors');
const {RPC} = require('@kaspa/grpc-node');
const Decimal = require('decimal.js');
//const ejs = require('ejs')

let args = utils.args();
const DUMMY_TX = true;
const USE_LOCAL_KASPAROV = !!args['use-local-kas'];
const rejectUnauthorized = false;
//console.log(`!!! WARNING: 'USE_LOCAL_KASPAROV == ${USE_LOCAL_KASPAROV}'`.redBG.white.bold)

const {Command} = require('commander');
const program = new Command();
const HEX = (v) => { return Buffer.from(v,'hex'); }

function HashesToBuffer(list) {
    return Buffer.concat(list.map(hex=>Buffer.from(hex,'hex')));
}

function BufferToHashes(buffer) {
    if(!buffer || !buffer.subarray)
        return []; 
    const size = Math.floor(buffer.length/32);
    const items = [];
    for(let k = 0; k < buffer.length; k+=32)
        items.push(buffer.subarray(k,k+32).toString('hex'));
    return items;
}


const BLOCK_PROPERTIES = [
    "blockHash",
    "parentHashes",
    "version",
    "hashMerkleRoot",
    "acceptedIdMerkleRoot",
    "utxoCommitment",
    "timestamp",
    "bits",
    "nonce",
    "acceptingBlockHash",
    "blueScore",
    "isChainBlock",
    "mass",
    "acceptedBlockHashes"
];

class DAGViz {

    constructor() {
        this.args = utils.args();

        const ports = {
            mainnet: 16110,
            testnet: 16210,
            simnet: 16510,
            devnet: 16610
        }

        program
            .version('0.0.1', '--version')
            .description('DAGViz')
            .helpOption('--help', 'display help for command')
            .option('--testnet', 'use testnet network')
            .option('--devnet', 'use devnet network')
            .option('--simnet', 'use simnet network')
            .option('--listen <listen>', 'the port to listen to')
            .option('--dropdb', 'purge PostgreSQL database')
            .option('--hostdb', 'auto-init and run PostgreSQL as a child process')
            .option('--database-host <host>', 'the database host (default localhost)')
            .option('--database-port <port>', 'the database port (default 8309)')
            .option('--database-scheme  <scheme>', 'the database scheme')
            .option('--database-user <user>', 'the database user')
            .option('--database-password <password>', 'the database password')
            .option('--rpc <address>', 'use custom RPC address <host:port>');
        program.parse(process.argv);
        this.options = program.opts();

        let networks = Object.keys(ports);
        let network = Object.keys(this.options).filter(n => networks.includes(n)).shift() || 'mainnet';
        console.log('network:', network);

        this.host = this.options.rpc || `127.0.0.1:${ports[network]}`;

        this.listenPort = this.options.listen || 8686;


        this.databaseHost = this.options.databaseHost || 'localhost';
        this.databasePort = this.options.databasePort || 8309;
        this.databaseUser = this.options.databaseUser || 'dagviz';
        this.databasePassword = this.options.databasePassword || 'dagviz';
        this.databaseScheme = this.options.databaseScheme || 'dagviz';

        this.verbose = this.args.verbose ? true : false;

        this.REWIND_BLOCK_PADDING = 60 * 60;
        this.skip = 0;

        this.blockTimings = [];
        this.last_mqtt_block_updates = [];

        this.txMap = new Map();
        this.notifications = { block : [], spc : []};
    }

    initRTBS() {
        this.rtbs = [];
        this.rtbsMap = {};
    }


    hash(data, h = 'sha256') {
        return crypto.createHash(h).update(data).digest('hex');
    }

    async init() {
        await this.initHTTP();
        this.initRTBS();
//        if(this.options.hostdb)
            await this.initDatabase();
        // else
        //     await this.initDatabase_v2();
        await this.initDatabaseSchema();
        // await this.initLastBlockTracking();
        // await this.initMQTT();
        

        await this.initRPC();
        return this.main();
    }

    async shutdownPGSQL() {
        if (this.pgSQL) {
            this.pgSQL.log("got shutdownPGSQL".brightYellow)
            await this.pgSQL.stop();
        }
    }

    async shutdown() {
        if (this.pgSQL)
            await this.pgSQL.stop();
        dpc(() => {
            process.exit(0);
        });
    }

    async initRPC() {
        console.log('connecting RPC to:', this.host);
        this.rpc = new RPC({clientConfig: {host: this.host}});
        await this.rpc.connect();
        console.log('RPC connected...');

        this.rpc.subscribe("notifyBlockAddedRequest", (async (intake) =>
            await this.handleBlockAddedNotification(intake)));
        this.rpc.subscribe("notifyVirtualSelectedParentChainChangedRequest", (async (intake) =>{
            this.handleVirtualSelectedParentChainChanged(intake);  
        }));
    }

    async initLastBlockTracking() {

        this.lastBlockHash = await this.restoreLastBlockHash();
        // await this.rewindToLastBlockHash();
    }

    async rewindToLastBlockHash() {
        if (this.lastBlockHash) {
            let rows = await this.sql(format(`SELECT * FROM blocks WHERE "blockHash" = %L`, this.lastBlockHash));
            if (rows.length) {
                let id = parseInt(rows.shift().id);
                id -= this.REWIND_BLOCK_PADDING;
                this.skip = id;
                console.log(`...resyncing from block seq ${id}`);
            } else {
                console.log("WARNING: last block hash is not available in db".brightRed);
            }
        } else {
            console.log("WARNING: last block hash is not initialized".brightRed);
        }

        // this.lbt = setInterval(async ()=>{
        //     if(this.lastBlockHash)
        //         await this.storeLastBlockHash();
        // }, 1000 * 60 * 1); // flush every 1 minte
    }

    /*
    async initMQTT() {

        if (this.args['disable-mqtt']) {
            // console.log(`!!! WARNING: MQTT IS DISABLED`.redBG.brightWhite);
            return Promise.resolve();
        }

        console.log("MQTT connecting to:", this.mqtt);

        const client = mqtt.connect(this.mqtt.address, {
            clientId: "mqtt_" + Math.round(Date.now() * Math.random()).toString(16),
            username: this.mqtt.username, //'user',
            password: this.mqtt.password //'pass'
        });

        client.subscribe("dag/blocks", {qos: 1});
        client.subscribe("dag/selected-tip", {qos: 1});
        client.subscribe("dag/selected-parent-chain", {qos: 1});
        client.on("connect", () => {
            console.log("MQTT connected");

            // this.resync(this.last_block_hash);
            this.rewindToLastBlockHash();


            // TODO @aspect - resync from last known
        })

        client.on('message', (topic, message, packet) => {
            // console.log('topic:',topic);
            //topic = 'MQTT_'+topic.replace(/\W/g,'_')+'';
            try {
                if (this[topic])
                    this[topic](JSON.parse(message.toString()));
            } catch (ex) {
                console.log(ex);
                console.log('while parsing:', message.toString());
            }
            // console.log("MQTT message is "+ message);
            // console.log("MQTT topic is "+ topic);
        });
    }
*/

    serializeBlock(block) {
        return BLOCK_PROPERTIES.map(p => block[p]);
    }

    async handleBlockAddedNotification(args) {
        this.notifications.block.push({type:'block', args, handler : this.handleBlockAddedNotificationImpl});
        this.drainNotifications();
    }

    async handleBlockAddedNotificationImpl(notification) {
        const block = notification.blockVerboseData;

        const ts = Date.now();
        // while(this.blockTimings[0] < ts-1000*15)
        //     this.blockTimings.shift();
        // this.blockTimings.push(ts);
        // let rate = this.blockTimings.length / (ts - this.blockTimings[0]) * 1000;

        let rate = NaN;
        if (this.rtbs.length) {
            let t0 = this.rtbs[0].timestamp;
            let t1 = this.rtbs[this.rtbs.length - 1].timestamp;
            let delta = t1 - t0;
            rate = 1.0 / (delta / this.rtbs.length);
            // console.log('delta:',delta,'rate:',rate,'t:',t0,'rtbs:',this.rtbs.length);
        }

        await this.getBlockTransactions(block.hash, block.transactionIDs);
        const dbBlock = this.verboseBlockToDBBlock(block);
        const data = {blocks: [this.deserealizeBlock(dbBlock)], rate};
        while (this.last_mqtt_block_updates.length > 10)
            this.last_mqtt_block_updates.shift();
        this.last_mqtt_block_updates.push(data);
        this.io.emit("dag/blocks", data);

        this.lastBlockHash = block.blockHash;

      //  await this.storeLastBlockHash(block.blockHash);

        await this.postRTB(block);
    }

    async handleVirtualSelectedParentChainChanged(args) {
        this.notifications.spc.push({type:'spc', args, handler : this.handleVirtualSelectedParentChainChangedImpl});
    }

    async drainNotifications() {

        if(this.draining)
            return;

        this.draining = true;
        while(this.notifications.block.length + this.notifications.spc.length > 1) {
            let queue = this.notifications.block.length ? this.notifications.block : this.notifications.spc;
            let { args, handler } = queue.shift();
            await handler.call(this, args);
        }
        this.draining = false;
    }

    async handleVirtualSelectedParentChainChangedImpl(args) {
        this.io.emit("dag/selected-parent-chain", args);
        await this.postSPC(args);
    }

    static MAX_RTBS_BLOCKS = 2016;

    postRTB(block) {
        this.rtbs.push({hash: block.blockHash, timestamp: block.timestamp});    // parent chain block notifications
        console.log("RTBS LENGTH =====================".brightRed, this.rtbs.length);
        this.rtbsMap[block.blockHash] = true;
        while (this.rtbs.length > DAGViz.MAX_RTBS_BLOCKS)
            delete this.rtbsMap[this.rtbs.shift().hash];

        return this.post([block]);
    }
/*
    async "dag/selected-tip"(message) {

        // console.log("dag/selected-tip");

        if (!message.blockHash)
            return console.log('invalid mqtt message:', message);

        const block = message;
        //this.io.emit("dag/selected-tip", this.serializeBlock(block));
console.log('dat/selected-tip');
        this.sql(format(`UPDATE blocks SET "isChainBlock" = TRUE WHERE "blockHash" = %L`,block.blockHash));


        this.postRTB(block);
        // "real-time" blocks - data received at runtime...

        // let blocks = [message].map(block => DAGViz.DB_TABLE_BLOCKS_ORDER.map(field => block[field]));

        // await this.sql(`
        //     REPLACE INTO blocks (
        //         ${DAGViz.DB_TABLE_BLOCKS_ORDER.join(', ')}
        //     ) VALUES ?
        // `, [blocks]);
    }
*/
    async getBlockCount() {
        const [{blockCount}] = await this.sql('select count(*) as "blockCount" from blocks;');
        return Number(blockCount);
    }

    async getBlocks({order = 'ASC', skip = 0, limit = 25}) {
        return this.sql(`SELECT * FROM blocks ORDER BY id ${order} LIMIT ${limit} OFFSET ${skip};`);
    }

    async getBlockByHash(hash) {
       const rows =  await this.sql(format(`select * from blocks where "blockHash" = %L`, Buffer.from(hash,'hex')));
       if(rows){
           return rows.shift();
       }
    }

    prepareOutputDataForClient(transaction) {
        ['blockHash','subnetworkId','txId','hash', 'scriptPubKeyHex'].forEach(prop=>{
            transaction[prop] = transaction[prop].toString('hex');
        })
        transaction.lockTime = parseInt(transaction.lockTime);
        transaction.transactionTime = parseInt(transaction.transactionTime);
    }

    async buildTransaction(transaction){
        let inputs = await this.sql(`SELECT * FROM inputs WHERE transaction_id='${transaction.id}'`);
        let outputs = await this.sql(`SELECT * FROM outputs WHERE transaction_id='${transaction.id}'`);
        inputs.forEach(input => {
            input.signatureScript = input.signatureScript.toString('hex');
            input.sequence = input.sequence.toString();
        });
        outputs.forEach(output => {
            output.scriptPubKeyHex = output.scriptPubKeyHex.toString('hex');
            //delete output.script_pub_key_hex;
        });

        transaction.inputs = inputs;
        transaction.outputs = outputs;

        ['blockHash','subnetworkId','txId','hash'].forEach(prop=>{
            transaction[prop] = transaction[prop].toString('hex');
        })
        transaction.lockTime = parseInt(transaction.lockTime);
        transaction.transactionTime = parseInt(transaction.transactionTime);
        //console.log("TRANSACTION:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:".brightRed, JSON.stringify(transaction,null,'\t'));

        for(const output of outputs) {
            let addr = await this.sql(`SELECT * FROM addresses WHERE id='${output.address_id}'`);
            if(addr && addr.length)
                output.address = addr[0].address.toString('hex');
        }
        return transaction;


    }

    async initHTTP() {
        const app = new WebApp();
        const flowRouter = new FlowRouter(app, {
            rootFolder: path.dirname(__filename),
            folders: [{url: '/components', folder: '/components'}]
        });

        if (this.args.kdx) {
            app.get('/stop', async (req, res) => {
                await this.shutdownPGSQL();
                res.sendJSON({status: 'ok'}, 200);
                dpc(() => {
                    process.exit(0);
                });
            })
        }


        app.use((req, res, next) => {
            if (!this.args['with-auth'])
                return next();
            //if(req.url.match(/dag\-viz\.js$/))
            //    console.log("req", req.query._h)

            let auth = basicAuth(req);
            if (!req.url.startsWith('/components') &&
                !req.url.startsWith('/node_modules') &&
                (!auth || auth.name != 'dag' || auth.pass != 'dag')) {
                res.writeHead(401, {'WWW-Authenticate': 'Basic realm="Please login"'});
                return res.end();
            }

            next();
        })

        app.get('/data-slice', (req, res, next) => {
            this.dataSlice(req.query).then((data) => {
                res.sendJSON(data)
            }, (err) => {
                console.log('error:', err);
                res.sendJSON({error: err.toString()}, 500)
            });
        });

        app.get("/search", (req, res) => {
            let args = req.query.q || "";
            //console.log("getting query for:",args);
            this.doSearch(args).then((data) => {
                console.log('search:resp:', data);
                res.sendJSON(data);
            }, (err) => {
                console.log('error:', err);
                res.sendJSON({error: err.toString()}, 500);
            });
        })

        app.get("/get-block/:type/:data", (req, res) => {
            let {type, data} = req.params;
            let args = type + "/" + data;
            //console.log("getting block:", args, req.params);
            this.getBlock(args).then((data) => {
                res.sendJSON(data);
            }, (err) => {
                console.log('error:', err);
                res.sendJSON({error: err.toString()}, 500);
            });
        })

        app.get("/api/blocks/count", async (req, res) => {
            const blockCount = await this.getBlockCount();
            res.sendJSON(blockCount);
        });

        app.get("/api/blocks", async (req, res) => {
            const blocks = await this.getBlocks({
                order: req.query.order === 'DESC' ? 'DESC' : 'ASC',
                skip: Number(req.query.skip),
                limit: Number(req.query.limit),
            });
            
            res.sendJSON(blocks.map(block=>this.deserealizeBlock(block)));
        });

        app.get("/api/block/:blockHash", async (req, res) => {
            let block = await this.getBlockByHash(req.params.blockHash);
            if(!block)
                return res.sendJSON({error:'not found'},404);
            res.sendJSON(this.deserealizeBlock(block));
        });

        app.get("/api/transactions/block/:hash", async (req, res) => {
            //console.log("REQQQQQQQQQQQQ".rainbow, req.query, "PARAMS".brightRed, req.params);
            let blockHash = req.params.hash;
            let transactions = await this.sql(format(`SELECT * FROM transactions WHERE "blockHash" = '%s'`,HEX(blockHash)));
//            let transactions = await this.sql(`SELECT * FROM transactions WHERE blockhash='${blockHash}'`);

            if(transactions) {
                transactions.forEach(tx=>{
                    ['blockHash','subnetworkId','txId','hash'].forEach(prop=>{
                        tx[prop] = tx[prop].toString('hex');
                    });

                    tx.lockTime = parseInt(tx.lockTime);
//                    tx.blockhash = tx.blockhash.toString('hex');
                })
            }


            //console.log("TRANSACTIONS+++++++++++++++++++++++++++++++++++++".brightRed, transactions);
            res.sendJSON(transactions || []); // TODO: IMPLEMENT THIS
        });

        app.get("/api/transactions/address/:address/count", async (req, res)=>{
            console.log("PARAMSSSSS COUNT:::::::".brightRed, req.params, req.query);
            res.sendJSON({count: 5}); 

        });

        app.get("/api/address/:address/count", async (req, res)=>{
            console.log("PARAMSSSSS:::::::".brightRed, req.params, req.query);
            let address = req.params.address;
            let q = format(`SELECT id FROM addresses WHERE address = %L`, address);
            let rows = await this.sql(q);
            let address_id = rows.shift().id;
            console.log("ADDRESS ID ::::::::::::::::::::::::::".brightBlue, address_id);
            let qq = format(`SELECT COUNT(*) AS count FROM outputs WHERE outputs.address_id = %L `, address_id);
            let records =  await this.sql(qq); 
            console.log("got address count:",records,'=>',records[0]?.count);
            res.sendJSON(records[0]?.count);
        });

        app.get("/api/address/:address", async (req, res)=>{
            console.log("PARAMSSSSS:::::::".brightRed, req.params, req.query);
            let address = req.params.address;
            let q = format(`SELECT id FROM addresses WHERE address = %L`, address);
            let rows = await this.sql(q);
            let address_id = rows.shift().id;
            console.log("ADDRESS ID ::::::::::::::::::::::::::".brightBlue, address_id);
            // let qq = format(`SELECT COUNT(*) AS count FROM outputs LEFT JOIN transactions ON transactions.id = outputs.transaction_id WHERE outputs.address_id = %L `, address_id);
            // let records =  await this.sql(qq); 
            // let count = records.shift().count;
            // console.log("COUNT ::::::::::::::::::::::::::::::::::::::::::::".brightYellow, count);
            //select * from outputs left join transactions ON (transaction.id = output.transaction_id) where output.address id  = id
            
            //            let {order = 'ASC', skip = 0, limit = 25} = req.query;

            let query = Object.assign({order : 'ASC', skip : 0, limit : 25}, req.query);
            let { order, skip, limit } = query;
            console.log("QUERY:",query);
            let qq = format(`SELECT * FROM outputs LEFT JOIN transactions ON transactions.id = outputs.transaction_id WHERE outputs.address_id = %L ORDER BY outputs.id ${order} LIMIT ${limit} OFFSET ${skip};`, address_id);

            //return this.sql(`select * from blocks order by id ${order} LIMIT ${limit} OFFSET ${skip};`);
            console.log("QQQQQQQQQQQQQQQQQQQQQQQQQQQ".brightGreen, qq);
            try{
                let outputs = await this.sql(qq);
                outputs.forEach(output => this.prepareOutputDataForClient(output));
//                console.log(" TRANSACTIONS FOR THIS ADDRESS ++++++++++++++++++++++++".brightRed, outputs);
                res.sendJSON(outputs); 

            }catch(error){
                console.log("EROR EROR EROR EROR EROR EROR EROR EROR EROR EROR EROR EROR EROR ".brightYellow, error);
            }
        });




        app.get("/api/transaction/id/:id", async (req, res)=>{
            //console.log("PARAMSSSSS:::::::".brightRed, req.params, req.query);
            let id = req.params.id;
            let q = format(`SELECT * FROM transactions WHERE id=%L`, id); 
            let rows = await this.sql(q);
            let transaction = rows.shift();
            //console.log("TX TXT TX TXT TXT TXT TXT XT".brightRed, transaction);
            let buildTx = await this.buildTransaction(transaction);
            // let inputs = await this.sql(`SELECT * FROM inputs WHERE transaction_id='${transaction.id}'`);
            // let outputs = await this.sql(`SELECT * FROM outputs WHERE transaction_id='${transaction.id}'`);
            // inputs.forEach(input => {
            //     input.signatureScript = input.signatureScript.toString('hex');
            //     input.sequence = input.sequence.toString('hex');
            // });
            // outputs.forEach(output => {
            //     output.scriptPubKeyHex = output.scriptPubKeyHex.toString('hex');
            //     //delete output.script_pub_key_hex;
            // });

            // transaction.inputs = inputs;
            // transaction.outputs = outputs;

            // ['blockHash','subnetworkId','txId','hash'].forEach(prop=>{
            //     transaction[prop] = transaction[prop].toString('hex');
            // })
            // transaction.lockTime = parseInt(transaction.lockTime);
            // transaction.transactionTime = parseInt(transaction.transactionTime);
            // //console.log("TRANSACTION:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:".brightRed, JSON.stringify(transaction,null,'\t'));

            // for(const output of outputs) {
            //     let addr = await this.sql(`SELECT * FROM addresses WHERE id='${output.address_id}'`);
            //     if(addr && addr.length)
            //         output.address = addr[0].address.toString('hex');
            // }

            res.sendJSON(buildTx); 

        });

        app.get("/api/transaction/hash/:hash", async (req, res) => {
            //console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX".rainbow);
            let hash = req.params.hash;
            let q = format(`SELECT * FROM transactions WHERE hash='%s'`, HEX(hash));
           // console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=>",q);
            let rows = await this.sql(q);
            // if(!rows || !rows.length)
            //     return res.sendJSON({});
            let transaction = rows.shift();
           
            let buildTx = await this.buildTransaction(transaction);

           // console.log("TRANSACTION:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:".brightRed, transaction);

            // let inputs = await this.sql(`SELECT * FROM inputs WHERE transaction_id='${transaction.id}'`);
            // let outputs = await this.sql(`SELECT * FROM outputs WHERE transaction_id='${transaction.id}'`);

            // inputs.forEach(input => {
            //     input.signatureScript = input.signatureScript.toString('hex');
            //     input.sequence = input.sequence.toString('hex');
            // });
            // outputs.forEach(output => {
            //     output.scriptPubKeyHex = output.scriptPubKeyHex.toString('hex');
            //     //delete output.script_pub_key_hex;
            // });

            // transaction.inputs = inputs;
            // transaction.outputs = outputs;

            // ['blockHash','subnetworkId','txId','hash'].forEach(prop=>{
            //     transaction[prop] = transaction[prop].toString('hex');
            // })
            // transaction.lockTime = parseInt(transaction.lockTime);
            // transaction.transactionTime = parseInt(transaction.transactionTime);
            // //console.log("TRANSACTION:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:-:".brightRed, JSON.stringify(transaction,null,'\t'));

            // for(const output of outputs) {
            //     let addr = await this.sql(`SELECT * FROM addresses WHERE id='${output.address_id}'`);
            //     if(addr && addr.length)
            //         output.address = addr[0].address.toString('hex');
            // }

            res.sendJSON(buildTx); // TODO: IMPLEMENT THIS
        });


        app.get(/\/blocks?|\/utxos|\/address|\/transactions?|\/fee\-estimates/, (req, res, next) => {
            let pkg = require("./package.json");
            dataVars.set("version", pkg.version);
            res.sendFile("./index.html", {vars: dataVars});
            //sendHtmlFile({req, res, next, file:'./index.html', data:{_H}})
        })

        const dataVars = new Map();
        app.get('/', (req, res, next) => {
            let pkg = require("./package.json");
            dataVars.set("version", pkg.version);
            res.sendFile("./index.html", {vars: dataVars});
            //sendHtmlFile({req, res, next, file:'./index.html', data:{_H}})
        })

        flowRouter.init();

        //app.use("/k-explorer", serveStatic('./node_modules/k-explorer', { 'index': ['index.html', 'index.htm'] }))
        app.use('/resources', serveStatic('./resources'))
        app.use('/node_modules', serveStatic('./node_modules'))


        return new Promise((resolve, reject) => {

            let port = this.listenPort;
            // Create server
            const server = http.createServer((req, res) => {
                app.run(req, res);
            }).listen(port, () => {
                console.log(`listening on ${port}`);
                resolve();
            });

            this.io = io(server);
            this.io.on('connection', (socket) => {
                if (this.lastBlock)
                    socket.emit('last-block-data', this.lastBlock);
                for (const data of this.last_mqtt_block_updates)
                    socket.emit("dag/blocks", data);
            })
        });
    }

    async initDatabase() {

        this.uid = 'dagviz';

        const port = this.databasePort || 8309;

//        const mySQL = new MySQL({ port, database : this.uid });
        if(this.options.hostdb) {
            this.pgSQL = new PgSQL({ port, database : this.uid });
            await this.pgSQL.start()
        }

        let defaults = {
            host : 'localhost',
            port,
            user : 'dagviz',
            password : 'dagviz',
        };

        return new Promise((resolve,reject) => {
            //this.dbPool = mysql.createPool(Object.assign({ }, defaults, {
            this.dbPool = new PgPool(Object.assign({ }, defaults, {
                    // host : 'localhost', port,
                // user : 'dagviz',
                // password: 'dagviz',
                // database: this.uid, //'mysql',


                host: this.databaseHost,
                port,
                user: this.databaseUser,
                password: this.databasePassword,
                database: this.uid, //'mysql',
    

                //insecureAuth : true
            }));

            this.dbPool.on('error', (err) => {
                if(!this.pgSQL || !this.pgSQL.stopped)
                    console.log(err);
            })
            
            this.db = {
                query : async (sql, args) => {
                    if(this.pgSQL && this.pgSQL.stopped)
                        return Promise.reject("pgSQL stopped - the platform is going down!");
                    //console.log("sql:", sql, args)
                    return new Promise((resolve,reject) => {
                        this.dbPool.connect().then((client) => {
                        //     //console.log("CONNECTION:",connection);
                        //     if(err)
                        //         return reject(err);

                            client.query(sql, args, (err, result) => {
                                client.release();
                                    // console.log("SELECT GOT ROWS:",rows);
                                resolve(result?.rows);
                            });
                        }, (err) => {
                            //if(err) {
                                console.log(`Error processing SQL query:`);
                                console.log(sql);
                                console.log(args);
                                console.log(`SQL Error is: ${err.toString()}`)
                                return reject(err);
                            // }
                            // reject(err);
                        });
                    });
                }                
            }
            // this.db_.connect(async (err) => {
            //     if(err) {
            //         this.log(err);
            //         this.log("FATAL - MYSQL STARTUP SEQUENCE! [2]".brightRed);
            //         return reject(err);// resolve();
            //     }

            //     this.log("MySQL connection SUCCESSFUL!".brightGreen);


                resolve();
                // db.end(()=>{
                //     this.log("MySQL client disconnecting.".brightGreen);
                // });
            // });
        });
    }

    async initDatabase_v2() {
        const port = this.databasePort;        
        this.dbClient = new Client({
            host: this.databaseHost,
            port,
            user: this.databaseUser,
            password: this.databasePassword,
            database: this.databaseScheme,
        });
        this.dbClient.connect();
        this.promisifiedQuery = util.promisify(this.dbClient.query.bind(this.dbClient));
    }

    async sql(...args) { 
        //if(this.options.hostdb) {
        // console.log('SQL:'.brightGreen,args[0]);
            let p = this.db.query(...args);
            p.catch(e=>{
                console.log("sql:exception:", [...args], e)
            })
            return p;
        // } else {
        //     const {rows} = await this.promisifiedQuery(...args);
        //     return rows;
        // }
    }


    // async sql(...args) {
    //     const {rows} = await this.promisifiedQuery(...args);
    //     return rows;
    // }

    static DB_TABLE_BLOCKS_ORDER = [
        'blockHash',
        'acceptingBlockHash',
        'version',
        'hashMerkleRoot',
        'acceptedIDMerkleRoot',
        'utxoCommitment',
        'timestamp',
        'bits',
        'nonce',
        'blueScore',
        'isChainBlock',
        'mass',
        'parentBlockHashes',
        'childBlockHashes',
        'acceptedBlockHashes'
    ];

    static VERBOSE_BLOCK_FIELDS_TO_DB_FIELDS = {
        'hash': 'blockHash',
        'version': 'version',
        'hashMerkleRoot': 'hashMerkleRoot',
        'acceptedIDMerkleRoot': 'acceptedIDMerkleRoot',
        'utxoCommitment': 'utxoCommitment',
        'time': 'timestamp',
        'nonce': 'nonce',
        'bits': 'bits',
        //'parentHashes': 'parentBlockHashes',
        'blueScore': 'blueScore',
    }

    async initDatabaseSchema() {

        let tables = ['blocks','block_relations','last_block_hash','transactions','inputs','outputs','addresses'];
        if(this.options.dropdb) {
            while(tables.length) {
                let table = tables.shift();
                console.log('pgsql - dropping:',table);
                await this.sql(`DROP TABLE ${table}`);
            }
        }


        await this.sql(`
            CREATE TABLE IF NOT EXISTS blocks (
                "id"                      BIGSERIAL PRIMARY KEY,
                "blockHash"              BYTEA        NULL,
                "acceptingBlockHash"      BYTEA NULL,
                "acceptingBlockTimestamp" INT NULL,
                "version"                 INT             NOT NULL,
                "hashMerkleRoot"        BYTEA        NOT NULL,
                "acceptedIDMerkleRoot" BYTEA        NOT NULL,
                "utxoCommitment"         BYTEA        NOT NULL,
                "timestamp"               bigint NOT NULL,
                "bits"                    INT     NOT NULL,
                "nonce"                   BYTEA  NOT NULL,
                "blueScore"              BIGINT  NOT NULL,
                "isChainBlock"          BOOLEAN         NOT NULL,
                "mass"                    BIGINT          NOT NULL,
                "acceptedBlockHashes"   BYTEA NOT NULL,
                "parentBlockHashes"   BYTEA NOT NULL,
                "childBlockHashes"   BYTEA NOT NULL
            );        
        `);


        let blocks_idx = ['blockHash:UNIQUE', 'timestamp', 'isChainBlock', 'blueScore'];
        while (blocks_idx.length) {
            let [idx, unique] = blocks_idx.shift().split(':');
            await this.sql(`CREATE ${unique || ''} INDEX IF NOT EXISTS "idx_${idx}" ON blocks ("${idx}")`);
        }

        //id                      BIGSERIAL PRIMARY KEY,
//        await this.sql(`DROP TABLE block_relations`);

        await this.sql(`
            CREATE TABLE IF NOT EXISTS block_relations (
                parent  BYTEA NOT NULL,
                child BYTEA NOT NULL,
                linked BOOLEAN NOT NULL,
                PRIMARY KEY (parent, child)
            );
        `);

        await this.sql(`CREATE INDEX idx_child ON block_relations (child)`);
        // UNIQUE INDEX idx_child (child)

        await this.sql(`
            CREATE TABLE IF NOT EXISTS last_block_hash (
                id                      BIGSERIAL PRIMARY KEY,
                xid                     INT,
                hash  CHAR(64) NOT NULL
            );
        `);
        //UNIQUE INDEX idx_xid (xid)

        await this.sql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_xid ON last_block_hash (xid)`);



// await this.sql(`DROP TABLE transactions`);
// await this.sql(`DROP TABLE inputs`);
// await this.sql(`DROP TABLE outputs`);
        await this.sql(`
            CREATE TABLE IF NOT EXISTS transactions (
                "id"   BIGSERIAL PRIMARY KEY,
                "txId"  BYTEA NOT NULL,
                "hash"  BYTEA NOT NULL,
                "blockHash"  BYTEA NOT  NULL,
                "inputCount" INT NOT NULL,
                "outputCount" INT NOT NULL,
                "totalOutputValue" BIGINT NOT NULL,
                "lockTime" BIGINT NOT NULL,
                "transactionTime" BIGINT NOT NULL,
                "subnetworkId" BYTEA NOT NULL
            );        
        `);

        // "gas" BIGINT NOT NULL,
        // "payload" BYTEA NULL,
        // "payloadhash" BYTEA NULL

        await this.sql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_txid ON transactions ("txId")`);
        await this.sql(`CREATE INDEX IF NOT EXISTS idx_transactions_blockhash ON transactions ("blockHash")`);
                
        await this.sql(`
            CREATE TABLE IF NOT EXISTS inputs (
                "id"   BIGSERIAL PRIMARY KEY,
                "transaction_id" BIGINT NOT NULL,
                "previousTransactionId" BIGINT NOT NULL,
                "outputIndex" INT NOT NULL,
                "output_id" BIGINT NULL,
                "signatureScript" BYTEA NOT NULL,
                "sequence" BYTEA NOT NULL,
                "value" BIGINT NULL
            );        
        `);
        // await this.sql(`DROP INDEX idx_inputs_transaction_id`);
        // await this.sql(`DROP INDEX idx_outputs_transaction_id`);
        // await this.sql(`DROP INDEX idx_outputs_address_id`);
        // await this.sql(`DROP INDEX idx_addresses_address`);

        await this.sql(`CREATE INDEX IF NOT EXISTS idx_inputs_transaction_id ON inputs (transaction_id)`);
                
        await this.sql(`
            CREATE TABLE IF NOT EXISTS outputs (
                "id"   BIGSERIAL PRIMARY KEY,
                "transaction_id" BIGINT NOT NULL,
                "index" INT NOT NULL,
                "value" BIGINT NOT NULL,
                "scriptPubKeyType" INT NOT NULL,
                "scriptPubKeyHex" BYTEA NOT NULL,
                "scriptPubKeyVersion" INT NOT NULL,
                "address_id" BIGINT NOT NULL
            );        
        `);

        await this.sql(`CREATE INDEX IF NOT EXISTS idx_outputs_transaction_id ON outputs (transaction_id)`);
        await this.sql(`CREATE INDEX IF NOT EXISTS idx_outputs_address_id ON outputs (address_id)`);
        

        await this.sql(`
            CREATE TABLE IF NOT EXISTS addresses (
                "id"   BIGSERIAL PRIMARY KEY,
                "address" VARCHAR(64)
            );        
        `);

        await this.sql(`CREATE UNIQUE INDEX IF NOT EXISTS idx_addresses_address ON addresses (address)`);


        // let rows = await this.sql(`SELECT * FROM addresses`);
        // while (rows.length){
        //     let record = rows.shift();
        //     let address = (record.address || "").split(":").pop();
        //     await this.sql(`UPDATE addresses SET address = '${address}' WHERE id='${record.id}'`);
        // }

           // "gas"
           // "payload"
           // "paloadHash"


    }

    async main() {
        /*

        v2

        let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks`);
        // console.log('result:',result);
        this.lastTotal = result.shift().total;
        this.skip = this.lastTotal - this.REWIND_BLOCK_PADDING;
        if(this.skip < 0)
                this.skip = 0;
        console.log(`SELECT COUNT(*) AS total FROM blocks => ${this.skip}`);
        if(this.skip) {
            let blocks = await this.sql(`SELECT * FROM blocks ORDER BY id DESC LIMIT ${this.REWIND_BLOCK_PADDING}`); 
            this.lastBlock = blocks.shift();
            // console.log("LAST BLOCK:",this.lastBlock);
        }

        if(this.args.reset) {
            await this.resetChain(true);
        }

        this.sync();
        */
       dpc(3000, () => {
           this.updateRelations();
       });
        this.sync()
    }

    log(...args) {
        console.log(...args);
    }

    storeLastBlockHash(hash) {
        //return this.sql(`REPLACE INTO last_block_hash ( xid, hash ) VALUES (1, '${hash}')`);//, [[ 1, hash]]);
        return this.sql(`

            INSERT INTO last_block_hash (xid, hash) VALUES (1, '${hash}')
            ON CONFLICT (xid) DO UPDATE SET hash = excluded.hash;


        `);
        //    REPLACE INTO last_block_hash ( xid, hash ) VALUES (1, '${hash}')
    }

    async restoreLastBlockHash() {
        let rows = await this.sql(`SELECT hash FROM last_block_hash WHERE id = 1`);

        console.log("LAST BLOCK RETURN ROWS:", rows);

        let row = rows.shift();
        if (!row)
            return Promise.resolve(null);
        console.log('restoring last block hash:', row.hash);
        return row.hash;
    }

    async getRPCHeaderCount() {
        const result = await this.rpc.client.call('getBlockCountRequest', {});
        return Number(result.headerCount);
    }

    async getBlockTransactions(hash, ids){

        const MAX_TXID_MAP_SIZE = 4096*4;
        try{
            const result = await this.rpc.client.call('getBlockRequest', {hash, includeTransactionVerboseData: true});
            //console.log("RESULT::::::::::::::::::::::::::::".brightRed, result.blockVerboseData.transactionVerboseData);

            // let outputs = [];
            // let inputs = [];

            let total_output_value = new Decimal(0);

            let transactions = result.blockVerboseData.transactionVerboseData;
            while(transactions.length) {
                let transaction = transactions.shift();
                let {txId, transactionVerboseInputs : inputs, transactionVerboseOutputs : outputs, hash, blockHash, lockTime, time, subnetworkId} = transaction;

                try {

                    if(this.txMap.has(txId))
                        continue;

                    outputs.forEach((output) => {
                        total_output_value = total_output_value.add(output.value);
                    })

                    let cols = [HEX(txId), HEX(hash), HEX(blockHash), inputs.length, outputs.length, total_output_value.toFixed(), lockTime, time, HEX(subnetworkId)];

                    // ON CONFLICT("txid") DO UPDATE SET txid=EXCLUDED.txid 
                    const query = format(`INSERT INTO transactions ("txId", "hash", "blockHash", "inputCount", "outputCount", "totalOutputValue", "lockTime", "transactionTime", "subnetworkId") VALUES (%L) RETURNING id`, cols);
                    //console.log("QUERYYYYYY:::::::".brightYellow,query);
                    let resp = await this.sql(query);
                    //console.log("GOT TX INSERT RESP",resp);
                    if(!resp || !resp.length) {
                        console.log("TX INSERT NO RESP FO TXID", txId);
                        continue;
                    }
                    let transaction_id = resp.shift()?.id;

                    if(!transaction_id) {
                        console.log('error obtaining transaction_id on sql insert');
                        console.log('OFFENDING QUERY:', query);
                        continue;
                    }

                    this.txMap.set(txId,{transaction_id,ts:Date.now()});
                    if(this.txMap.size > MAX_TXID_MAP_SIZE) {
                        let diff = this.txMap.size - MAX_TXID_MAP_SIZE;
                        let keys = this.txMap.keys();
                        let purge = [];
                        while(diff--)
                            purge.push(keys.next().value);
                        for(let _txid of purge)
                            this.txMap.delete(_txid);
                    }

                    while(outputs.length) {
                        let output = outputs.shift();
                        let { value, index, scriptPublicKey } = output;
                        let { address, type, hex, version } = scriptPublicKey;
                        address = address.split(":").pop();
                        let addr = await this.sql(format('INSERT INTO addresses (address) VALUES (%L) ON CONFLICT("address") DO UPDATE SET address=EXCLUDED.address RETURNING id', [address]));
                       // console.log('-------------------------------------- addr'.brightCyan, addr);
                        let address_id = addr.shift()?.id;

                        let output_cols = [transaction_id, index, value, 0, HEX(hex), version, address_id];
                        await this.sql(format(`INSERT INTO outputs (transaction_id, index, value, "scriptPubKeyType", "scriptPubKeyHex", "scriptPubKeyVersion", address_id) VALUES (%L)`, output_cols));
                    }

                    // let total_input_value = Decimal(0);
                    while(inputs.length) {
                        let input = inputs.shift();
                        //console.log("INPUT======================================".brightRed, input);
                        let { txId : previous_txId, outputIndex, sequence, scriptSig } = input;
                        let signature_script_hex = scriptSig.hex;

                        let entry = this.txMap.get(previous_txId);
                        let previous_transaction_id = entry?.transaction_id;
                        if(entry === undefined) {
                            //console.log('@@@@@ =>'.brightCyan,format(`SELECT id FROM transactions WHERE "txId" = %L`,HEX(previous_txId)));
                            let ret = await this.sql(format(`SELECT id FROM transactions WHERE "txId" = %L`,HEX(previous_txId)));
                            //console.log("PREVIOUS TRANSACTION ID:::::::::::::::::::::::::::::::::::::::::::".brightRed, ret);
                            previous_transaction_id = ret.shift()?.id;
                        }

                        if(!previous_transaction_id) {
                            console.log("error - missing transaction id:".brightRed, previous_txId);
                            continue;
                        }

                        //console.log(`SELECT id FROM outputs WHERE transaction_id='${previous_transaction_id}' AND index=${outputIndex}`);
                        let oresp = await this.sql(`SELECT id, value FROM outputs WHERE transaction_id='${previous_transaction_id}' AND index=${outputIndex}`);
                        let output = oresp.shift();
                        let output_id = output?.id||null;
                        let value = output?.value||null;
                        // total_input_value = total_input_value.add(value);

                       // console.log("FOUND OUTPUT ID",output_id);
                        let input_cols = [transaction_id, previous_transaction_id, outputIndex, output_id, HEX(signature_script_hex), sequence, value];
                        //console.log(format(`INSERT INTO inputs (transaction_id, "previousTransactionId", "outputIndex", output_id, "signatureScript", sequence) VALUES (%L)`, input_cols));
                        await this.sql(format(`INSERT INTO inputs (transaction_id, "previousTransactionId", "outputIndex", output_id, "signatureScript", sequence, value) VALUES (%L)`, input_cols));
                        let test = await this.sql(format(`SELECT * FROM inputs WHERE transaction_id= %L`, transaction_id));
                        //console.log("INPUTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT".brightRed, test);
                    }

                    // total_input_value = total_input_value.toFixed();
                    // await this.sql(format(`UPDATE transactions SET "totalInputValue"=%L WHERE id=%L`,total_input_value,transaction_id));

                } catch(ex) {
                    console.log("error ingesting transaction".brightRed, txId);
                    console.log(ex);
                }

            }
       

        }catch(error){
            console.log("error".brightRed, error);
        }
    }

    fetchAddressTxs(address, options = {}) {

        return Promise.reject('refactoring');


        return new Promise((resolve, reject) => {
            let args = Object.entries(options).map(([k, v]) => `${k}=${v}`).join('&');
            rp({url: `${this.kasparov}/transactions/address/${address}?${args}`, rejectUnauthorized}).then((text) => {
                let data = null;
                try {
                    data = JSON.parse(text);
                } catch (ex) {
                    reject(ex);
                }
                resolve(data);
            }, (err) => {
                if ((err + "").indexOf('ECONNREFUSED'))
                    console.log("ECONNREFUSED".red, `${this.kasparov}/transactions/address/${address}?${args}`)
                else
                    console.log(err);
                reject(err);
            });

        })
    }

    async bluestBlockHash() {
        const rows = await this.sql('SELECT "blockHash" FROM blocks order by "blueScore" desc limit 1');
        if (rows.length === 0) {
            return ""
        }
        const [bluestBlock] = rows;
        return bluestBlock.blockHash.toString("hex");
    }

    async selectedTipHash() {
        const rows = await this.sql('SELECT "blockHash" FROM blocks WHERE "isChainBlock" ORDER BY "blueScore" DESC LIMIT 1');
        if (rows.length === 0) {
            return ""
        }
        return rows[0].blockHash.toString("hex");
    }

    async fetchBlocks() {
        const bluestBlockHash = await this.bluestBlockHash();
        const {blockVerboseData} = await this.rpc.client.call('getBlocksRequest', {
            lowHash: bluestBlockHash,
            includeBlockVerboseData: true,
            includeTransactionVerboseData: true
        });
        //console.log("blockVerboseData", blockVerboseData[0], bluestBlockHash)
        if (blockVerboseData.length === 1 && blockVerboseData[0].hash === this.lastBlock.hash) {
            return {done: true}
        }
        return {blocks: blockVerboseData, done: false}
    }

    async fetchSelectedChain() {
        const selectedTipHash = await this.selectedTipHash();
        return this.rpc.client.call("getVirtualSelectedParentChainFromBlockRequest", {startHash: selectedTipHash})
    }

    async resetChain(dropdb = false) {
        console.log(`initiating database purge...`);
        if (dropdb) {
            await this.sql(`DROP TABLE blocks CASCADE`);
            await this.sql(`DROP TABLE block_relations CASCADE`);
            await this.sql(`DROP TABLE last_block_hash CASCADE`);
            await this.initDatabaseSchema();
        } else {
            await this.sql(`TRUNCATE TABLE blocks`);
            await this.sql(`TRUNCATE TABLE block_relations`);
        }

        this.lastTotal = 0; //total;
        this.skip = 0;
        this.initRTBS();
        this.io.emit('chain-reset');
    }

    async sync() {

        try {
            const total = await this.getRPCHeaderCount();
            if (this.lastTotal !== undefined && this.lastTotal > total + 1e4 || this.skip > total + 1e3) {
                console.log(`incloming total block count ${total}+1e4 is less than previous total ${this.lastTotal}`);
                await this.resetChain();
                dpc(1000, () => {
                    this.sync();
                })
                return;
            }

            // console.log(`fetching: ${skip}`);
            while (true) {
                let {blocks, done} = await this.fetchBlocks();
                if (done) {
                    break;
                }

                // if (blocks.length < 100)
                //     this.io.emit('dag/blocks', blocks);

                this.skip += blocks.length;
        
                this.lastBlock = blocks[0];
                await this.storeLastBlockHash(this.lastBlock.hash);

                const pre_ = blocks.length;
                blocks = blocks.filter(block => !this.rtbsMap[block.hash]);
                const post_ = blocks.length;
                if (!this.tracking && pre_ != post_)
                    this.tracking = true;
                if (blocks.length) {
                    if (this.tracking) {
                        console.log(`WARNING: detected at least ${blocks.length} database blocks not visible in MQTT feed!`);
                        console.log(' ->' + blocks.map(block => block.hash).join('\n'));
                        console.log(`possible MQTT failure, catching up via db sync...`);
                    }

                    await this.post(blocks);
                }
            }

            const selectedChainChanges = await this.fetchSelectedChain();
            await this.postSPC(selectedChainChanges);

        } catch (err) {
            if(!this.faults)
                this.faults = 0;
            this.faults++;
            const wait = 3500;
            console.error(`Sync error: ${err}. Restarting sync in ${wait} milliseconds (${this.faults})`)
            dpc(wait, () => {
                this.sync();
            });
            return;
        }

        const wait = 300 * 1000;
        console.log(`Finished to sync. Restarting sync in ${wait} milliseconds`)
        dpc(wait, () => {
            this.sync();
        });
    }

    rewind(nblocks) {
        this.skip -= nblocks;
        if (this.skip < 0)
            this.skip = 0;
        console.log(`warning: rewinding ${nblocks}; new position ${this.skip}`);
    }

    verboseBlockToDBBlock(verboseBlock) {
//        console.log("VERBOSE BLOCK:", verboseBlock);
        const dbBlock = {
            mass: 0,
            acceptedBlockHashes: '',
        };
        let buffers = ['hash','acceptedIDMerkleRoot','hashMerkleRoot','utxoCommitment'];
        for (const field in verboseBlock) {
            if (DAGViz.VERBOSE_BLOCK_FIELDS_TO_DB_FIELDS.hasOwnProperty(field)) {
                dbBlock[DAGViz.VERBOSE_BLOCK_FIELDS_TO_DB_FIELDS[field]] = 
                    buffers.includes(field) ? Buffer.from(verboseBlock[field],'hex') : verboseBlock[field];
            }
        }
        dbBlock.parentBlockHashes = HashesToBuffer(verboseBlock.parentHashes); //.join(',');
//        dbBlock.childBlockHashes = HashesToBuffer(verboseBlock.childrenHashes); //.join(',');
        dbBlock.bits = parseInt(verboseBlock.bits, 16);
        dbBlock.childBlockHashes = '';
        dbBlock.isChainBlock = Number(verboseBlock.blueScore) === 0; // Every block except genesis is not a chain block by default.

        //console.log("verboseBlock",verboseBlock);
        //console.log("dbBlock",dbBlock);

//         dbBlock.hash = Buffer.from(verboseBlock.hash,'hex');
//         dbBlock.acceptedIDMerkleRoot = Buffer.from(verboseBlock.acceptedIDMerkleRoot,'hex');
//         dbBlock.hashMerkleRoot = Buffer.from(verboseBlock.hashMerkleRoot,'hex');
//         dbBlock.utxoCommitment = Buffer.from(verboseBlock.utxoCommitment,'hex');
// //        dbBlock.hash = Buffer.from(verboseBlock.hash,'hex');
//         //['hash','acceptingBlockHash','hashMerkleRoot','utxoCommitment'].forEach(p => Buffer.from(verboseBlock[p], 'hex'))

        return dbBlock;
    }

    async postSPC(args){
        const {addedChainBlocks, removedChainBlockHashes} = args;
        
        if (removedChainBlockHashes && removedChainBlockHashes.length) {
            let removedChainBlockHashes_ = removedChainBlockHashes.map(hash=>Buffer.from(hash,'hex'));
            //this.sql(format(`UPDATE blocks SET acceptingBlockHash='', isChainBlock=FALSE WHERE (blocks.blockHash) IN (%L)`, removedBlockHashes));
            await this.sql(format(`UPDATE blocks SET "isChainBlock"=FALSE WHERE ("blocks"."blockHash") IN (%L)`, removedChainBlockHashes_));
            await this.sql(format(`UPDATE blocks SET "acceptingBlockHash"='' WHERE ("blocks"."acceptingBlockHash") IN (%L)`, removedChainBlockHashes_));
        }

        for (const chainBlock of addedChainBlocks) {
            const {hash, acceptedBlocks} = chainBlock;
            const hash_ = Buffer.from(hash,'hex');
            const acceptedBlockHashes = acceptedBlocks.map(block => Buffer.from(block.hash,'hex'));
            await this.sql(format(`UPDATE blocks SET "isChainBlock"=TRUE WHERE "blockHash" = %L`, hash_));
            await this.sql(format(`UPDATE blocks SET "acceptingBlockHash" = %L WHERE ("blockHash") IN (%L)`, hash_, acceptedBlockHashes));
        }
    }

    async post(blocks) {
        this.lastBlock = blocks[blocks.length - 1];
        let relations = [];

        blocks.forEach(block => {
            if (block.parentHashes) {
                block.parentHashes.forEach(hash => relations.push([HEX(hash), HEX(block.hash), false]));
            }
        });

        this.verbose && process.stdout.write(` ${blocks.length}[${relations.length}] `);

        const dbBlocks = blocks.map(block => this.verboseBlockToDBBlock(block));
        // if(dbBlocks.length)
        // console.log(dbBlocks[0]);
        // let blockData = dbBlocks.map(dbBlock => {
        //     return DAGViz.DB_TABLE_BLOCKS_ORDER.map(key => dbBlock[key]);
        // });

        let blockData = dbBlocks.map(dbBlock => {
            let values = DAGViz.DB_TABLE_BLOCKS_ORDER.map(key => format(`%L`, dbBlock[key])).join(',');
            return `(${values})`;
        }).join(',');

        const dbFields = DAGViz.DB_TABLE_BLOCKS_ORDER.map(field => '"' + field + '"')

        await this.sql(`
                    INSERT INTO blocks (${dbFields.join(', ')})
                    VALUES ${blockData}
                    ON CONFLICT ("blockHash") DO NOTHING
                    ;
                `);

        if (relations.length) {

            let query = format(`
                        INSERT INTO block_relations (
                            parent, child, linked
                        ) VALUES %L
                        ON CONFLICT (parent, child) DO UPDATE
                        SET linked = FALSE;
                    `, relations);

            await this.sql(query);
        }

        await this.update();
    }


    async updateRelations() {
        let rows = await this.sql('SELECT * FROM block_relations WHERE linked = FALSE LIMIT 1000');
        //await this.sql('UPDATE block_relations SET linked = TRUE WHERE linked = FALSE LIMIT 1000');
        await this.sql('UPDATE block_relations SET linked = TRUE WHERE child IN (SELECT child FROM block_relations WHERE linked = FALSE LIMIT 1000);');

        //let hashMap = {}
        let hashSet = new Set();
        rows.forEach((row) => {
            // row.parent = row.parent.
            // hashMap[row.child] = true;
            // hashMap[row.parent] = true;
            hashSet.add(row.parent);
        })
        let blockHashes = [...hashSet]; //Object.keys(hashMap);
        // console.log(`+ processing ${blockHashes.length} blocks`)
        while (blockHashes.length) {
            let hash = blockHashes.shift()
            let children = await this.sql(format(`SELECT * FROM block_relations WHERE parent = %L`, hash));
            children = HashesToBuffer(children.map(row => row.child));
            
            await this.sql(`UPDATE blocks SET "childBlockHashes" = %L WHERE "blockHash"=%L`,children,hash);
            // await this.sql(`UPDATE blocks SET "childBlockHashes" = '${children.join(',')}' WHERE "blockHash"='${hash}'`,children,hash);
            // console.log(`+ updating block children [${children.length}]`);
        }

        dpc(rows.length == 1000 ? 0 : 1000, () => {
            this.updateRelations();
        })

        //     let children = await this.sql(`
        //     SELECT blocks.blockHash, block_relations.parent, block_relations.child FROM blocks 
        //     INNER JOIN ( 
        //         SELECT * FROM blocks WHERE blocks.${unit} >= ${from} AND blocks.${unit} <= ${to} 
        //         ORDER BY blocks.${unit} 
        //         LIMIT ${limit}
        //     ) X ON (blocks.blockHash = X.blockHash)
        //     LEFT JOIN block_relations ON block_relations.parent = blocks.blockHash 
        // `);
    }

    update() {
        return new Promise(async (resolve, reject) => {

            resolve();

            // this.sql(`
            //     UPDATE blocks AS a INNER JOIN blocks AS b on a.blockHash == b.acceptingBlockHash SET 
            // `).then(resolve,reject);


        })
    }

    NormalizeBlock(block) {
        let o = {};
        DAGViz.DB_TABLE_BLOCKS_ORDER.forEach(v => o[v] = block[v]);
        if (block.lseq)
            o.lseq = block.lseq
        return o;
    }

    dataSlice(args) {
        return new Promise(async (resolve, reject) => {

            let {from, to, unit} = args;
            // console.log(`slice: ${from}-${to}`);
            if (!from && !to) {
                to = Date.now() / 1000;
                from = to - 1000 * 60 * 60;
            }

            if (!unit)
                reject('must supply units');

            if (!['timestamp', 'lseq', 'blueScore'].includes(unit))
                reject(`invalid unit '${unit}'`);

            if (unit == 'lseq')
                unit = 'id';

            from = parseInt(from);
            to = parseInt(to);
            if (from < 0)
                from = 0;
            if (to < from)
                to = from + 10;

            // console.log(`unit: ${unit} from: ${from} to: ${to}`);

            let limit = 100;

            try {
                // console.log("REQUESTING...")

                let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks WHERE "${unit}" >= ${from} AND "${unit}" <= ${to}`);
                // let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks`);
                // console.log('result:',result);
                let total = result.shift().total;
                // console.log(`SELECT * FROM blocks WHERE ${unit} >= ${from} AND ${unit} <= ${to} ORDER BY ${unit} LIMIT ${limit}`);
                let blocks = await this.sql(`SELECT * FROM blocks WHERE "${unit}" >= ${from} AND "${unit}" <= ${to} ORDER BY "${unit}" LIMIT ${limit}`);
                // console.log("BLOCKS:", blocks);

                if (this.args.latency) {
                    await this.sleep(parseInt(this.flags.latency));
                }
                // console.log(`SELECT blocks.blockHash, block_relations.parent, block_relations.child FROM blocks LEFT JOIN block_relations ON block_relations.child = blocks.blockHash WHERE blocks.${unit} >= ${from} AND blocks.${unit} <= ${to} LIMIT ${limit}`);
                // let parents = await this.sql(`SELECT blocks.blockHash, block_relations.parent, block_relations.child FROM blocks LEFT JOIN block_relations ON block_relations.child = blocks.blockHash WHERE blocks.${unit} >= ${from} AND blocks.${unit} <= ${to} ORDER BY blocks.${unit} LIMIT ${limit}`);
                // let children = await this.sql(`SELECT blocks.blockHash, block_relations.parent, block_relations.child FROM blocks LEFT JOIN block_relations ON block_relations.parent = blocks.blockHash WHERE blocks.${unit} >= ${from} AND blocks.${unit} <= ${to} ORDER BY blocks.${unit} LIMIT ${limit}`);

                // let parents = await this.sql(`
                //     SELECT blocks.blockHash, block_relations.parent, block_relations.child FROM blocks 
                //     INNER JOIN ( 
                //         SELECT * FROM blocks WHERE blocks.${unit} >= ${from} AND blocks.${unit} <= ${to} 
                //         ORDER BY blocks.${unit} 
                //         LIMIT ${limit}
                //     ) X ON (blocks.blockHash = X.blockHash)
                //     LEFT JOIN block_relations ON block_relations.child = blocks.blockHash 
                // `);


                // let children = await this.sql(`
                //     SELECT blocks.blockHash, block_relations.parent, block_relations.child FROM blocks 
                //     INNER JOIN ( 
                //         SELECT * FROM blocks WHERE blocks.${unit} >= ${from} AND blocks.${unit} <= ${to} 
                //         ORDER BY blocks.${unit} 
                //         LIMIT ${limit}
                //     ) X ON (blocks.blockHash = X.blockHash)
                //     LEFT JOIN block_relations ON block_relations.parent = blocks.blockHash 
                // `);


                // let children = await this.sql(`
                //     SELECT blocks.blockHash, block_relations.parent, block_relations.child FROM blocks 
                //     LEFT JOIN block_relations ON block_relations.parent = blocks.blockHash 
                //     WHERE blocks.${unit} >= ${from} AND blocks.${unit} <= ${to} 
                //     ORDER BY blocks.${unit} 
                //     LIMIT ${limit}`);


                // [ blocks, relations ] = await Promise.all([blocks, relations]);
                // console.log("RESPONDING...");
                const blockHashMap = {};
                blocks = blocks.map(block => {
                    return this.deserealizeBlock(block);
                    // block.lseq = block.id;
                    // block.parentBlockHashes = block.parentBlockHashes.split(',');
                    // block.childBlockHashes = block.childBlockHashes.split(',');
                    // return this.NormalizeBlock(block);
                });
                // parents.forEach(({ parent, child}) => {
                //     let block = blockHashMap[child];
                //     if(!block)
                //         return; // TODO - obtain auxiliary data
                //     if(!block.parentBlockHashes)
                //         block.parentBlockHashes = [];
                //     block.parentBlockHashes.push(parent);
                // });

                // children.forEach(({ parent, child}) => {
                //     let block = blockHashMap[parent];
                //     if(!block)
                //         return; // TODO - obtain auxiliary data
                //     if(!block.childBlockHashes)
                //         block.childBlockHashes = [];
                //     block.childBlockHashes.push(child);
                // });

                if (!blocks.length) {
                    resolve({blocks, total, max: null});
                    return
                }
                let tail = blocks.length - 1;
                let last = blocks[tail][unit];
                if (last != blocks[0][unit]) {
                    let last = blocks[tail--][unit];

                    while (tail && last == blocks[tail]) {
                        last = blocks[tail--][unit];
                    }
                }

                let max = null;
                if (this.lastBlock) {
                    max = this.lastBlock[unit];
                }
                // console.log(`blocks: ${blocks.length} last: ${last} total: ${total} max: ${max}`);
                resolve({blocks, last, total, max});
            } catch (ex) {
                console.log(ex);
                reject(ex);
            }

        })
    }

    async getBlock(args_) {

        let args = args_.split('/');

        let type = args.length > 1 ? args.shift() : 'blockHash';

        args = args.shift().split('x')
        // console.log('getBlock type:',type,'args:',args);
        if (!['blockHash', 'lseq', 'block'].includes(type))
            return Promise.reject('invalid getBlock() type');

        args = args.filter(v => v);

        if (!args.length)
            return Promise.reject(`invalid request: no arguments for ${type}`);

        type = {
            'lseq': 'id',
            'block': 'blockHash'
        }[type] || type;

        //let hashes = hashes.split(':');

        if (type == 'id') {
            args = args.map((arg) => {
                return parseInt(arg, 16);
            });
        }

        //console.log(`asing for blocks:`, args);
        let blocks = await this.sql(`SELECT * FROM blocks WHERE ${type} = ANY ($1)`, [args]);// ($1::list)`, [args]); $1::int[]
        //console.log("GOT BLOCKS:", blocks);
        // if(!blocks.length)
        //     return null;

        blocks = blocks.map(block => this.deserealizeBlock(block));
        // console.log("responding:",blocks);
        return Promise.resolve(blocks);
    }

    deserealizeBlock(block) {
        try{
//            console.log("deserealize block A:", block);
            block.lseq = block.id;
            block.nonce = block.nonce.toString();
            ['blockHash','acceptedIDMerkleRoot','hashMerkleRoot','utxoCommitment'].forEach(p => block[p]=block[p].toString('hex'));

            // if (!block.parentBlockHashes) {//} === "") {
            //     block.parentBlockHashes = []
            // } else {
                block.parentBlockHashes = BufferToHashes(block.parentBlockHashes); //block.parentBlockHashes.split(',');
//            }
            block.childBlockHashes = BufferToHashes(block.childBlockHashes);
            //block.childBlockHashes = block.childBlockHashes.split(',');
            block.acceptedBlockHashes = BufferToHashes(block.acceptedBlockHashes);//.split(',');


//            let accepted_diff = BufferToHashes(block.acceptedBlockHashes);//.split(',');


            //let accepted_diff = block.acceptedBlockHashes.split(',');
/*
            let abh = block.parentBlockHashes.slice();
            accepted_diff.forEach((v) => {
                let op = v.charAt(0);
                let hash = v.substring(1);
                if (op == '-') {
                    let idx = abh.indexOf(hash);
                    if (idx == -1) {

                    } else {
                        abh.splice(idx, 1);
                    }
                } else if (op == '+') {
                    abh.push(hash);
                }
            })
            block.acceptedBlockHashes = abh;
*/


            if (block.acceptingBlockHash) {
                block.acceptingBlockHash = block.acceptingBlockHash.toString('hex'); //BufferToHashes(block.acceptingBlockHash);
            //     block.acceptingBlockHash = block.acceptingBlockHash.trim();
            }
        }catch(error){
            console.log("ERROR".brightRed, error);
            console.log("BLOCK:".brightRed, block);
        }

//        console.log("deserealize block B:", block);


        return this.NormalizeBlock(block);
    }

    async doSearch(text) {
console.log('search request',text);;
        let blocks = null;

        //console.log('text length:',text.length);
        if (/^(kaspatest:|kaspa:)/.test(text) || text.length == 42) {
            let adress = text;
            if (adress.indexOf(":") > -1)
                adress = adress.split(":")[1];
            if (adress.length == 42) {
                //blocks = await this.sql(`SELECT * FROM blocks WHERE blockHash=$1`, [_text]);
                let transactions = await this.fetchAddressTxs(text)

                let hashes = transactions.filter(t => t.acceptingBlockHash)
                    .map(t => t.acceptingBlockHash);
                //console.log("doSearch:transactions hashes", hashes)
                blocks = [];
                if (hashes.length)
                    blocks = await this.sql(format(`SELECT * FROM blocks WHERE "blockHash" IN (%L)`, hashes));
            }
        }

        if (!blocks && text.length == 64) {
            console.log("SEARCH", text);
            blocks = await this.sql(format(`SELECT * FROM blocks WHERE "blockHash"=%L`, Buffer.from(text,'hex')));
        }

        //console.log(blocks);
        blocks = blocks.map(block => this.deserealizeBlock(block));
        // console.log("responding:",blocks);
        return Promise.resolve({blocks});

        //return Promise.reject('Not Found');
    }

    sleep(t) {
        return new Promise((resolve) => {
            dpc(t, resolve);
        })
    }
}

(async () => {
    const dagviz = new DAGViz();
    dagviz.init();
})();