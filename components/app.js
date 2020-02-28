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
				data.color = `rgba(194,255,204,0.99)`;
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
		let size = this.holder.ctx.trackSize ? Math.max(25, this.data.mass / 20) : 25; // 25; //data.mass/20*Math.exp(data.mass/20/10);
		if(size > 50)
			size = 50;

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

		this.rangeScale = 1.4;  // for of war vs viewport window coefficient

		this.isChainBlock = true;
		// this.curves = true;
		this.track = false;

		this.dir = 'E';

		this.directions = {
			'E' : {
				h : true,
				size : 'width',
				axis : 'x',
				sign : 1,
			},
			'S' : {
				v : true,
				size : 'height',
				axis : 'y',
				sign : 1,
			},
			'W' : {
				h : true,
				size : 'width',
				axis : 'x',
				sign : -1,
			},
			'N' : {
				v : true,
				size : 'height',
				axis : 'y',
				sign : -1,
			}
		}

		this.direction = this.directions[this.dir];
	}

	init(app,graph) {
		this.app = app;
		this.graph = graph;
		this.position = 0;
		

		let url = new URL(window.location.href);
		let position = url.searchParams.get('pos');
		if(position) {
			this.position = position;
			console.log('initializing position to:',position);
			dpc(()=>{
				app.updatePosition();
			})

		}


		// if(window.location.hash) {
		// 	let text = window.location.hash.substring(1);
		// 	if(text.length < 64) {
		// 		let position = parseInt(text);
		// 		if(position) {
		// 			this.position = position;
		// 			console.log('initializing position to:',position);
		// 		}

		// 		dpc(()=>{
		// 			app.updatePosition();
		// 		})
		// 	}
		// }

		if(this.unit == 'timestamp')
			this.position = Date.now() / 1000;

			
	}

	nodePosition(node, graph, nodes) {

		// if(!node.init_) {
		// 	node.init_ = true;
		// 	node.x = node.data[this.unit] * this.unitScale * this.unitDist;
		// }

		//node.x = node.data[this.unit] * this.unitScale * this.unitDist;

		if(this.inChainBlocksCenter) {
			if(!node.location_init_)
				node.location_init_ = Date.now();

			if(node.location_init_ > Date.now()-100) {
				// node.location_init_ = Date.now();
				let idx = this.getIdx(node);
				let cluster = graph.locationIdx[idx];
				if(cluster && cluster.length > 1) {
					if(node.data.isChainBlock) {
						node.y = 0;
						//node.y = node.y * 0.1;
					} else {
						let len = (cluster.length) || 1;
						let pos = cluster.indexOf(node);
						let dest = ((0 - len/2) + pos) * this.unitDist * 1.2;

						// console.log('idx',idx,len,dest);
						//node.y = (0 - len/2) * this.unitDist * 2;
						node.y = dest;
						//node.y = node.y * 0.9 + 0.1 * dest;
					}
				}
			}
		}
		
		
			// else {
			// 	node.y = this.unitDist; // Math.round(node.y);
			// }

		// node.x = node.lscore;
		// return;
		// node.y = node.data.isChainBlock ? 0 : Math.round(node.y);
		const { axis, sign } = this.direction;
		if(node.data.parentBlockHashes) {
			let max = node.data[this.unit] * this.unitScale * this.unitDist;
			node.data.parentBlockHashes.forEach((hash) => {
				let parent = graph.nodes[hash];
				if(parent && parent[axis] && Math.abs(parent[axis]) > max)
					max = Math.abs(parent[axis]);
			});

			node[axis] = Math.round(max + this.unitDist*2)*sign;
//			node[axis] = Math.round(node.data[this.unit] * this.unitScale * this.unitDist * sign);
		} else {
			node[axis] = Math.round(node.data[this.unit] * this.unitScale * this.unitDist * sign);
		}
		//console.log(node.x);
	}

	reposition(x) {
		if(!this.max)
			return;

		this.position = x * this.max;// * this.unitDist;
		// console.log('position:',this.position,'x:',x,'max:',this.max);
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

	onTrigger(e, value) {

		switch(e) {
			case 'track': {
				if(this.lastBlockData && this.track) {
					let v = this.lastBlockData[this.unit] * this.unitDist;
					this.graph.translate(v,0);
				}
			} break;
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

			case 'dir': {

				this.direction = this.directions[value];

				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle();
				})
			} break;
		}
	}

	updateMax(max) {
		if(max == null)
			return
		this.max = max;

		// console.log('new max:',max);
	}

	getIdx(node) {
		return Math.round(node.data[this.unit] * 10);
	}


	onSelectionUpdate(selection) {
		// console.log('selection:',selection);
		let length = Object.keys(selection).length;
		if(length > 1) {
			$('.needs-multi-select').css({
				display:'block',
				opacity : 0.65
			});
		} else {
			$('.needs-multi-select').css({
				opacity : 0
			});
		}

		window.location.hash = '#lseq:'+Object.values(selection).map(block=>parseInt(block.data.lseq).toString(16)).join(':');
	}

}

export class App {
	constructor() {
		this.scores = [];
		this.ctx = new GraphContext({ unit : 'blueScore' });
		//this.rpc = new FabricRPC({origin:window.location.origin, path: "/ctl"});
		this.argv = new URLSearchParams(location.search);
		this.connect = this.argv.get('connect') !== null;

		this.last_range_ = 1;
		this.last_position_ = -1;

		this.init();
	}

	init() {
		this.initGraph();
		this.initNavigator();
		this.initIO();
		this.initPosition();
		this.afterInit();
		this.addSmallScreenCls(document.body);
		
		new Trigger(this.ctx,'track','TRACKING');
		//new Trigger(this,'connect','LINK SEQUENTIAL');

		new Trigger(this.ctx,'curves','CURVES');
		new Trigger(this.ctx,'trackSize','MASS');
//		new Trigger(this.ctx,'isChainBlock','CHAIN BLOCKS');
		new Trigger(this.ctx,'inChainBlocksCenter','CENTER');
//		new Trigger(this.ctx,'inChainBlocksTension','TENSION');

//		new MultiChoice(this.ctx,'dir',['E','S','W','N'],'DIRECTION');

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
		});


		window.addEventListener('hashchange', () => {
			console.log('hash changed!');
//			this.initPosition();			
		}, false);


		$('#get-multi-select-link').on('click', (e) => {
			const selection = Object.values(this.graph.selection).map(node => parseInt(node.data.lseq).toString(16)).join(':');
			let el = document.getElementById('copy-url');
			let url = new URL(window.location.href);
			url.hash = `lseq:${selection}`;
			console.log(url.toString());
			el.innerText = url.toString();
			$(el).show();
			window.app.selectText(el);//.select();
			document.execCommand('copy');
			$(el).hide();
			console.log('copied...');	
		});

		$("#logo").on('click', () => {
			this.ctx.reposition(0);
		})
	}

	createBlocks(blocks) {
		const nodes = blocks.map((block) => {
			// let node = this.graph.nodes[block.blockHash];
			// if(node) {
			// 	// update node's data
			// 	Object.assign(node.data, block );
			// 	return node;
			// }
			return this.createBlock(block);
		});

		this.ctx.generateNodeLayout(nodes);

		return nodes;
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
				this.verbose && console.log(`fetching: from: ${from} to: ${to}`);
				let data = await this.fetch_impl({ from, to, unit });
				blocks = blocks.concat(data.blocks);
				let remains = data.total - data.blocks.length;
				if(!remains) {
					return resolve({ blocks, max : data.max });
				} else {
					from = data.last;
					this.verbose && console.log(`multi-fetch: from: ${from} to: ${to}`);
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
			// console.log(query);
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


					// console.log(data);
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
		//console.log("creating",data.blockHash);
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

		let node = this.graph.nodes[data.blockHash];
		if(node) {
			// update node's data
			delete data.id;
			Object.assign(node.data, data);
			return node;
		}


		let block = new Block(this.graph, data, this.ctx);
		this.graph.addNode(block);
		return block;
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


		const t = this.graph.paintEl.transform;
		let url = new URL(window.location.href);
		let k = url.searchParams.get('k');
		k = parseFloat(k);
		if(k) {

		//t.x = - (this.ctx.position * t.k * this.ctx.unitDist);
			t.k = k;
			// this.graph.setChartTransform(t);
		}

	}

	initIO() {
		this.io = io();//new io();//new io('/socket.io');

		this.io.on('blocks', (blocks) => {
			console.log('blocks:', blocks);

			this.ctx.lastBlockData = blocks[blocks.length-1];
			this.ctx.lastBlockDataTS = Date.now();

			if(!this.ctx.track) {
				let region = this.getRegion();
				blocks = blocks.filter((block) => {
					block.origin = 'tip-update';
					if(block[this.ctx.unit] < (region.from-this.range_) || block[this.ctx.unit] > (region.to+this.range_))
						return false;
					return true;
				});
			}
	
			if(blocks.length) {

				this.createBlocks(blocks);
				this.graph.updateSimulation();
			}
		});

		this.io.on('last-block-data', (data) => {
			// console.log('last block:', data);

			let v = data[this.ctx.unit];
			if(v)
				this.ctx.updateMax(v);
		})

		//this.io.on('connect', (socket) => {
			
			// console.log('connected...', socket);
			// socket.on('message', (msg) => {
			// 	console.log('message: ', msg);
			// });
			// socket.on('blocks', (msg) => {
			// 	console.log('incoming-blocks: ', msg);
			// });
		//});		
	}

	initNavigator() {
		this.navigator = document.getElementById("timenav");
		this.navigator.app = this;
//		this.updateRegion({pos:0, range:2});

//		this.firstRegionUpdate = true;
// console.log("init position is",this.ctx.position);


		// $("#logo").on('click', () => {
			// TODO - reset to 0
		// })

	}

	async initPosition() {

		let args = window.location.hash;
		if(args) 
			args = args.substring(1);

		this.updateRegion({pos:this.ctx.position, range:16});

		if(/\w+:/.test(args)) {
console.log('requesting args:',args);
			let blocks = await this.fetchBlock(args);
			console.log('got blocks array:', blocks);
			let nodes = blocks.map((block) => {
				if(this.graph.nodes[block.blockHash])
					return null;
				let node = this.createBlock(block);
				node.select(true);
				return node;
			}).filter(v=>v);
			 console.log('created or obtained nodes:',nodes);
			let first = blocks[0];
			this.updateRegion({pos:first[this.ctx.unit], range:16});

//			this.graph.updateSimulation();
/*
			dpc(1000, ()=>{

				let node = nodes.shift();

				if(node)
					this.graph.centerBy(node);
				
				this.updatePosition();			

				if(node)
					node.select(true);
			})
*/

			// dpc(1000,()=>{
			// 	node.select(true);
			// })
		 } 
		 // else {
// console.log('update region....');
// 			this.updateRegion({pos:this.ctx.position, range:16});
// 		}


		//  let url = new URL(window.location.href);
		//  url.searchParams.set(this.ident, value?1:0);


		/*
		this.ctx.position =  30000;
		this.updatePosition();
		this.updateRegion({pos:30000, range:10})
		*/

		// this.reposition
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
		this.ctx.position = pos;
		range *= this.ctx.rangeScale; //1.6;
		this.ctx.range = range;

		// if(limit > 100)
		// 	limit = 100;
		// t += 1000;
		// limit *= 1000;

		this.range_ = range;
		
		if(Math.round(this.last_range_*10) != Math.round(range*10)) {
			// if(this.last_range_ > range && Math.round(this.last_position_) == Math.round(this.ctx.position)) {
			// 	// ... do nothing ...
			// 	console.log('doing nothing...');
			// 	this.graph.updateSimulation();
			// 	this.navigator.redraw();
			// 	return;

			// } else {
			// 	// this.fullFetch = true;
			// }
			this.last_range_ = range;
			this.fullFetch = true;
		//	this.last_position_ = this.ctx.position;
		}
		

		//let limit = 100;
		const half_range = range / 2;
		let from = pos - half_range;
		let to = pos + half_range;


		//this.navigator.update(pos / this.ctx.max);
		this.navigator.redraw();
		// window.location.hash = '#'+Math.round(this.ctx.position);
		this.updateLocationSearchStringWithPosition(Math.round(this.ctx.position));
		// const first = skip - limit;
		const eraseMargin = half_range;
		// const last = skip + limit;
		let max, min;
		//let t = this.graph.paintEl.transform, tx = t.x/t.k;
		// console.log("range:", {from,to,pos,range});
		Object.values(this.graph.nodes).forEach((node) => {
			if(node.selected)
				return;

			if(this.ctx && this.ctx.lastBlockData && node.data.blockHash == this.ctx.lastBlockData.blockHash)
				return;

			//console.log("xxxxxxx", node.x+tx,  node.x, node.data[this.ctx.unit])
			if(node.data[this.ctx.unit] < (from-eraseMargin) || node.data[this.ctx.unit] > (to+eraseMargin)) {
				//console.log('deleting:',node.data[this.ctx.unit]);
				// console.log(from,to);
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


		let region = this.getRegion();
		// console.log("xxxxx",this.ctx.position, region.position, range, region.range);

		blocks = blocks.filter((block) => {
			if(block[this.ctx.unit] < (region.from-half_range) || block[this.ctx.unit] > (region.to+half_range))
				return false;
			return true;
		});

		this.createBlocks(blocks);
		//blocks.forEach(block=>this.createBlock(block));
		this.graph.updateSimulation();

		// if(this.firstRegionUpdate) {
		// 	this.firstRegionUpdate = false;
		// 	let initPos = parseInt(window.location.hash.substring(1));
		// 	this.position = initPos();
		// 	this.updatePosition();
		// 	//this.ctx.reposition();
		// }

		// this.navigator.redraw();
	}

	updateLocationSearchStringWithPosition(pos) {
		let url = new URL(window.location.href);
		url.searchParams.set('pos', pos);
		let state = { pos }
		history.replaceState(state, "BlockDAG Viz", "?"+url.searchParams.toString()+url.hash);

	}

	getRegion() {
		let transform = this.graph.paintEl.transform;
		let position = -(transform.x / transform.k / this.ctx.unitDist);
		const box = this.graph.graphHolder.getBoundingClientRect();
		let range = Math.ceil(box.width / transform.k / this.ctx.unitDist) * this.ctx.rangeScale;
		let from = position - range / 2;
		let to = position + range / 2;
//		console.log("RANGE RANGE RANGE RANGE RANGE RANGE RANGE RANGE RANGE ",range);
		return { position, range, from, to };
	}

	fetchBlock(hash) {
		return new Promise((resolve,reject) => {
			$.ajax('/block/'+hash, 
			{
				dataType: 'json', // type of response data
				// timeout: 500,     // timeout milliseconds
				success: function (data,status,xhr) {   // success callback function
					// $('p').append(data.firstName + ' ' + data.middleName + ' ' + data.lastName);
					//let seq = args.skip;
					// if(!args.order || args.order == 'asc')
					// 	data.forEach((v) => v.seq = seq++);
					// if(data.blocks && data.blocks.length)
					// 	data.blocks.forEach(block => block.seq = block.id);


					// console.log(data);
					resolve(data);
				},
				error: function (jqXhr, textStatus, errorMessage) { // error callback 
					console.log(textStatus,errorMessage,jqXhr);
					// $('p').append('Error: ' + errorMessage);
					reject(errorMessage);
				}
			});
		});

	}




    selectText(node) {
        //node = this.shadowRoot.getElementById(node);
    
        if (document.body.createTextRange) {
            const range = document.body.createTextRange();
            range.moveToElementText(node);
            range.select();
            console.log('range');
        } else if (window.getSelection) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(node);
            selection.removeAllRanges();
            selection.addRange(range);
            console.log('getSelection');

        } else {
            console.warn("Could not select text in node: Unsupported browser.");
        }
    }
    

}

class Trigger {
	constructor(target, ident, caption) {
		this.target = target;
		this.ident = ident;
		this.caption = caption;
		this.el = $(`<span id="${ident}" class='trigger'></span>`);
		$("#top .ctl").append(this.el);

		let url = new URL(window.location.href);
		let params = url.searchParams;
		let p = params.get(ident);
		if(p==1 || p==0)
			this.setValue(p==1)

		$(this.el).on('click', () => {
			//let hash = window.location.hash;
			let value = !(!!this.target[this.ident]);
			this.setValue(value);
			let url = new URL(window.location);
			url.searchParams.set(this.ident, value?1:0);
			let state = {
				[this.ident] : value
			}
			// state[this.ident] = value;
			history.replaceState(state, "BlockDAG Viz", "?"+url.searchParams.toString()+url.hash.toString());
		})

		this.update();
	}

	setValue(value){
		this.target[this.ident] = value;
		if(this.target.onTrigger)
			this.target.onTrigger(this.ident, value);
		this.update();
	}

	update() {
		this.el.html(`${this.caption}: ${this.target[this.ident] ? 'ON' : 'OFF' }`);
	}
}

class MultiChoice {
	constructor(target, ident, choices, caption) {
		this.target = target;
		this.ident = ident;
		this.caption = caption;
		this.choices = choices;
		this.el = $(`<span id="${ident}" class='trigger'></span>`);
		$("#top .ctl").append(this.el);

		let url = new URL(window.location.href);
		let params = url.searchParams;
		let p = params.get(ident);
		//if(p==1 || p==0)
		if(p)
			this.setValue(p);

		$(this.el).on('click', () => {
			// let hash = window.location.hash;
			let value = this.target[this.ident];
			let idx = this.choices.indexOf(value);
			idx++;
			if(idx > this.choices.length-1)
				idx = 0;
			value = this.choices[idx];
			this.setValue(value);
			let url = new URL(window.location.href);
			url.searchParams.set(this.ident, value);
			let state = {
				[this.ident] : value
			}
			// state[this.ident] = value;
			history.replaceState(state, "BlockDAG Viz", "?"+url.searchParams.toString()+url.hash);
		})

		this.update();
	}

	setNext() {
		let v = this.target[this.ident];
		if(v === undefined) {
			this.target[this.ident] = this.choices[0];
			return this.target[this.ident];
		}
	}

	setValue(value){
console.log(value);
		if(!this.choices.includes(value))
			value = this.choices[0];

		this.target[this.ident] = value;
		if(this.target.onTrigger)
			this.target.onTrigger(this.ident, value);
		this.update();
	}

	update() {
		this.el.html(`${this.caption}: ${this.target[this.ident] }`);
	}
}
