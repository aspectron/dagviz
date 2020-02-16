var finalhandler = require('finalhandler')
var http = require('http')
var serveStatic = require('serve-static')
 
// Serve up public/ftp folder
var serve = serveStatic('./', { 'index': ['index.html', 'index.htm'] })
 
// Create server
var server = http.createServer((req, res)=>{
  serve(req, res, finalhandler(req, res))
}).listen(8080);