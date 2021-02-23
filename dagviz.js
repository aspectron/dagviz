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
//const ejs = require('ejs')

let args = utils.args();
const DUMMY_TX = true;
const USE_LOCAL_KASPAROV = !!args['use-local-kas'];
const rejectUnauthorized = false;
//console.log(`!!! WARNING: 'USE_LOCAL_KASPAROV == ${USE_LOCAL_KASPAROV}'`.redBG.white.bold)

const {Command} = require('commander');
const program = new Command();


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
    }

    initRTBS() {
        this.rtbs = [];
        this.rtbsMap = {};
    }


    hash(data, h = 'sha256') {
        return crypto.createHash(h).update(data).digest('hex');
    }

    async init() {
        await this.initRPC();
        this.initRTBS();
        await this.initDatabase();
        await this.initDatabaseSchema();
        // await this.initLastBlockTracking();
        // await this.initMQTT();
        await this.initHTTP();

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

        this.rpc.subscribe("notifyVirtualSelectedParentChainChangedRequest", (intake) =>
            this.handleVirtualSelectedParentChainChanged(intake))

        this.rpc.subscribe("notifyBlockAddedRequest", (intake) =>
            this.handleBlockAddedNotification(intake))
    }

    async initLastBlockTracking() {

        this.lastBlockHash = await this.restoreLastBlockHash();
        // await this.rewindToLastBlockHash();
    }

    async rewindToLastBlockHash() {
        if (this.lastBlockHash) {
            let rows = await this.sql(`SELECT * FROM blocks WHERE "blockHash" = '${this.lastBlockHash}'`);
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

    serializeBlock(block) {
        return BLOCK_PROPERTIES.map(p => block[p]);
    }

    async handleBlockAddedNotification(notification) {

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

        // console.log('received: dag/blocks',blocks);
        const dbBlock = this.verboseBlockToDBBlock(block);
        const data = {blocks: [this.deserealizeBlock(dbBlock)], rate};
        while (this.last_mqtt_block_updates.length > 10)
            this.last_mqtt_block_updates.shift();
        this.last_mqtt_block_updates.push(data);
        this.io.emit("dag/blocks", data);

        this.lastBlockHash = block.blockHash;

        await this.storeLastBlockHash(block.blockHash);

        await this.postRTB(block);
    }

    async handleVirtualSelectedParentChainChanged(args) {
        // console.log("dag/selected-parent-chain");
        this.io.emit("dag/selected-parent-chain", args);

        const {addedChainBlocks, removedChainBlockHashes} = args;

        if (removedChainBlockHashes && removedChainBlockHashes.length) {
            //this.sql(format(`UPDATE blocks SET acceptingBlockHash='', isChainBlock=FALSE WHERE (blocks.blockHash) IN (%L)`, removedBlockHashes));
            await this.sql(format(`UPDATE blocks SET "isChainBlock"=FALSE WHERE ("blocks"."blockHash") IN (%L)`, removedChainBlockHashes));
            await this.sql(format(`UPDATE blocks SET "acceptingBlockHash"='' WHERE ("blocks"."acceptingBlockHash") IN (%L)`, removedChainBlockHashes));
        }

        for (const chainBlock of addedChainBlocks) {
            const {hash, acceptedBlocks} = chainBlock;
            const acceptedBlockHashes = acceptedBlocks.map(block => block.hash);
            await this.sql(`UPDATE blocks SET "isChainBlock" = TRUE WHERE "blockHash" = '${hash}'`);
            await this.sql(format(`UPDATE blocks SET "acceptingBlockHash" = '${hash}' WHERE ("blockHash") IN (%L)`, acceptedBlockHashes));
        }
    }

    static MAX_RTBS_BLOCKS = 2016;

    postRTB(block) {
        this.rtbs.push({hash: block.blockHash, timestamp: block.timestamp});    // parent chain block notifications
        this.rtbsMap[block.blockHash] = true;
        while (this.rtbs.length > DAGViz.MAX_RTBS_BLOCKS)
            delete this.rtbsMap[this.rtbs.shift().hash];

        return this.post([block]);
    }

    async "dag/selected-tip"(message) {

        // console.log("dag/selected-tip");

        if (!message.blockHash)
            return console.log('invalid mqtt message:', message);

        const block = message;
//        this.io.emit("dag/selected-tip", this.serializeBlock(block));

        this.sql(`UPDATE blocks SET "isChainBlock" = TRUE WHERE "blockHash" = '${block.blockHash}'`);


        this.postRTB(block);
        // "real-time" blocks - data received at runtime...

        // let blocks = [message].map(block => DAGViz.DB_TABLE_BLOCKS_ORDER.map(field => block[field]));

        // await this.sql(`
        //     REPLACE INTO blocks (
        //         ${DAGViz.DB_TABLE_BLOCKS_ORDER.join(', ')}
        //     ) VALUES ?
        // `, [blocks]);
    }

    async getBlockCount() {
        const [{blockCount}] = await this.sql('select count(*) as "blockCount" from blocks;');
        return Number(blockCount);
    }

    async getBlocks({order = 'ASC', skip = 0, limit = 25}) {
        return this.sql(`select * from blocks order by id ${order} LIMIT ${limit} OFFSET ${skip};`);
    }

    async getBlockByHash(hash) {
        return this.sql(format(`select * from blocks where "blockHash" = %L`, hash));
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
            res.sendJSON(blocks);
        });

        app.get("/api/block/:blockHash", async (req, res) => {
            res.sendJSON(await this.deserealizeBlock(this.getBlockByHash(req.params.blockHash)));
        });

        app.get("/api/transactions/block", async (req, res) => {
            res.sendJSON([]); // TODO: IMPLEMENT THIS
        });


        app.get(/\/blocks?|\/utxos|\/transactions?|\/fee\-estimates/, (req, res, next) => {
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
        const {rows} = await this.promisifiedQuery(...args);
        return rows;
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

    static VERBOSE_BLOCK_FIELDS_TO_DB_FIELDS = {
        'hash': 'blockHash',
        'version': 'version',
        'hashMerkleRoot': 'hashMerkleRoot',
        'acceptedIDMerkleRoot': 'acceptedIDMerkleRoot',
        'utxoCommitment': 'utxoCommitment',
        'time': 'timestamp',
        'nonce': 'nonce',
        'bits': 'bits',
        'parentHashes': 'parentBlockHashes',
        'blueScore': 'blueScore',
    }

    async initDatabaseSchema() {
        await this.sql(`
            CREATE TABLE IF NOT EXISTS blocks (
                "id"                      BIGSERIAL PRIMARY KEY,
                "blockHash"              CHAR(64)        NULL,
                "acceptingBlockHash"      CHAR(64) NULL,
                "acceptingBlockTimestamp" INT NULL,
                "version"                 INT             NOT NULL,
                "hashMerkleRoot"        CHAR(64)        NOT NULL,
                "acceptedIDMerkleRoot" CHAR(64)        NOT NULL,
                "utxoCommitment"         CHAR(64)        NOT NULL,
                "timestamp"               bigint NOT NULL,
                "bits"                    INT     NOT NULL,
                "nonce"                   BYTEA  NOT NULL,
                "blueScore"              BIGINT  NOT NULL,
                "isChainBlock"          BOOLEAN         NOT NULL,
                "mass"                    BIGINT          NOT NULL,
                "acceptedBlockHashes"   TEXT NOT NULL,
                "parentBlockHashes"   TEXT NOT NULL,
                "childBlockHashes"   TEXT NOT NULL
            );        
        `);

        let blocks_idx = ['blockHash:UNIQUE', 'timestamp', 'isChainBlock', 'blueScore'];
        while (blocks_idx.length) {
            let [idx, unique] = blocks_idx.shift().split(':');
            await this.sql(`CREATE ${unique || ''} INDEX IF NOT EXISTS "idx_${idx}" ON blocks ("${idx}")`);
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
        dpc(3000, () => {
            this.updateRelations();
        });
        */
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
        return bluestBlock.blockHash;
    }

    async selectedTipHash() {
        const rows = await this.sql('SELECT "blockHash" FROM blocks where "isChainBlock" order by "blueScore" desc limit 1');
        if (rows.length === 0) {
            return ""
        }
        return rows[0].blockHash;
    }

    async fetchBlocks() {
        const bluestBlockHash = await this.bluestBlockHash();
        const {blockVerboseData} = await this.rpc.client.call('getBlocksRequest', {
            lowHash: bluestBlockHash,
            includeBlockVerboseData: true
        });
        if (blockVerboseData.length === 1 && blockVerboseData[0].hash === bluestBlockHash) {
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

                if (blocks.length < 100)
                    this.io.emit('blocks', blocks);

                this.skip += blocks.length;

                const pre_ = blocks.length;
                blocks = blocks.filter(block => !this.rtbsMap[block.hash]);
                const post_ = blocks.length;
                if (!this.tracking && pre_ != post_)
                    this.tracking = true;
                if (blocks.length) {
                    if (this.tracking) {
                        console.log(`WARNING: detected at least ${blocks.length} database blocks not visible in MQTT feed!`);
                        console.log(' ->' + blocks.map(block => block.blockHash).join('\n'));
                        console.log(`possible MQTT failure, catching up via db sync...`);
                    }

                    await this.post(blocks);
                }
            }

            // TODO: TEMPORARILY DISABLE
            // const selectedChainChanges = await this.fetchSelectedChain();
            // await this.handleVirtualSelectedParentChainChanged(selectedChainChanges);
        } catch (err) {
            const wait = 3500;
            console.error(`Sync error: ${err}. Restarting sync in ${wait} milliseconds`)
            dpc(wait, () => {
                this.sync();
            })
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
        const dbBlock = {
            mass: 0,
            acceptedBlockHashes: '',
        };
        for (const field in verboseBlock) {
            if (DAGViz.VERBOSE_BLOCK_FIELDS_TO_DB_FIELDS.hasOwnProperty(field)) {
                dbBlock[DAGViz.VERBOSE_BLOCK_FIELDS_TO_DB_FIELDS[field]] = verboseBlock[field];
            }
        }
        dbBlock.parentBlockHashes = verboseBlock.parentHashes.join(',');
        dbBlock.bits = parseInt(verboseBlock.bits, 16);
        dbBlock.childBlockHashes = '';
        dbBlock.isChainBlock = Number(verboseBlock.blueScore) === 0; // Every block except genesis is not a chain block by default.
        return dbBlock;
    }

    async post(blocks) {
        this.lastBlock = blocks[blocks.length - 1];
        console.log('posting blocks...', blocks.length);

        //console.log("DOING POST") // 'acceptingBlockTimestamp',


        let relations = [];

        blocks.forEach(block => {
            if (block.parentHashes) {
                block.parentHashes.forEach(hash => relations.push([hash, block.hash, false]));
            }
        });

        this.verbose && process.stdout.write(` ${blocks.length}[${relations.length}] `);

        const dbBlocks = blocks.map(block => this.verboseBlockToDBBlock(block));
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
//        await this.sql('UPDATE block_relations SET linked = TRUE WHERE linked = FALSE LIMIT 1000');
        await this.sql('UPDATE block_relations SET linked = TRUE WHERE child IN (SELECT child FROM block_relations WHERE linked = FALSE LIMIT 1000);');

        let hashMap = {}
        rows.forEach((row) => {
            // hashMap[row.child] = true;
            hashMap[row.parent] = true;
        })
        let blockHashes = Object.keys(hashMap);
        // console.log(`+ processing ${blockHashes.length} blocks`)
        while (blockHashes.length) {
            let hash = blockHashes.shift()
            let children = await this.sql(`SELECT * FROM block_relations WHERE parent = '${hash}'`);
            children = children.map(row => row.child);
            await this.sql(`UPDATE blocks SET "childBlockHashes" = '${children.join(',')}' WHERE "blockHash"='${hash}'`);
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
        block.lseq = block.id;
        if (block.parentBlockHashes === "") {
            block.parentBlockHashes = []
        } else {
            block.parentBlockHashes = block.parentBlockHashes.split(',');
        }
        block.childBlockHashes = block.childBlockHashes.split(',');

        let accepted_diff = block.acceptedBlockHashes.split(',');

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

        if (block.acceptingBlockHash) {
            block.acceptingBlockHash = block.acceptingBlockHash.trim();
        }

        return this.NormalizeBlock(block);
    }

    async doSearch(text) {

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
            blocks = await this.sql(`SELECT * FROM blocks WHERE "blockHash"=$1`, [text]);
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