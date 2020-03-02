const crypto = require('crypto');
const mysql = require('mysql');
const finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')
const rp = require('request-promise');
const querystring = require('querystring');
const MF = require('micro-fabric');
const MySQL = require('./lib/mysql');

 

class Proxy {

    constructor() {
        this.args = MF.utils.args();

        this.kasparov = `http://kasparov-dev-auxiliary-open-devnet.daglabs.com:8080`;
        // this.kasparov = `http://finland.aspectron.com:8082`;
        if(this.args['kasparov']) {
            this.kasparov = this.args['kasparov'];
        }
        console.log(`kasparov api server at ${this.kasparov}`);

    }


    async init() {
        await this.initHTTP();
    }

    async initHTTP() {
        return new Promise((resolve,reject) => {

            // Serve up public/ftp folder
            const serve = serveStatic('./', { 'index': ['index.html', 'index.htm'] })
            
            const data_slice = '/data-slice?';

            // Create server
            const server = http.createServer((req, res)=>{
                if(req.url.startsWith('/block')) {
                    const _path = req.url;//.substring(4);
                    const url = `${this.kasparov}${_path}`;
                    console.log('proxy:',url);
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
            }).listen(6868, () => {
                console.log('listening on 6868');
                resolve();
            })
        });
    }



}

(async () => {
    const proxy = new Proxy();
    proxy.init();
})();