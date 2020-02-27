import { GraphNode, GraphNodeLink } from './dag-viz.js';

const dpc = (t,fn)=>{
	if(typeof(t) == 'function'){
		setTimeout(t, fn);
	}else{
		setTimeout(fn,t);
	}
}

const tsInit = Date.now();

export class Block extends GraphNode {
	constructor(holder,data, ctx) {

		data.id = data.blockHash;
		data.name = data.id.replace(/^\s*0+/,'').substring(0,6);//+'\n\n'+(data.blueScore||'####');
		// data.parent = data.acceptingBlockHash;
		data.xMargin = 0; // 500 + ((Date.now()/1000 - data.timestamp))*50;
		data.timestmp = data.timestamp;// / 1000;
		if(!data.shape)
			data.shape = 'square';
		if(!data.color) {
			if(data.isChainBlock && ctx.isChainBlock)
				data.color = `rgba(110,210,216,0.99)`;
			else
				data.color = `rgba(194,244,255,0.99)`;
		}
		super(holder,data);

		data.size = this.getSize(); // ctx.trackSize ? Math.max(25, data.mass / 18) : 25; // 25; //data.mass/20*Math.exp(data.mass/20/10);

		this.y = Math.random();
		// this.x = 
		ctx.nodePosition(this,holder, holder.nodes); //node.data[this.unit] * this.unitScale * this.unitDist

		// this.x = Math.random();
		// this.y = Math.random();
		// this.el
		// 	.transition('cc')
		// 	.duration(1000)
		// 	.tween("attr.fill", function() {
		// 		var i = d3.interpolateNumber(data.xMargin, 0);
		// 		return function(t) {
		// 			data.xMargin = i(t)
		// 			//console.log('ssss', i(t));
		// 		};
		// 	});

		this.buildLinks();
		this.initPosition();

		(this.data.childBlockHashes || []).forEach((hash) => {
			let child = this.holder.nodes[hash];
			if(child)
				child.rebuildLinks();
		})
	}

	getSize() {
		let size = this.holder.ctx.trackSize ? Math.max(25, this.data.mass / 18) : 25; // 25; //data.mass/20*Math.exp(data.mass/20/10);
		if(size > 100)
			size = 100;

		return size;
	}

	updateSize() {
		this.data.size = this.getSize();
		this.updateStyle();
		// this.holder.simulation.alpha(0.2);

	}
}


class GraphContext {
	constructor(options) {
		this.unit = options.unit; // timestamp

		this.unitScale = 1.0;

		this.unitDist = 100;

		// this.init = 0;
		// if(this.unit == 'timestamp')
		// 	this.init = Date.now() / 1000; 
		this.trackSize = true;
		this.max = 0;

		// this.curves = true;
	}

	init(app,graph) {
		this.app = app;
		this.graph = graph;
		this.position = 0;
		
		if(this.unit == 'timestamp')
			this.position = Date.now() / 1000;
	}

	nodePosition(node, graph, nodes) {

		// if(!node.init_) {
		// 	node.init_ = true;
		// 	node.x = node.data[this.unit] * this.unitScale * this.unitDist;
		// }

		//node.x = node.data[this.unit] * this.unitScale * this.unitDist;

		// node.x = node.lscore;
		// return;

		if(node.data.parentBlockHashes) {
			let max = node.data[this.unit] * this.unitScale * this.unitDist;
			node.data.parentBlockHashes.forEach((hash) => {
				let parent = graph.nodes[hash];
				if(parent && parent.x && parent.x > max)
					max = parent.x;
			});

			node.x = max + this.unitDist;
		} else {
			node.x = node.data[this.unit] * this.unitScale * this.unitDist;
		}
		//console.log(node.x);
	}

	reposition(x) {
		if(!this.max)
			return;

		this.position = x * this.max;// * this.unitDist;
		console.log('position:',this.position,'x:',x,'max:',this.max);
		this.app.updatePosition();
	}

	getTips(block) {
		let parents = block.data.parentBlockHashes || [];
		return parents.map((parentHash) => {
			let parent = this.graph.nodes[parentHash];
			if(!parent)
				return block;
			// console.log(`${block.data.lseq}:${block.data.blockHash} -> ${parent.data.lseq}:${parent.data.blockHash}`)
			return this.getTips(parent);
		}).flat();
	}

	generateScore(block, score) {
		if(!score)
			block.lscore = block.data[this.ctx.unit];
		else {
			if(!lscore || block.lscore < score)
				block.lscore = score;
		}

		block.data.childBlockHashes.forEach((childHash) => {
			const child = this.graph.nodes[childHash];
			if(child) {
				this.generateScore(child, score + this.ctx.unitDist);
			}
		})
	}

	generateNodeLayout() {
		return;

		let tips = { };
		let nodes = Object.values(this.graph.nodes);

		nodes.forEach((node) => {
			let tips_ = this.getTips(node);
			tips_.forEach((node) => {
				if(!tips[node.data.blockHash])
					tips[node.data.blockHash] = node;
			});
		});

		Object.values(tips).forEach((node) => {
			this.generateScore(node, 0);
		})
	}

	onTrigger(e) {

		switch(e) {

			case 'trackSize': {
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateSize();
				});
			} break;
			case 'isChainBlock': {
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle();
				});
			} break;
			case 'curves':
				let curves = this.curves;
				this.graph.curves = curves;
				Object.values(this.graph.nodes).forEach((node) => {
					node.linkNodes && node.linkNodes.map(link=>{
						link.curves = curves;
						link.updateStyle()
					})
				});
			break;
		}
	}

	updateMax(max) {
		if(max == null)
			return
		this.max = max;

		console.log('new max:',max);
	}

}

export class App {
	constructor() {
		this.scores = [];
		this.ctx = new GraphContext({ unit : 'blueScore' });
		//this.rpc = new FabricRPC({origin:window.location.origin, path: "/ctl"});
		this.argv = new URLSearchParams(location.search);
		this.connect = this.argv.get('connect') !== null;
		this.init();
	}

	init() {
		this.initGraph();
		this.initNavigator();
		this.afterInit();
		this.addSmallScreenCls(document.body);
		
		//new Trigger(this.graph,'track','TRACKING');
		//new Trigger(this,'connect','LINK SEQUENTIAL');

		new Trigger(this.ctx,'curves','CURVES');
		new Trigger(this.ctx,'trackSize','MASS');
		new Trigger(this.ctx,'isChainBlock','CHAIN BLOCKS');

		let ts = Date.now();
		// let _BLOCKDAGCHAIN = BLOCKDAGCHAIN.reverse();
		// let first = _BLOCKDAGCHAIN[0];
		// let delta = ts/1000 - first.timestamp;

		// this.index = 0;
		// this.items = _BLOCKDAGCHAIN.map((o, i)=>{
		// 	o.name = `N${++i}`;
		// 	o.timestamp += delta; // Date.now()/1000 + i;
		// 	return o;
		// })
		//this.items = this.items.slice(0,25);
		// if(/simulate/.test(location.search))
		//  	this.simulateData();

		setInterval(()=>{
			this.graph.updateSimulation();
		}, 1000);


		// $(this.graph).on('click', async () => {
		// 	let blocks = await this.fetch();
		// 	this.createBlocks(blocks);
		// });

		$(window).on('keydown', (e) => {
			switch(e.key) {
				case 'ArrowRight': {
					console.log('ArrowRight');
					this.ctx.position += 10;

					console.log('pos:',this.ctx.position);
					this.updatePosition();
				} break;

				case 'ArrowLeft': {
					console.log('ArrowLeft');
					this.ctx.position -= 10;
					if(this.ctx.position < 0)
						this.ctx.position = 0;
					console.log('pos:',this.ctx.position);
					this.updatePosition();
				} break;
			}
		})
	}

	createBlocks(blocks) {
		blocks.forEach((block) => {
			if(this.graph.nodes[block.blockHash])
				return;
			this.createBlock(block);
		});

		this.ctx.generateNodeLayout();
	}

	async updatePosition() {
		this.fullFetch = true;
		const t = this.graph.paintEl.transform;
		t.x = - (this.ctx.position * t.k * this.ctx.unitDist);
		this.graph.setChartTransform(t);
	}

	fetch(args) {
		return new Promise(async (resolve,reject) => {

			let blocks = [];

			let { from, to, unit } = args;
			let done = false;
			while(!done) {
				// NOTE this produces multiple blocks!
				console.log(`fetching: from: ${from} to: ${to}`);
				let data = await this.fetch_impl({ from, to, unit });
				blocks = blocks.concat(data.blocks);
				let remains = data.total - data.blocks.length;
				if(!remains) {
					return resolve({ blocks, max : data.max });
				} else {
					from = data.last;
					console.log(`multi-fetch: from: ${from} to: ${to}`);
				}
			}
		});
	}

	fetch_impl(args) {
		return new Promise((resolve,reject) => {
			let query = '';

			if(!args.from || !args.to)
				throw new Error('missing from or to in fetch() args...');

			args.unit = this.ctx.unit;
			
			query = '?'+Object.entries(args).map(([k,v])=>`${k}=${typeof v == 'string' ? v : Math.round(v)}`).join('&');
			console.log(query);
			//$.ajax('http://finland.aspectron.com:8082/blocks'+query, 
			$.ajax('/data-slice'+query, 
			{
				dataType: 'json', // type of response data
				// timeout: 500,     // timeout milliseconds
				success: function (data,status,xhr) {   // success callback function
					// $('p').append(data.firstName + ' ' + data.middleName + ' ' + data.lastName);
					//let seq = args.skip;
					// if(!args.order || args.order == 'asc')
					// 	data.forEach((v) => v.seq = seq++);
					if(data.blocks && data.blocks.length)
						data.blocks.forEach(block => block.seq = block.id);


					console.log(data);
					resolve(data);
				},
				error: function (jqXhr, textStatus, errorMessage) { // error callback 
					console.log(textStatus,errorMessage,jqXhr);
					// $('p').append('Error: ' + errorMessage);
					reject(errorMessage);
				}
			});
		})

	}

	createBlock(data){
		// let blueScore = data.blueScore;
		// if(this.scores.includes(blueScore)) {
		// 	data.shape = "hexagonA";
		// 	data.color = `rgba(255,248,196,0.99)`;
		// 	data.textColor = '#800';
		// 	data.multi = true;
		// 	let targets = this.graph.simulationNodes.filter((node) => { return node.data.blueScore == blueScore; });
		// 	targets.forEach((target) => {
		// 		target.data.shape = data.shape;
		// 		target.data.color = data.color;
		// 		target.data.textColor = '#800';
		// 		target.data.multi = true;
		// 	})
		// }
		// this.scores.push(blueScore);
		// while(this.scores.length > 128)
		// 	this.scores.shift();

		let block = new Block(this.graph, data, this.ctx);
		this.graph.addNode(block);
	}

	onDagSelectedTip(data) {
		//block.name = block.blockHash.replace(/^0+/,'').substring(0,4);
		if(this.connect && !data.acceptingBlockHash && this.lastBlock) {
			data.acceptingBlockHash = this.lastBlock.blockHash;
		}

		// let parent = this.graph.nodes[data.acceptingBlockHash];
		// // console.log("parent:",parent);
		// if(parent && parent.timestamp == data.timestamp)
		// 	data.timestamp += 0.1;

		this.lastBlock = data;
		this.createBlock(data);
		this.graph.updateSimulation();
	}

	// simulateData(){

	// 	let wait = 1000;
	// 	let item = this.items.shift();
	// 	if(item) {

	// 		if(this.prevItem_) {
	// 			let tdelta = item.timestamp - this.prevItem_.timestamp;
	// 			if(tdelta)
	// 				wait = tdelta * 1000;
	// 		}
	// 	}
		
	// 	setTimeout(()=>{
			
	// 		if(item) {

	// 			// let parent = this.graph.nodes[item.acceptingBlockHash];
	// 			// // console.log("parent:",parent);
	// 			// if(parent && parent.timestamp == data.timestamp)
	// 			// 	item.timestamp++;// += 0.1;

	// 			this.createBlock(item);
	// 			this.prevItem_ = item;
	// 		}
			
	// 		this.graph.updateSimulation();

	// 		this.simulateData();
	// 	}, wait)
	// }
	afterInit(){
		document.body.classList.remove("initilizing");
	}
	isSmallScreen(){
		if(this._isSmallScreen != undefined)
			return this._isSmallScreen;
		this._isSmallScreen = navigator.userAgent.toLowerCase().includes("mobi");
		return this._isSmallScreen;
	}
	isMobileScreen(){
		return this.isSmallScreen();
	}
	addSmallScreenCls(el){
		if(this.isSmallScreen()){
			el.classList.add("small-screen");
		}
	}
	initGraph() {
		this.graph = document.getElementById("dagViz");
		this.graph.ctx = this.ctx;
		this.graph.registerRegionUpdateSink(this.updateRegion.bind(this));
		this.graph.tdist = parseInt(this.argv.get('tdist') || 0) || this.graph.tdist;

		this.graph.track = false;
		this.ctx.init(this, this.graph);
	}

	initNavigator() {
		this.navigator = document.getElementById("timenav");
		this.navigator.app = this;
		this.updateRegion({pos:0, range:10})
		/*
		this.ctx.position =  30000;
		this.updatePosition();
		this.updateRegion({pos:30000, range:10})
		*/
	}

	updateGraph() {
		this.graph.updateGraph(this.graph.data);	
	}
	getGraphNodesByNames(names){
		let list = [];
		names.forEach(name=>{
			if(this.graph.nodes[name])
				list.push(this.graph.nodes[name]);
		})
		return list;
	}
	centerGraphBy(nodeId){
		this.graph.centerBy(nodeId);
	}

	async updateRegion(o) {
		let { pos, range } = o;

		let left = false, right = false;
		if(pos > this.ctx.position)
			right = true;
		else
			left = true;
		this.ctx.position = pos
		range *= 1.2; //1.6;

		// if(limit > 100)
		// 	limit = 100;
		// t += 1000;
		// limit *= 1000;

		//let limit = 100;
		let from = pos - range / 2;
		let to = pos + range / 2;


		//this.navigator.update(pos / this.ctx.max);
		this.navigator.redraw();

		// const first = skip - limit;
		// const last = skip + limit;
		let max, min;
		//let t = this.graph.paintEl.transform, tx = t.x/t.k;
		console.log("range:", {from,to,pos,range});
		Object.values(this.graph.nodes).forEach((node) => {
			//console.log("xxxxxxx", node.x+tx,  node.x, node.data[this.ctx.unit])
			if(node.data[this.ctx.unit] < from || node.data[this.ctx.unit] > to) {
				//console.log('deleting:',node.data[this.ctx.unit]);
				// TODO - ensure links TO this node also get removed
				node.purge();
			} else {
				max = min = node.data[this.ctx.unit];
			}
		})

		if(!this.fullFetch) {
			if(right && max) {
				from = max;
			} else if(left && min) {
				to = min;
			}
		}
		else
			this.fullFetch = false;
		
		let { blocks, max : max_ } = await this.fetch({ from, to });
		this.ctx.updateMax(max_);
		this.createBlocks(blocks);
		//blocks.forEach(block=>this.createBlock(block));
		this.graph.updateSimulation();

	}
}

class Trigger {
	constructor(target, ident, caption) {
		this.target = target;
		this.ident = ident;
		this.caption = caption;
		this.el = $(`<span id="${ident}" class='trigger'></span>`);
		$("#hud .ctl").append(this.el);

		$(this.el).on('click', () => {
			this.target[this.ident] = !(!!this.target[this.ident]);
			if(this.target.onTrigger)
				this.target.onTrigger(ident, this.target[this.ident]);
			this.update();
		})

		this.update();
	}

	update() {
		this.el.html(`${this.caption}: ${this.target[this.ident] ? 'ON' : 'OFF' }`);
	}
}