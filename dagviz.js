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
        this.args = MF.utils.args();

        this.kasparov = `http://kasparov-dev-auxiliary-open-devnet.daglabs.com:8080`;
        // this.kasparov = `http://finland.aspectron.com:8082`;
        if(this.args['kasparov']) {
            this.kasparov = this.args['kasparov'];
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
            
            const data_slice = '/data-slice?';

            // Create server
            const server = http.createServer((req, res)=>{
                if(req.url.startsWith(data_slice)) {
                    let q = req.url.substring(data_slice.length);
                    q = querystring.parse(q);
                    this.dataSlice(q).then((data)=> {
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
                        return new Promise((resolve,reject) => {
                            this.dbPool.getConnection((err, connection) => {
                                //console.log("CONNECTION:",connection);
                                if(err)
                                    return reject(err);

                                connection.query(sql, args, (err, rows) => {
                                    connection.release();
                                    if(err)
                                        return reject(err);
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
        console.log(`SELECT COUNT(*) AS total FROM blocks => ${this.skip}`);
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
        const limit = 100;
        const order = 'asc';

        process.stdout.write(` ...${skip}... `);
        // console.log(`fetching: ${skip}`);
        this.fetch({ skip, limit, order }).then(async (data) => {
            // let seq = skip;
            // data.forEach(o => {
            //     o.seq = seq++;
            // });
            // console.log("DATA:",data);
            if(data.total && data.total != this.lastTotal)
                this.lastTotal = data.total;

            if(data.blocks && data.blocks.length) {
                await this.post(data.blocks);
                this.skip += data.blocks.length;
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

        });


    }

    post(blocks) {
        // console.log("DATA:",data);

        this.lastBlock = blocks[blocks.length-1];

        return new Promise(async (resolve,reject)=>{
    //console.log("DOING POST") // 'acceptingBlockTimestamp',
            let order = ['blockHash', 'acceptingBlockHash',  'version', 'hashMerkleRoot', 'acceptedIDMerkleRoot', 'utxoCommitment', 'timestamp', 'bits', 'nonce', 'blueScore', 'isChainBlock', 'mass', 'parentBlockHashes', 'childBlockHashes'];

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

            blocks = blocks.map(block => order.map(field => block[field]));
                //Object.values(block));

            process.stdout.write(` ${blocks.length}[${relations.length}] `);

            //console.log(data[data.length-1]);

            // console.log(blocks.length,'blocks ',relations.length,'relations');
            // console.log(`
            // INSERT INTO blocks (
            //     ${order.join(', ')}
            // ) VALUES ?
            // `, [blocks]);

            try {
                await this.sql(`
                    INSERT INTO blocks (
                        ${order.join(', ')}
                    ) VALUES ?
                `, [blocks]);

                if(relations.length) {
                    await this.sql(`
                        INSERT INTO block_relations (
                            parent, child, linked
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
            console.log(`slice: ${from}-${to}`);
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

            console.log(`unit: ${unit} from: ${from} to: ${to}`);

            let limit = 100;

            try {
                // console.log("REQUESTING...")

                let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks WHERE ${unit} >= ${from} AND ${unit} <= ${to}`);
                // let result = await this.sql(`SELECT COUNT(*) AS total FROM blocks`);
                // console.log('result:',result);
                let total = result.shift().total;
        

                // console.log(`SELECT * FROM blocks WHERE ${unit} >= ${from} AND ${unit} <= ${to} ORDER BY ${unit} LIMIT ${limit}`);
                let blocks = await this.sql(`SELECT * FROM blocks WHERE ${unit} >= ${from} AND ${unit} <= ${to} ORDER BY ${unit} LIMIT ${limit}`);
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

                console.log(`blocks: ${blocks.length} last: ${last} total: ${total} max: ${max}`);
                resolve({ blocks, last, total, max });
            } catch(ex) {
                console.log(ex);
                reject(ex);
            }

        })
    }


}

(async () => {
    const dagviz = new DAGViz();
    dagviz.init();
})();