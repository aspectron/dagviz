const crypto = require('crypto');
const mysql = require('mysql');
const finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')
const rp = require('request-promise');
const querystring = require('querystring');
const MF = require('micro-fabric');
const MySQL = require('./lib/mysql');

 

class DAGViz {

    constructor() {
        const args = MF.utils.args();

        this.kasparov = `http://finland.aspectron.com:8082`;
        if(args['kasparov']) {
            this.kasparov = args['kasparov'];
        }
        console.log(`kasparov api server at ${this.kasparov}`);
        this.uid = 'dagviz'+this.hash(this.kasparov).substring(0,10);

    }

    hash(data,h='sha256') {
        return crypto.createHash(h).update(data).digest('hex');
    }

    async init() {
        await this.initHTTP();
        await this.initDatabase()
        return this.main();
    }

    async initHTTP() {
        return new Promise((resolve,reject) => {

            // Serve up public/ftp folder
            const serve = serveStatic('./', { 'index': ['index.html', 'index.htm'] })
            
            const time_slice = '/time-slice?';

            // Create server
            const server = http.createServer((req, res)=>{
                if(req.url.startsWith(time_slice)) {
                    let q = req.url.substring(time_slice.length);
                    q = querystring.parse(q);
                    this.timeSlice(q).then((data)=> {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(JSON.stringify(data));
                        res.end();
                    }, (err) => {
                        res.writeHead(500, {'Content-Type': 'application/json'});
                        res.write(`{ "dagviz-api-error":"${err.toString()}"}`);
                        res.end();
                    });
                }
                else
                if(req.url.startsWith('/api')) {
                    const _path = req.url.substring(4);
                    const url = `${this.kasparov}${_path}`;
                    console.log('api request:',url);
                    rp(url)
                    .then(function (text) {
                        // Process html...
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(text);
                        res.end();
                    })
                    .catch(function (err) {
                        res.writeHead(200, {'Content-Type': 'application/json'});
                        res.write(`{ "dagviz-proxy-error":"${err.toString()}"}`);
                        res.end();
                    });
                }
                else
                serve(req, res, finalhandler(req, res))
            }).listen(8686, () => {
                console.log('listening on 8686');
                resolve();
            })
        });
    }

    async initDatabase() {

        const port = 8309;

        const mySQL = new MySQL({ port });
        await mySQL.start()

        return new Promise((resolve,reject) => {
            this.db_ = mysql.createConnection({
                host : 'localhost', port,
                user : 'root',
                password: 'dagviz',
                // database: 'mysql',
                insecureAuth : true
            });
            
            this.db_.connect(async (err) => {
                if(err) {
                    this.log(err);
                    this.log("FATAL - MYSQL STARTUP SEQUENCE! [2]".brightRed);
                    return reject(err);// resolve();
                }

                this.log("MySQL connection SUCCESSFUL!".brightGreen);

                this.db = {
                    query : async (sql, args) => {
                        return new Promise((resolve,reject) => {
                            this.db_.query(sql, args, (err, rows ) => {
                                if(err)
                                    return reject(err);
                                    // console.log("SELECT GOT ROWS:",rows);
                                resolve(rows);
                            });
                        });
                    }                
                }

                resolve();
                // db.end(()=>{
                //     this.log("MySQL client disconnecting.".brightGreen);
                // });
            });
        });
    }

    async sql(...args) { return this.db.query(...args); }

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
                PRIMARY KEY (id),
                UNIQUE INDEX idx_blocks_block_hash (blockHash),
                INDEX idx_blocks_timestamp (timestamp),
                INDEX idx_blocks_is_chain_block (isChainBlock)
            );        
        `);
        
        await this.sql(`
            CREATE TABLE IF NOT EXISTS block_relations (
                parent  CHAR(64) NOT NULL,
                child CHAR(64) NOT NULL
            );
        `);
       
        /*await this.sql(`
            INSERT INTO blocks (
                
                blockHash, 
                acceptingBlockHash, 
                acceptingBlockTimestamp, 
                version, 
                hashMerkleRoot, 
                acceptedIDMerkleRoot, 
                utxoCommitment, 
                timestamp, 
                bits, 
                nonce, 
                blueScore, 
                isChainBlock, 
                mass
        

            ) VALUES (
                'xblock_hash3', 
                '0',
                NULL,
                '0',
                'xhash_merkle_root',
                'xaccepted_id_merkle_root',
                'xutxo_commitment',
                NOW(),
                '0',
                '0',
                '0',
                '0',
                '0'
            );
        
        `);

        let result = await this.sql(`SELECT * FROM blocks`);
        console.log("result:", JSON.stringify(result,null,'\t'));
        */
        
        let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks`);
        // console.log('result:',result);
        this.skip = result.shift().total;
        console.log(`SELECT COUNT(*) AS total FROM blocks => ${result.total}`);
        this.sync();
    }

    log(...args) {
        console.log(...args);
    }


    fetch(options) {
        return new Promise((resolve,reject) => {

            let args = Object.entries(options).map(([k,v])=>`${k}=${v}`).join('&');

            rp(`${this.kasparov}/blocks?${args}`).then((text) => {
                let data = null;
                try {
                    data = JSON.parse(text);
                } catch(ex) {
                    reject(ex);
                }
                resolve(data);
            }, reject);
            
        })
    }

    sync() {

        const skip = this.skip;
        const limit = 100;
        const order = 'asc';

        // console.log(`fetching: ${skip}`);
        this.fetch({ skip, limit, order }).then(async (data) => {
            // let seq = skip;
            // data.forEach(o => {
            //     o.seq = seq++;
            // });
            // console.log("DATA:",data);
            await this.post(data);
            this.skip += data.length;
            const wait = data.length != 100 ? 1000 : 0;
            dpc(wait, ()=> {
                this.sync();
            });

        }, (err) => {
            console.log(err);
            const wait = 3500;
            dpc(wait, ()=> {
                this.sync();
            })

        });


    }

    post(data) {
        return new Promise(async (resolve,reject)=>{
    //console.log("DOING POST") // 'acceptingBlockTimestamp',
            let order = ['blockHash', 'acceptingBlockHash',  'version', 'hashMerkleRoot', 'acceptedIDMerkleRoot', 'utxoCommitment', 'timestamp', 'bits', 'nonce', 'blueScore', 'isChainBlock', 'mass'];

            let relations = [];

            data.forEach(block => {
                block.isChainBlock = block.isChainBlock == 'true' ? 1 : 0;

                if(block.parentBlockHashes) {
                    block.parentBlockHashes.forEach(hash => relations.push([hash, block.blockHash]));
                }
                delete block.parentBlockHashes;

                if(block.acceptingBlockHash)
                    relations.push([block.acceptingBlockHash, block.blockHash]);

                if(block.acceptingBlockHash == null)
                    block.acceptingBlockHash = '';
                //delete block.acceptingBlockHash;
            });

            data = data.map(block => order.map(field => block[field]));
                //Object.values(block));

            console.log(data[data.length-1]);

            // console.log(`
            // INSERT INTO blocks (
            //     ${order.join(', ')}
            // ) VALUES ?
            // `, [data]);

            try {
                await this.sql(`
                    INSERT INTO blocks (
                        ${order.join(', ')}
                    ) VALUES ?
                `, [data]);

                if(relations.length) {
                    await this.sql(`
                        INSERT INTO block_relations (
                            parent, child
                        ) VALUES ?
                    `, [relations]);
                }

                await this.update();

                resolve();

            } catch(ex) {
                this.log(ex);
                reject(ex.toString());
            }
        });
    }

    update() {
        return new Promise(async (resolve, reject) => {

            resolve();

            // this.sql(`
            //     UPDATE blocks AS a INNER JOIN blocks AS b on a.blockHash == b.acceptingBlockHash SET 
            // `).then(resolve,reject);


        })
    }

    timeSlice(args) {
        return new Promise(async (resolve, reject) => {

            let { from, to } = args;
            console.log(`slice: ${from}-${to}`);
            if(!from && !to) {
                to = Date.now() / 1000;
                from = to - 1000 * 60 * 60;
            }

            from = parseInt(from);
            to = parseInt(to);
            if(from < 0)
                from = 0;
            if(to < from)
                to = from+10;
console.log('from:',from);
            this.sql(`SELECT * FROM blocks WHERE timestamp >= ${from} AND timestamp <= ${to} LIMIT 100`)
                .then((data) => {
                    // postprocess
                    // DO OUTLIER PROCESSING
                    console.log(data);
                    console.log(`[${data.length}]`);
                    resolve(data);
                }, reject);

        })

    }


}

(async () => {
    const dagviz = new DAGViz();
    dagviz.init();
})();