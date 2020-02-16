const http = require("http");
const serveStatic = require('serve-static')
const finalhandler = require('finalhandler')
const app = (req, res)=>{
	console.log("req.url", req.url)
	res.send = (data)=>{
		res.write(data);
		res.end();
	}
	let next = ()=>{
		res.writeHead(200, { 'Content-Type': 'text/plain'});
		res.write(".....");
		res.end();
	}
	let i=0;
	let digest = ()=>{
		let f = app.useFns[i++];
		if(!f)
			return next();

		if(!f.path)
			return f.fn(req, res, digest)

		if(req.url.indexOf(f.path) === 0)
			return f.fn(req, res, digest)

		digest();
	}

	digest();
}
app.useFns = []
app.use = (path, fn)=>{
	if(!fn){
		fn = path;
		path = null;
	}
	app.useFns.push({path, fn});
}

http.createServer({}, app).listen(8080);

let finalhandler = (req, res)=>(req, res)=>{
	console.log("req, res", req, res)
	res.send("");
}

// Serve up public/ftp folder
var serve = serveStatic('/', { 'index': ['index.html', 'index.htm'] })
app.use(serve)