const mime = require('mime-types');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const finalhandler = require('finalhandler')

class WebApp {
    constructor(){
        this.fns = [];
    }

    createParamsRegExp(str){
        str = str.replace(/(:[a-zA-Z_0-9]*)/g, (s, name)=>{
            return `(?<${name.substr(1)}>[a-zA-Z_0-9]*)`;
        })
        return new RegExp(str);
    }

    get(regexp, callback){
        let createParams = false;
        if(regexp && !regexp.test && regexp.indexOf("/:")>-1){
            regexp = this.createParamsRegExp(regexp);
            createParams = true;
        }
        this.fns.push({regexp, callback, createParams});
    }

    use(regexp, callback){
        if(!callback){
            callback = regexp;
            regexp = false;
        }
        
        this.fns.push({regexp, callback, isMiddleware:true});
    }

    run(req, res){
        res.writeJSON = (data, statusCode=200)=>{
            res.writeHead(statusCode, {'Content-Type': 'application/json'});
            if(Object.prototype.toString.call(data) === '[object String]')
                res.write(data)
            else
                res.write(JSON.stringify(data));
        }
        res.sendJSON = (data, statusCode=200)=>{
            res.writeJSON(data, statusCode);
            res.end();
        }
        res.sendFile = (filePath, options={})=>{
            let {contentType} = options;
            contentType = contentType || mime.contentType(path.extname(filePath));
            
            fs.readFile(filePath, null, (err, data)=>{
                if (err) {
                    res.writeHead(404);
                    res.write('File not found!');
                } else {
                    if(contentType)
                        res.writeHead(200, {'Content-Type': contentType});
                    res.write(data);
                }
                res.end();
            });
        }
        req.originalUrl = req.url;
        let [reqPath, qs] = req.url.split("?");
        req.reqPath = reqPath;
        req.query = querystring.parse(qs||"");

        this._run(req, res);
    }
    _run(req, res){
        let index = 0;
        let reqPath = req.reqPath;
        let next = (err)=>{
            if(err)
                return res.sendJSON(err, 500);

            let {regexp, callback, isMiddleware, createParams} = this.fns[index++] || {};
            req.params = {};
            if(!callback)
                return this.finalhandler(req, res);

            if(!regexp)
                return callback(req, res, next)

            let run = ()=>{
                req.path = reqPath.substr(req.baseUrl.length);
                //console.log("req.path", req.path, req.baseUrl)
                if(req.path.length && req.path[0] != '/')
                    return next();
                req.url = isMiddleware? req.url.substr(req.baseUrl.length) : req.url;
                callback(req, res, next)
            }

            if(regexp.test){
                let m = reqPath.match(regexp)
                if(m && m.index===0){
                    req.baseUrl = m[0];
                    if(createParams && m.groups)
                        req.params = Object.fromEntries(Object.entries(m.groups))
                    return run();
                }
                next();
                return
            }

            if(reqPath.startsWith(regexp)){
                req.baseUrl = regexp;
                return run();
            }

            next();
        }

        next();
    }

    finalhandler(req, res){
        finalhandler(req, res)();
    }
}

module.exports = WebApp;