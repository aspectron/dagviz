const finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')
const rp = require('request-promise');
const MF = require('micro-fabric');
 
const args = MF.utils.args();

let kasparov = `http://finland.aspectron.com:8082`;
if(args['kasparov']) {
  kasparov = args['kasparov'];
}
console.log(`kasparov api server at ${kasparov}`);

// Serve up public/ftp folder
var serve = serveStatic('./', { 'index': ['index.html', 'index.htm'] })
 
// Create server
var server = http.createServer((req, res)=>{
  if(req.url.startsWith('/api')) {
    const _path = req.url.substring(4);
    const url = `${kasparov}${_path}`;
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
});