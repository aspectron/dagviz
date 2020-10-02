const crypto = require('crypto');
const fs = require('fs');
//const mysql = require('mysql');
const { Pool : PgPool } = require('pg');
const format = require('pg-format');
var http = require('http')
var serveStatic = require('serve-static')
const rp = require('request-promise');
const utils = require('@aspectron/flow-utils');
const { dpc } = require("@aspectron/flow-async");
//const MySQL = require('./lib/mysql');
const PgSQL = require('./lib/pgsql');
const basicAuth = require('basic-auth');
const io = require('socket.io');//(http);
const mqtt = require('mqtt');
const path = require('path');
const WebApp = require('./web-app.js');
const FlowRouter = require('@aspectron/flow-router');
const colors = require('colors');
//const ejs = require('ejs')

let args = utils.args();
const DUMMY_TX = true;
const USE_LOCAL_KASPAROV = !!args['use-local-kas'];
const rejectUnauthorized = false;
console.log(`!!! WARNING: 'USE_LOCAL_KASPAROV == ${USE_LOCAL_KASPAROV}'`.redBG.white.bold)

const BLOCK_PROPERTIES = [
    "blockHash", 
    "parentBlockHashes", 
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

        if(this.args.kdx) {
            this.kasparov = `http://localhost:11224`;
            this.mqtt = {
                address : "mqtt://localhost:19792",
                username : this.args['mqtt-user'] || 'user',
                password : this.args['mqtt-pass'] || 'pass'
            };
        } else {
            this.kasparov = this.args['kasparov'] || `http://kasparov-dev-auxiliary-open-devnet.daglabs.com:8080`;
            this.mqtt = {
                address : this.args['mqtt-address'] || "mqtt://kasparov-dev-auxiliary-open-devnet.daglabs.com:1883",
                username : this.args['mqtt-user'] || 'user',
                password : this.args['mqtt-pass'] || 'pass'
            };
        }

        console.log(`kasparov api server at ${this.kasparov}`);
        this.uid = 'dagviz'+this.hash(this.kasparov).substring(0,10);

        this.verbose = this.args.verbose ? true : false;

        this.REWIND_BLOCK_PADDING = 60 * 60;
        this.skip = 0;

        this.blockTimings = [];

    }
    
    async initRTBS() {
        this.rtbs = [ ];
        this.rtbsMap = { };
        return Promise.resolve();
    }
    

    hash(data,h='sha256') {
        return crypto.createHash(h).update(data).digest('hex');
    }

    async init() {
        await this.initRTBS();
        await this.initDatabase();
        await this.initDatabaseSchema();
        await this.initLastBlockTracking();
        await this.initMQTT();
        await this.initHTTP();

        return this.main();
    }

    async shutdownPGSQL(){
        if(this.pgSQL){
            this.pgSQL.log("got shutdownPGSQL".brightYellow)
            await this.pgSQL.stop();
        }
    }

    async shutdown() {
        if(this.pgSQL)
            await this.pgSQL.stop();
            dpc(()=>{
                process.exit(0);
            });
    }

    async initLastBlockTracking() {

        this.lastBlockHash = await this.restoreLastBlockHash();
        // await this.rewindToLastBlockHash();
    }

    async rewindToLastBlockHash() {
        if(this.lastBlockHash) {
            let rows = await this.sql(`SELECT * FROM blocks WHERE blockHash = '${this.lastBlockHash}'`);
            if(rows.length) {
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

    async initMQTT() {

        if(this.args['disable-mqtt']) {
            // console.log(`!!! WARNING: MQTT IS DISABLED`.redBG.brightWhite);
            return Promise.resolve();
        }

        console.log("MQTT connecting to:", this.mqtt);

        const client = mqtt.connect(this.mqtt.address,{
            clientId:"mqtt_"+Math.round(Date.now()*Math.random()).toString(16),
            username: this.mqtt.username, //'user',
            password: this.mqtt.password //'pass'
        });
        
        client.subscribe("dag/blocks",{qos:1});
        client.subscribe("dag/selected-tip",{qos:1});
        client.subscribe("dag/selected-parent-chain",{qos:1});
        client.on("connect",() => {
            console.log("MQTT connected");

            // this.resync(this.last_block_hash);
            this.rewindToLastBlockHash();



            // TODO @aspect - resync from last known
        })
        
        client.on('message',(topic, message, packet) => {
            // console.log('topic:',topic);
            //topic = 'MQTT_'+topic.replace(/\W/g,'_')+'';
            try {
                if(this[topic])
                    this[topic](JSON.parse(message.toString()));
            } catch(ex) {
                console.log(ex);
                console.log('while parsing:',message.toString());
            }
            // console.log("MQTT message is "+ message);
            // console.log("MQTT topic is "+ topic);
        });
    }

    serializeBlock(block) {
        return BLOCK_PROPERTIES.map(p=>block[p]);
    }

    async "dag/blocks"(block) {

        const ts = Date.now();
        // while(this.blockTimings[0] < ts-1000*15)
        //     this.blockTimings.shift();
        // this.blockTimings.push(ts);
        // let rate = this.blockTimings.length / (ts - this.blockTimings[0]) * 1000;

        let rate = NaN;
        if(this.rtbs.length) {
            let t0 = this.rtbs[0].timestamp;
            let t1 = this.rtbs[this.rtbs.length-1].timestamp;
            let delta = t1-t0;
            rate = 1.0 / (delta / this.rtbs.length);
            console.log('delta:',delta,'rate:',rate,'t:',t0,'rtbs:',this.rtbs.length);
        }

        // console.log('received: dag/blocks',blocks);
        this.io.emit("dag/blocks",{ blocks : [this.serializeBlock(block)], rate});

        this.lastBlockHash = block.blockHash;
        
        await this.storeLastBlockHash(block.blockHash);

        await this.postRTB(block);
    }

    async "dag/selected-parent-chain"(args) {
        // console.log("dag/selected-parent-chain");
        this.io.emit("dag/selected-parent-chain",args);

        const { addedChainBlocks, removedBlockHashes } = args;

        if(removedBlockHashes && removedBlockHashes.length) {
            //this.sql(format(`UPDATE blocks SET acceptingBlockHash='', isChainBlock=FALSE WHERE (blocks.blockHash) IN (%L)`, removedBlockHashes));
            await this.sql(format(`UPDATE blocks SET isChainBlock=FALSE WHERE (blocks.blockHash) IN (%L)`, removedBlockHashes));
            await this.sql(format(`UPDATE blocks SET acceptingBlockHash='' WHERE (blocks.acceptingBlockHash) IN (%L)`, removedBlockHashes));
        }

        if(addedChainBlocks && addedChainBlocks.length) {
            while(addedChainBlocks.length) {
                let instr = addedChainBlocks.shift();
                const { hash, acceptedBlockHashes } = instr;
                await this.sql(`UPDATE blocks SET isChainBlock = TRUE WHERE blockHash = '${hash}'`);
                await this.sql(format(`UPDATE blocks SET acceptingBlockHash = '${hash}' WHERE (blockHash) IN (%L)`, acceptedBlockHashes));
            }
        }
    }

    static MAX_RTBS_BLOCKS = 2016;

    postRTB(block) {
        this.rtbs.push({ hash : block.blockHash, timestamp : block.timestamp });    // parent chain block notifications
        this.rtbsMap[block.blockHash] = true;
        while(this.rtbs.length > DAGViz.MAX_RTBS_BLOCKS)
            delete this.rtbsMap[this.rtbs.shift().hash];

        return this.post([block]);
    }

    async "dag/selected-tip"(message) {

        // console.log("dag/selected-tip");

        if(!message.blockHash)
            return console.log('invalid mqtt message:', message);
        
        const block = message;
//        this.io.emit("dag/selected-tip", this.serializeBlock(block));

        this.sql(`UPDATE blocks SET isChainBlock = TRUE WHERE blockHash = '${block.blockHash}'`);


        this.postRTB(block);
        // "real-time" blocks - data received at runtime...

        // let blocks = [message].map(block => DAGViz.DB_TABLE_BLOCKS_ORDER.map(field => block[field]));

        // await this.sql(`
        //     REPLACE INTO blocks (
        //         ${DAGViz.DB_TABLE_BLOCKS_ORDER.join(', ')}
        //     ) VALUES ?
        // `, [blocks]);
    }

    async initHTTP() {
        const app = new WebApp();
        const flowRouter = new FlowRouter(app, {
            rootFolder:path.dirname(__filename),
            folders:[{url:'/components', folder:'/components'}]
        });

        if(this.args.kdx) {
            app.get('/stop', async(req, res)=>{
                await this.shutdownPGSQL();
                res.sendJSON({ status : 'ok' }, 200);
                dpc(()=>{
                    process.exit(0);
                });
            })
        }

        

        app.use((req, res, next)=>{
            if(!this.args['with-auth'])
                return next();
            //if(req.url.match(/dag\-viz\.js$/))
            //    console.log("req", req.query._h)

            let auth = basicAuth(req);
            if(!req.url.startsWith('/components') && 
                !req.url.startsWith('/node_modules') &&
                (!auth || auth.name != 'dag' || auth.pass != 'dag')) {
                res.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Please login"' });
                return res.end();
            }

            next();
        })

        app.get('/data-slice', (req, res, next)=>{
            this.dataSlice(req.query).then((data)=> {
                res.sendJSON(data)
            }, (err) => {
                console.log('error:',err);
                res.sendJSON({error: err.toString()}, 500)
            });
        });

        app.get("/search", (req, res)=>{
            let args = req.query.q || "";
            //console.log("getting query for:",args);
            this.doSearch(args).then((data) => {
                console.log('search:resp:',data);
                res.sendJSON(data);
            }, (err) => {
                console.log('error:',err);
                res.sendJSON({error: err.toString()}, 500);
            });
        })

        app.get("/get-block/:type/:data", (req, res)=>{
            let {type, data} = req.params;
            let args = type+"/"+data;
            //console.log("getting block:", args, req.params);
            this.getBlock(args).then((data) => {
                res.sendJSON(data);
            }, (err) => {
                console.log('error:',err);
                res.sendJSON({error: err.toString()}, 500);
            });
        })

        /*
        app.get("/api/transactions", (req, res, next)=>{
            if(!DUMMY_TX)
                return next();
            res.sendFile("./transactions-samples.json");
        })

        app.get("/api/transaction/hash/:code", (req, res, next)=>{
            if(!DUMMY_TX)
                return next();
            let result = require("./transactions-samples.json");
            let tx = result.transactions[0];
            res.sendJSON(tx)
        })
        */

        app.get("/api", (req, res, next)=>{
            const _path = req.url.substring(4);
            let url = `${this.kasparov}${_path}`;
            if(USE_LOCAL_KASPAROV)
                url = `http://localhost:1234${_path}`;
            console.log('api request:',url);
            rp({url, rejectUnauthorized})
            .then(text=>{
                res.sendJSON(text);
            })
            .catch(err=>{
                res.sendJSON({"dagviz-proxy-error": err.toString()}, 500);
            });
        })

        /*
        let sendHtmlFile = (args={})=>{
            let {res, next, file, data, options, contentType} = args;
            if(!options)
                options = {};
            if(!data)
                data = {};
            if(!contentType)
                contentType = 'text/html';

            ejs.renderFile(file, data, options, (err, html)=>{
                if(err)
                    return next(err);
                res.writeHead(200, {'Content-Type': contentType});
                res.write(html);
                res.end();
            })
        }
        this._hashMap = {};
        let _H = ()=>{
            let hash = this.hash(crypto.randomBytes(32));
            this._hashMap[hash] = 1;
            return hash;
        }
        */

        app.get(/\/blocks?|\/utxos|\/transactions?|\/fee\-estimates/, (req, res, next)=>{
            let pkg = require("./package.json");
            dataVars.set("version", pkg.version);
            res.sendFile("./index.html", {vars:dataVars});
            //sendHtmlFile({req, res, next, file:'./index.html', data:{_H}})
        })

        const dataVars = new Map();
        app.get('/', (req, res, next)=>{
            let pkg = require("./package.json");
            dataVars.set("version", pkg.version);
            res.sendFile("./index.html", {vars:dataVars});
            //sendHtmlFile({req, res, next, file:'./index.html', data:{_H}})
        })

        flowRouter.init();

        //app.use("/k-explorer", serveStatic('./node_modules/k-explorer', { 'index': ['index.html', 'index.htm'] }))
        app.use('/resources', serveStatic('./resources'))
        app.use('/node_modules', serveStatic('./node_modules'))


        return new Promise((resolve,reject) => {

            let port = this.args.port || 8686;
            // Create server
            const server = http.createServer((req, res)=>{
                app.run(req, res);
            }).listen(port, () => {
                console.log(`listening on ${port}`);
                resolve();
            });

            this.io = io(server);
            this.io.on('connection', (socket) => {
              if(this.lastBlock)
                  socket.emit('last-block-data', this.lastBlock);
            })
    
        });

    }

    async initDatabase() {

        const port = this.args.dbport || this.args['pgsql-port'] || 8309;

//        const mySQL = new MySQL({ port, database : this.uid });
        const pgSQL = this.pgSQL = new PgSQL({ port, database : this.uid });
//        await mySQL.start()
        await pgSQL.start()

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
                user : 'dagviz',
                password: 'dagviz',
                database: this.uid, //'mysql',
                //insecureAuth : true
            }));

            this.dbPool.on('error', (err) => {
                if(!pgSQL.stopped)
                    console.log(err);
            })
            
            this.db = {
                query : async (sql, args) => {
                    if(pgSQL.stopped)
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

    async sql(...args) { 
        // console.log('SQL:'.brightGreen,args[0]);
        let p = this.db.query(...args);
        p.catch(e=>{
            console.log("sql:exception:", [...args], e)
        })
        return p;
    }

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

    async initDatabaseSchema() {
        // await this.sql(`CREATE DATABASE IF NOT EXISTS ${this.uid} DEFAULT CHARACTER SET utf8;`);
        // await this.sql(`USE ${this.uid}`);
        await this.sql(`
            CREATE TABLE IF NOT EXISTS blocks (
                id                      BIGSERIAL PRIMARY KEY,
                blockHash              CHAR(64)        NULL,
                acceptingBlockHash      CHAR(64) NULL,
                acceptingBlockTimestamp INT NULL,
                version                 INT             NOT NULL,
                hashMerkleRoot        CHAR(64)        NOT NULL,
                acceptedIDMerkleRoot CHAR(64)        NOT NULL,
                utxoCommitment         CHAR(64)        NOT NULL,
                timestamp               INT        NOT NULL,
                bits                    INT     NOT NULL,
                nonce                   BYTEA  NOT NULL,
                blueScore              BIGINT  NOT NULL,
                isChainBlock          BOOLEAN         NOT NULL,
                mass                    BIGINT          NOT NULL,
                acceptedBlockHashes   TEXT NOT NULL,
                parentBlockHashes   TEXT NOT NULL,
                childBlockHashes   TEXT NOT NULL
            );        
        `);

        // PRIMARY KEY (id),
        // UNIQUE INDEX idx_blocks_block_hash (blockHash),
        // INDEX idx_blocks_timestamp (timestamp),
        // INDEX idx_blocks_is_chain_block (isChainBlock),
        // INDEX idx_blocks_blueScore (blueScore)

        let blocks_idx = ['blockHash:UNIQUE','timestamp','isChainBlock','blueScore'];
        while(blocks_idx.length) {
            let [idx, unique] = blocks_idx.shift().split(':');
            await this.sql(`CREATE ${unique||''} INDEX IF NOT EXISTS idx_${idx} ON blocks (${idx})`);
        }
        
        //id                      BIGSERIAL PRIMARY KEY,
        await this.sql(`
            CREATE TABLE IF NOT EXISTS block_relations (
                parent  CHAR(64) NOT NULL,
                child CHAR(64) NOT NULL,
                linked BOOLEAN NOT NULL,
                PRIMARY KEY (parent, child)
            );
        `);

        //await this.sql(`CREATE UNIQUE INDEX idx_child ON block_relations (child)`);
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

    }

    async main() {
        
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
        dpc(3000, () => {
            this.updateRelations();
        });
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
        if(!row)
            return Promise.resolve(null);
        console.log('restoring last block hash:', row.hash);
        return row.hash;
    }

    getBlockCount() {
        return new Promise((resolve, reject) => {
            rp({url: `${this.kasparov}/blocks/count`, rejectUnauthorized}).then((text) => {
                let data = null;
                try {
                    data = JSON.parse(text);
                } catch(ex) {
                    reject(ex);
                }
                // console.log(data);
                resolve(data);
            }, (err) => {
                if((err+"").indexOf('ECONNREFUSED')) {
                    const ts = Date.now();
                    if(!this.last_gbc_ts || ts > this.last_gbc_ts+1000*60) {
                        console.log("ECONNREFUSED".red, `${this.kasparov}/blocks/count`,args);
                        this.last_gbc_ts = ts;
                    }
                }
                else
                    console.log(err);
                reject(err);
            });

        });
    }

    fetchAddressTxs(address, options={}) {
        return new Promise((resolve,reject) => {
            let args = Object.entries(options).map(([k,v])=>`${k}=${v}`).join('&');
            rp({url: `${this.kasparov}/transactions/address/${address}?${args}`, rejectUnauthorized}).then((text) => {
                let data = null;
                try {
                    data = JSON.parse(text);
                } catch(ex) {
                    reject(ex);
                }
                resolve(data);
            }, (err) => {
                if((err+"").indexOf('ECONNREFUSED'))
                    console.log("ECONNREFUSED".red, `${this.kasparov}/transactions/address/${address}?${args}`)
                else
                    console.log(err);
                reject(err);
            });
            
        })
    }

    fetch(options) {
        return new Promise((resolve,reject) => {
            let args = Object.entries(options).map(([k,v])=>`${k}=${v}`).join('&');
            rp({url: `${this.kasparov}/blocks?${args}`, rejectUnauthorized}).then((text) => {
                let data = null;
                try {
                    data = JSON.parse(text);
                } catch(ex) {
                    reject(ex);
                }
                resolve(data);
            }, (err) => {
                if((err+"").indexOf('ECONNREFUSED'))
                    console.log("ECONNREFUSED".red, `${this.kasparov}/blocks?${args}`)
                else
                    console.log(err);
                reject(err);
            });
            
        })
    }

    async resetChain(dropdb = false) {
        console.log(`initiating database purge...`);
        if(dropdb) {
            await this.sql(`DROP TABLE blocks CASCADE`);
            await this.sql(`DROP TABLE block_relations CASCADE`);
            await this.sql(`DROP TABLE last_block_hash CASCADE`);
            await this.initDatabaseSchema();
        }
        else {
            await this.sql(`TRUNCATE TABLE blocks`);
            await this.sql(`TRUNCATE TABLE block_relations`);
        }

        this.lastTotal = 0; //total;
        this.skip = 0;
        this.initRTBS();
        this.io.emit('chain-reset');
    }

    sync() {

        const skip = this.skip;
        let limit = 100;
        const order = 'asc';

        if(this.args['rate-limit'])
            limit = parseInt(this.args['rate-limit']) || 100;

        this.verbose && process.stdout.write(` ...${this.lastTotal ? (skip/this.lastTotal * 100).toFixed(2)+'%' : skip}... `);

        this.getBlockCount().then(async (total) => {
            if(this.lastTotal !== undefined && this.lastTotal > total+1e4 || this.skip > total+1e3) {
                console.log(`incloming total block count ${total}+1e4 is less than previous total ${this.lastTotal}`);
                await this.resetChain();
                dpc(1000, () => {
                    this.sync();
                })
                return;
            }

            if(!total) {
                console.log(`error: nullish total received from /blocks/count received value is: "${total}"`);
            }

            if(total && total != this.lastTotal)
                this.lastTotal = total;

            if(this.skip > total) {
                console.log(`ERROR: this.skip ${this.skip} > total ${total}`);
            }

            if(!total || this.skip == total) {
                const wait = 2500;
                return dpc(wait, () => {
                    this.sync();
                });
            }
                
            // console.log(`fetching: ${skip}`);
            this.fetch({ skip, limit, order })
            .then(async (blocks) => {


                if(blocks && blocks.length) {

                    if(blocks.length < 100)
                        this.io.emit('blocks',blocks);
        
                    this.skip += blocks.length;

                    const pre_ = blocks.length;
                    blocks = blocks.filter(block=>!this.rtbsMap[block.blockHash]);
                    const post_ = blocks.length;
                    if(!this.tracking && pre_ != post_)
                        this.tracking = true;
                    if(blocks.length) {
                        if(this.tracking) {
                            console.log(`WARNING: detected at least ${blocks.length} database blocks not visible in MQTT feed!`);
                            console.log(' ->'+blocks.map(block=>block.blockHash).join('\n'));
                            console.log(`possible MQTT failure, catching up via db sync...`);
                        }

                        await this.post(blocks);
                    }
                }
                const wait = (!blocks || blocks.length != 100) ? 1000 : 0;
                //(blocks && blocks.length != 100) ? 1000 : 0;
                dpc(wait, ()=> {
                    this.sync();
                });
            }, (err) => {
                //console.log(err);
                const wait = 3500;
                dpc(wait, ()=> {
                    this.sync();
                })
            });
            // .catch(e=>{
            //     this.sync();
            // })
           
        }, (err) => {
            const wait = 3500;
            dpc(wait, ()=> {
                this.sync();
            })
        });
    }

    rewind(nblocks) {
        this.skip -= nblocks;
        if(this.skip < 0)
            this.skip = 0;
        console.log(`warning: rewinding ${nblocks}; new position ${this.skip}`);
    }


    post(blocks) {
        // console.log("DATA:",data);

        this.lastBlock = blocks[blocks.length-1];
        // console.log('posting blocks...',blocks.length);

        return new Promise(async (resolve,reject)=>{
            //console.log("DOING POST") // 'acceptingBlockTimestamp',
            

            // let blocks = data.blocks;
            let relations = [];

            blocks.forEach(block => {
                block.isChainBlock = block.isChainBlock === true ? 1 : 0;

                if(block.parentBlockHashes) {
                    block.parentBlockHashes.forEach(hash => relations.push([hash, block.blockHash, false]));
                
                
                    // store accepted block hashes as a diff against parent block hashes


                    // console.log("original accepted list",block.acceptedBlockHashes);
                    let acceptingNonParents = block.parentBlockHashes.slice();
                    block.acceptedBlockHashes = block.acceptedBlockHashes.map((acceptedHash) => {
                        let idx = acceptingNonParents.indexOf(acceptedHash);
                        if(idx == -1){
                            if(block.isChainBlock)
                                console.log("ACCEPTED BUT NOT PARENT:", acceptedHash, "in block", block.blockHash);
                            return '+'+acceptedHash;
                        }
                        else {
                            acceptingNonParents.splice(idx,1);
                            return null;
                        }
                    }).filter(v=>v);
                    // console.log("acceptingNonParents",acceptingNonParents);
                    acceptingNonParents.forEach((hash) => {
                        block.acceptedBlockHashes.push('-'+hash);
                        // console.log("ACCEPTED but NOT A PARENT:", hash, "in block", block.blockHash);
                    })
                    // console.log("block.acceptedBlockHashes",block.acceptedBlockHashes);
                }
                
                block.acceptedBlockHashes = block.acceptedBlockHashes.join(',');
                // if(block.acceptedBlockHashes)
                //     console.log('---',block.acceptedBlockHashes);
                //console.log('---');

                // delete block.parentBlockHashes;
                block.parentBlockHashes = block.parentBlockHashes.join(',');
                block.childBlockHashes = '';

                // if(block.acceptingBlockHash)
                //     relations.push([block.acceptingBlockHash, block.blockHash]);

                if(block.acceptingBlockHash == null)
                    block.acceptingBlockHash = '';
                //delete block.acceptingBlockHash;
            });

            // sort fields for REPLACE INTO ... VALUES ? injection below
            blocks = blocks.map(block => DAGViz.DB_TABLE_BLOCKS_ORDER.map(field => block[field]));
                //Object.values(block));

            this.verbose && process.stdout.write(` ${blocks.length}[${relations.length}] `);

//            INSERT INTO last_block_hash (xid, hash) VALUES (1, '${hash}')
//            ON CONFLICT (xid) DO UPDATE SET hash = excluded.hash;

            let blockData = blocks.map(block => {
                let values = block.map(v => `'${v}'`).join(',');
                return `(${values})`;
            }).join(',');

//            const VALUES = blocks.map(block)
            const REPLACE = DAGViz.DB_TABLE_BLOCKS_ORDER.map(v => `${v} = EXCLUDED.${v}`).join(', ');

            try {

                await this.sql(`
                    INSERT INTO blocks (${DAGViz.DB_TABLE_BLOCKS_ORDER.join(', ')})
                    VALUES ${blockData} 
                    ON CONFLICT (blockHash) DO UPDATE
                    SET 
                        ${REPLACE}
                    ;
                `);//, blocks);

                // await this.sql(query);
                    



/*
                let query = format(`
                    INSERT INTO blocks (${DAGViz.DB_TABLE_BLOCKS_ORDER.join(', ')})
                    VALUES %L 
                    ON CONFLICT (blockHash) DO UPDATE
                    SET 
                        ${REPLACE}
                    ;
                `, blocks);

                await this.sql(query);
  */                  
/*
                id                      BIGSERIAL PRIMARY KEY,
                blockHash              CHAR(64)        NULL,
                acceptingBlockHash      CHAR(64) NULL,
                acceptingBlockTimestamp INT NULL,
                version                 INT             NOT NULL,
                hashMerkleRoot        CHAR(64)        NOT NULL,
                acceptedIDMerkleRoot CHAR(64)        NOT NULL,
                utxoCommitment         CHAR(64)        NOT NULL,
                timestamp               INT        NOT NULL,
                bits                    INT     NOT NULL,
                nonce                   BIGINT  NOT NULL,
                blueScore              BIGINT  NOT NULL,
                isChainBlock          BOOLEAN         NOT NULL,
                mass                    BIGINT          NOT NULL,
                parentBlockHashes   TEXT NOT NULL,
                childBlockHashes   TEXT NOT NULL

*/

                //     ${DAGViz.DB_TABLE_BLOCKS_ORDER.join(', ')}
                // ) VALUES ?

                if(relations.length) {

                    let query = format(`
                        INSERT INTO block_relations (
                            parent, child, linked
                        ) VALUES %L
                        ON CONFLICT (parent, child) DO UPDATE
                        SET linked = FALSE;
                    `, relations);

                    await this.sql(query);

                    // await this.sql(`
                    //     REPLACE INTO block_relations (
                    //         parent, child, linked
                    //     ) VALUES ?
                    // `, [relations]);
                }

                await this.update();

                resolve();

            } catch(ex) {
                //this.log(ex);
                reject(ex.toString());
            }
        });
    }


    async updateRelations() {
        let rows = await this.sql('SELECT * FROM block_relations WHERE linked = FALSE LIMIT 1000');
//        await this.sql('UPDATE block_relations SET linked = TRUE WHERE linked = FALSE LIMIT 1000');
        await this.sql('UPDATE block_relations SET linked = TRUE WHERE child IN (SELECT child FROM block_relations WHERE linked = FALSE LIMIT 1000);');

        let hashMap = { }
        rows.forEach((row) => {
            // hashMap[row.child] = true;
            hashMap[row.parent] = true;
        })
        let blockHashes = Object.keys(hashMap);
        // console.log(`+ processing ${blockHashes.length} blocks`)
        while(blockHashes.length) {
            let hash = blockHashes.shift()
            let children = await this.sql(`SELECT * FROM block_relations WHERE parent = '${hash}'`);
            children = children.map(row => row.child);
            await this.sql(`UPDATE blocks SET childBlockHashes = '${children.join(',')}' WHERE blockHash='${hash}'`);
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
        let o = { };
        DAGViz.DB_TABLE_BLOCKS_ORDER.forEach(v => o[v] = block[v.toLowerCase()]);
        if(block.lseq)
            o.lseq = block.lseq
        return o;
    }

    dataSlice(args) {
        return new Promise(async (resolve, reject) => {

            let { from, to, unit } = args;
            // console.log(`slice: ${from}-${to}`);
            if(!from && !to) {
                to = Date.now() / 1000;
                from = to - 1000 * 60 * 60;
            }

            if(!unit)
                reject('must supply units');

            if(!['timestamp','lseq','blueScore'].includes(unit))
                reject(`invalid unit '${unit}'`);

            if(unit == 'lseq')
                unit = 'id';

            from = parseInt(from);
            to = parseInt(to);
            if(from < 0)
                from = 0;
            if(to < from)
                to = from+10;

            // console.log(`unit: ${unit} from: ${from} to: ${to}`);

            let limit = 100;

            try {
                // console.log("REQUESTING...")

                let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks WHERE ${unit} >= ${from} AND ${unit} <= ${to}`);
                // let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks`);
                // console.log('result:',result);
                let total = result.shift().total;
                // console.log(`SELECT * FROM blocks WHERE ${unit} >= ${from} AND ${unit} <= ${to} ORDER BY ${unit} LIMIT ${limit}`);
                let blocks = await this.sql(`SELECT * FROM blocks WHERE ${unit} >= ${from} AND ${unit} <= ${to} ORDER BY ${unit} LIMIT ${limit}`);
                // console.log("BLOCKS:", blocks);

                if(this.args.latency) {
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
                const blockHashMap = { };
                blocks = blocks.map(block => {
                    return this.deserealizeBlock(block);
                    // block.lseq = block.id;
                    // block.parentblockhashes = block.parentblockhashes.split(',');
                    // block.childblockhashes = block.childblockhashes.split(',');
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

                if(!blocks.length){
                    resolve({ blocks, total, max:null });
                    return
                }
                let tail = blocks.length-1;
                let last = blocks[tail][unit];
                if(last != blocks[0][unit]) {
                    let last = blocks[tail--][unit];

                    while(tail && last == blocks[tail]) {
                        last = blocks[tail--][unit];
                    }            
                }

                let max = null;
                if(this.lastBlock) {
                    max = this.lastBlock[unit];
                }
                // console.log(`blocks: ${blocks.length} last: ${last} total: ${total} max: ${max}`);
                resolve({ blocks, last, total, max });
            } catch(ex) {
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
        if(!['blockHash','lseq','block'].includes(type))
            return Promise.reject('invalid getBlock() type');

        args = args.filter(v=>v);

        if(!args.length)
            return Promise.reject(`invalid request: no arguments for ${type}`);

        type = {
            'lseq' : 'id',
            'block' : 'blockHash'
        }[type] || type;

        //let hashes = hashes.split(':');

        if(type == 'id') {
            args = args.map((arg) => {
                return parseInt(arg,16);
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
        block.lseq = block.id;
        block.parentblockhashes = block.parentblockhashes.split(',');
        block.childblockhashes = block.childblockhashes.split(',');

        let accepted_diff = block.acceptedblockhashes.split(',');

        let abh = block.parentblockhashes.slice();
        accepted_diff.forEach((v) => {
            let op = v.charAt(0);
            let hash = v.substring(1);
            if(op == '-') {
                let idx = abh.indexOf(hash);
                if(idx == -1) {

                } else {
                    abh.splice(idx,1);
                }
            } else if(op == '+') {
                abh.push(hash);
            }
        })
        block.acceptedblockhashes = abh;

        // TODO @aspect - resolve to null 
        block.acceptingblockhash = block.acceptingblockhash.trim();

        return this.NormalizeBlock(block);
    }

    async doSearch(text) {

        let blocks = null;

        //console.log('text length:',text.length);
        if(/^(kaspatest:|kaspa:)/.test(text) || text.length == 42){
            let adress = text;
            if(adress.indexOf(":")>-1)
                adress = adress.split(":")[1];
            if(adress.length == 42){
                //blocks = await this.sql(`SELECT * FROM blocks WHERE blockHash=$1`, [_text]);
                let transactions = await this.fetchAddressTxs(text)
                
                let hashes = transactions.filter(t=>t.acceptingBlockHash)
                            .map(t=>t.acceptingBlockHash);
                //console.log("doSearch:transactions hashes", hashes)
                blocks = [];
                if(hashes.length)
                    blocks = await this.sql(format(`SELECT * FROM blocks WHERE blockHash IN (%L)`, hashes));
            }
        }

        if(!blocks && text.length == 64) {
            blocks = await this.sql(`SELECT * FROM blocks WHERE blockHash=$1`, [text]);
        }

        //console.log(blocks);
        blocks = blocks.map(block => this.deserealizeBlock(block));
        // console.log("responding:",blocks);
        return Promise.resolve({blocks});

        //return Promise.reject('Not Found');
    }

    sleep(t) {
        return new Promise((resolve) => {
            dpc(t,resolve);
        })
    }
}

(async () => {
    const dagviz = new DAGViz();
    dagviz.init();
})();