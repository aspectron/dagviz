const crypto = require('crypto');
const fs = require('fs');
const mysql = require('mysql');
var http = require('http')
var serveStatic = require('serve-static')
const rp = require('request-promise');
const MF = require('micro-fabric');
const MySQL = require('./lib/mysql');
const basicAuth = require('basic-auth');
const io = require('socket.io');//(http);
const mqtt = require('mqtt');
const path = require('path');
const WebApp = require('./web-app.js');

const DUMMY_TX = true;
console.log("!!! WARNING: 'USE_LOCAL_KASPAROV == false'")
const USE_LOCAL_KASPAROV = false;

 
class DAGViz {

    constructor() {
        this.args = MF.utils.args();

        this.kasparov = this.args['kasparov'] || `http://kasparov-dev-auxiliary-open-devnet.daglabs.com:8080`;
        this.mqtt = {
             address : this.args['mqtt-address'] || "mqtt://kasparov-dev-auxiliary-open-devnet.daglabs.com:1883",
             username : this.args['mqtt-user'] || 'user',
             password : this.args['mqtt-pass'] || 'pass'
        };

        console.log(`kasparov api server at ${this.kasparov}`);
        this.uid = 'dagviz'+this.hash(this.kasparov).substring(0,10);

        this.verbose = this.args.verbose ? true : false;

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
        await this.initDatabase()
        await this.initMQTT();
        await this.initHTTP();

        return this.main();
    }

    async initMQTT() {

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

    async "dag/blocks"(block) {
        // console.log('received: dag/blocks');
        this.io.emit("dag/blocks",[block]);

        await this.postRTB(block);
    }

    async "dag/selected-parent-chain"(args) {
        // console.log("dag/selected-parent-chain");
        this.io.emit("dag/selected-parent-chain",args);

        const { addedChainBlocks, removedBlockHashes } = args;

        if(removedBlockHashes && removedBlockHashes.length)
            this.sql(`UPDATE blocks SET acceptingBlockHash='', isChainBlock=0 WHERE (blocks.blockHash) IN (?)`, removedBlockHashes);

        if(addedChainBlocks && addedChainBlocks.length) {
            // let addedHashes = addedChainBlocks.map(v=>v.hash);
            // console.log(`UPDATE blocks SET blocks.acceptedBlockHash='${}' WHERE (blocks.blockHash) IN (?)`, addedHashes);
            // this.sql('UPDATE blocks SET blocks.isChainBlock=1 WHERE (blocks.blockHash) IN (?)', addedHashes);
            // console.log('UPDATE blocks SET isChainBlock=1 WHERE blockHash IN ?', [addedHashes]);
            addedChainBlocks.forEach((instr) => {
                const { hash, acceptedBlockHashes } = instr;
                //console.log('UPDATE blocks SET parentBlockHashes =  WHERE blockHash IN ?', [acceptedBlockHashes], [hash]);
                this.sql(`UPDATE blocks SET isChainBlock = 1 WHERE blockHash = '${hash}'`);
                this.sql(`UPDATE blocks SET acceptingBlockHash = '${hash}' WHERE (blockHash) IN (?)`, [acceptedBlockHashes]);
            })
        }
    }

    static MAX_RTBS_BLOCKS = 1024;

    postRTB(block) {
        this.rtbs.push(block.blockHash);    // parent chain block notifications
        this.rtbsMap[block.blockHash] = true;
        while(this.rtbs.length > DAGViz.MAX_RTBS_BLOCKS)
            delete this.rtbsMap[this.rtbs.shift()];

        return this.post([block]);
    }

    async "dag/selected-tip"(message) {

        // console.log("dag/selected-tip");

        if(!message.blockHash)
            return console.log('invalid mqtt message:', message);
        
        const block = message;
        this.io.emit("dag/selected-tip", block);

        this.sql(`UPDATE blocks SET isChainBlock = 1 WHERE blockHash = '${block.blockHash}'`);


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

        app.use((req, res, next)=>{
            let auth = basicAuth(req);
            if(!req.url.startsWith('/components') && 
                !req.url.startsWith('/build') &&
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
                console.log('resp:',data);
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

        app.get("/api", (req, res, next)=>{
            const _path = req.url.substring(4);
            let url = `${this.kasparov}${_path}`;
            if(USE_LOCAL_KASPAROV)
                url = `http://localhost:1234${_path}`;
            console.log('api request:',url);
            rp(url)
            .then(text=>{
                res.sendJSON(text);
            })
            .catch(err=>{
                res.sendJSON({"dagviz-proxy-error": err.toString()}, 500);
            });
        })

        app.get(/\/blocks?|\/utxos|\/transactions?|\/fee\-estimates/, (req, res, next)=>{
            res.sendFile("./index.html");
        })

        //app.use("/k-explorer", serveStatic('./node_modules/k-explorer', { 'index': ['index.html', 'index.htm'] }))
        app.use(serveStatic('./', { 'index': ['index.html', 'index.htm']}))

        return new Promise((resolve,reject) => {
            // Create server
            const server = http.createServer((req, res)=>{
                app.run(req, res);
            }).listen(8686, () => {
                console.log('listening on 8686');
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

        const port = 8309;

        const mySQL = new MySQL({ port, database : this.uid });
        await mySQL.start()

        let defaults = {
            host : 'localhost',
            port,
            user : 'root',
            password : 'dagviz',
        };

        return new Promise((resolve,reject) => {
            this.dbPool = mysql.createPool(Object.assign({ }, defaults, {
                // host : 'localhost', port,
                // user : 'root',
                // password: 'dagviz',
                database: this.uid, //'mysql',
                insecureAuth : true
            }));
            
            this.db = {
                query : async (sql, args) => {
                    if(mySQL.stopped)
                        return Promise.reject("MySQL stopped.")
                    //console.log("sql:", sql, args)
                    return new Promise((resolve,reject) => {
                        this.dbPool.getConnection((err, connection) => {
                            //console.log("CONNECTION:",connection);
                            if(err)
                                return reject(err);

                            connection.query(sql, args, (err, rows) => {
                                connection.release();
                                if(err) {
                                    console.log(`Error processing SQL query:`);
                                    console.log(sql);
                                    console.log(args);
                                    console.log(`SQL Error is: ${err.toString()}`)
                                    return reject(err);
                                }
                                    // console.log("SELECT GOT ROWS:",rows);
                                resolve(rows);
                            });
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

    async sql(...args) { return this.db.query(...args); }

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
        'childBlockHashes'
    ];

    async main() {

        await this.sql(`CREATE DATABASE IF NOT EXISTS ${this.uid} DEFAULT CHARACTER SET utf8;`);
        await this.sql(`USE ${this.uid}`);
        await this.sql(`
            CREATE TABLE IF NOT EXISTS blocks (
                id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                blockHash              CHAR(64)        NULL,
                acceptingBlockHash      CHAR(64) NULL,
                acceptingBlockTimestamp INT NULL,
                version                 INT             NOT NULL,
                hashMerkleRoot        CHAR(64)        NOT NULL,
                acceptedIDMerkleRoot CHAR(64)        NOT NULL,
                utxoCommitment         CHAR(64)        NOT NULL,
                timestamp               INT        NOT NULL,
                bits                    INT UNSIGNED    NOT NULL,
                nonce                   BIGINT UNSIGNED NOT NULL,
                blueScore              BIGINT UNSIGNED NOT NULL,
                isChainBlock          TINYINT         NOT NULL,
                mass                    BIGINT          NOT NULL,
                parentBlockHashes   TEXT NOT NULL,
                childBlockHashes   TEXT NOT NULL,
                PRIMARY KEY (id),
                UNIQUE INDEX idx_blocks_block_hash (blockHash),
                INDEX idx_blocks_timestamp (timestamp),
                INDEX idx_blocks_is_chain_block (isChainBlock),
                INDEX idx_blocks_blueScore (blueScore)
            );        
        `);
        
        await this.sql(`
            CREATE TABLE IF NOT EXISTS block_relations (
                id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                parent  CHAR(64) NOT NULL,
                child CHAR(64) NOT NULL,
                linked TINYINT NOT NULL,
                PRIMARY KEY (id),
                INDEX idx_child (child)
            );
        `);
        
        let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks`);
        // console.log('result:',result);
        this.lastTotal = result.shift().total;
        this.skip = this.lastTotal;
        console.log(`SELECT COUNT(*) AS total FROM blocks => ${this.skip}`);
        if(this.skip) {
            let blocks = await this.sql('SELECT * FROM blocks ORDER BY id DESC LIMIT 1');
            this.lastBlock = blocks.shift();
            // console.log("LAST BLOCK:",this.lastBlock);
        }
        this.sync();
        dpc(3000, () => {
            this.updateRelations();
        });
    }

    log(...args) {
        console.log(...args);
    }


    fetch(options) {
        return new Promise((resolve,reject) => {

            let args = Object.entries(options).map(([k,v])=>`${k}=${v}`).join('&');
            
            // console.log(`${this.kasparov}/blocks?${args}`);
            
            rp(`${this.kasparov}/blocks?${args}`).then((text) => {
                let data = null;
                try {
                    data = JSON.parse(text);
                } catch(ex) {
                    reject(ex);
                }
                // console.log(data);
                resolve(data);
            }, (err) => {
                console.log(err);
                reject(err);
            });
            
        })
    }

    sync() {

        const skip = this.skip;
        let limit = 100;
        const order = 'asc';

        if(this.args['rate-limit'])
            limit = parseInt(this.args['rate-limit']) || 100;

        this.verbose && process.stdout.write(` ...${this.lastTotal ? (skip/this.lastTotal * 100).toFixed(2)+'%' : skip}... `);
        // console.log(`fetching: ${skip}`);
        this.fetch({ skip, limit, order }).then(async (data) => {


            if(this.lastTotal !== undefined && this.lastTotal > data.total+1e4) {
                console.log(`incloming total block count ${data.total}+1e4 is less than previous total ${this.lastTotal}`);
                console.log(`initiating database purge...`);
                await this.sql(`TRUNCATE TABLE blocks`);
                await this.sql(`TRUNCATE TABLE block_relations`);
                this.lastTotal = data.total;
                this.skip = 0;
                this.initRTBS();
                this.io.emit('chain-reset');
                dpc(1000, () => {
                    this.sync();
                })
                return;
            }

            if(data.total && data.total != this.lastTotal)
                this.lastTotal = data.total;

            if(data.blocks && data.blocks.length) {

                if(data.blocks.length < 100)
                    this.io.emit('blocks',data.blocks);
    
                this.skip += data.blocks.length;

                const pre_ = data.blocks.length;
                const blocks = data.blocks.filter(block=>!this.rtbsMap[block.blockHash]);
                const post_ = blocks.length;
                if(!this.tracking && pre_ != post_)
                    this.tracking = true;
                if(blocks.length) {
                    if(this.tracking) {
                        console.log('WARNING: detected ${blocks.length} database blocks not visible in MQTT feed!');
                        console.log(' ->'+blocks.map(data=>data.blockHash).join('\n'));
                    }

                    await this.post(blocks);
                }
            }
            const wait = (!data || !data.blocks || data.blocks.length != 100) ? 1000 : 0;
            //(data.blocks && data.blocks.length != 100) ? 1000 : 0;
            dpc(wait, ()=> {
                this.sync();
            });

        }, (err) => {
            console.log(err);
            const wait = 3500;
            dpc(wait, ()=> {
                this.sync();
            })
        }).catch(e=>{
            this.sync();
        })


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
                    block.parentBlockHashes.forEach(hash => relations.push([hash, block.blockHash, 0]));
                }
                
                // delete block.parentBlockHashes;
                block.parentBlockHashes = block.parentBlockHashes.join(',');
                block.childBlockHashes = '';

                // if(block.acceptingBlockHash)
                //     relations.push([block.acceptingBlockHash, block.blockHash]);

                if(block.acceptingBlockHash == null)
                    block.acceptingBlockHash = '';
                //delete block.acceptingBlockHash;
            });

            blocks = blocks.map(block => DAGViz.DB_TABLE_BLOCKS_ORDER.map(field => block[field]));
                //Object.values(block));

            this.verbose && process.stdout.write(` ${blocks.length}[${relations.length}] `);

            try {
                await this.sql(`
                    REPLACE INTO blocks (
                        ${DAGViz.DB_TABLE_BLOCKS_ORDER.join(', ')}
                    ) VALUES ?
                `, [blocks]);

                if(relations.length) {
                    await this.sql(`
                        REPLACE INTO block_relations (
                            parent, child, linked
                        ) VALUES ?
                    `, [relations]);
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
        let rows = await this.sql('SELECT * FROM block_relations WHERE linked = 0 LIMIT 1000');
        await this.sql('UPDATE block_relations SET linked = 1 WHERE linked = 0 LIMIT 1000');

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
                blocks.forEach(block => {
                    block.lseq = block.id;
                    block.parentBlockHashes = block.parentBlockHashes.split(',');
                    block.childBlockHashes = block.childBlockHashes.split(',');
                    blockHashMap[block.blockHash] = block;
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
        
        // console.log(`asing for blocks:`,args);
        let blocks = await this.sql(`SELECT * FROM blocks WHERE (${type}) IN (?)`,[args]);
        // console.log("GOT BLOCKS:",blocks.map(block=>block.id).join(','));
        // if(!blocks.length)
        //     return null;

        blocks.forEach(block => this.deserealizeBlock(block));
        // console.log("responding:",blocks);
        return Promise.resolve(blocks);
    }

    deserealizeBlock(block) {
        block.lseq = block.id;
        block.parentBlockHashes = block.parentBlockHashes.split(',');
        block.childBlockHashes = block.childBlockHashes.split(',');
    }

    async doSearch(text) {

        //console.log('text length:',text.length);
        //! WARNING - TODO: THE INPUT IS NOT SANITIZED!
        if(text.length == 64) {
            let blocks = await this.sql(`SELECT * FROM blocks WHERE blockHash=?`,text);
            //console.log(blocks);
            blocks.forEach(block => this.deserealizeBlock(block));
            // console.log("responding:",blocks);
            return Promise.resolve({blocks});
        }

        return Promise.reject('Not Found');

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