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
		data.detsalt = parseInt(data.blockHash.substring(64-4), 16) / 0xffff;
		data.name = data.id.replace(/^\s*0+/,'').substring(0,6);
		data.xMargin = 0; // 500 + ((Date.now()/1000 - data.timestamp))*50;
		data.timestmp = data.timestamp;// / 1000;
		if(!data.shape)
			data.shape = ctx.shape; // 'square';
		if(!data.color) {
			if(data.isChainBlock && ctx.chainBlocksDistinct)
				data.color = `rgba(194,255,204,0.99)`;
			else
				data.color = `rgba(194,244,255,0.99)`;
		}
		super(holder,data);
		this.detsalt = data.detsalt;
		data.size = this.getSize(); 
		this.x = Math.random();
		this.y = Math.random();
		ctx.nodePosition(this,holder, holder.nodes);

		this.buildLinks();
		this.initPosition();

		(this.data.childBlockHashes || []).forEach((hash) => {
			let child = this.holder.nodes[hash];
			if(child)
				child.rebuildLinks();
		})
	}

	getSize() {
		// ctx.trackSize ? Math.max(25, data.mass / 18) : 25; // 25; //data.mass/20*Math.exp(data.mass/20/10);
		let size = this.holder.ctx.mass ? Math.max(25, this.data.mass / 20) : 25; // 25; //data.mass/20*Math.exp(data.mass/20/10);
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
		this.position = 10;
		this.max = 0;
		this.mass = true;
		this.curves = true;
		this.initZoom = 0.5; // initial zoom
		this.rangeScale = 1.4;  // fog of war vs viewport window coefficient (default)
		this.chainBlocksDistinct = 'border';
		this.chainBlocksCenter = 'force';
		this.selectionMode = 'linking';
		this.track = false;
		this.shape = 'square';
		this.layout = 'determ';
		this.quality = 'high';

		this.dir = 'E';
		this.directions = {
			'E' : {
				h : true,
				size : 'width',
				axis : 'x',
				layoutAxis : 'y',
				sign : 1,
			},
			'S' : {
				v : true,
				size : 'height',
				axis : 'y',
				layoutAxis : 'x',
				sign : 1,
			},
			'W' : {
				h : true,
				size : 'width',
				axis : 'x',
				layoutAxis : 'y',
				sign : -1,
			},
			'N' : {
				v : true,
				size : 'height',
				axis : 'y',
				layoutAxis : 'x',
				sign : -1,
			}
		}

		this.direction = this.directions[this.dir];
	}

	init(app,graph) {
		this.app = app;
		this.graph = graph;
		this.position = 0;

		// TODO timestamp units
		if(this.unit == 'timestamp')
			this.position = Date.now() / 1000;
	}

	nodeLinkCurveData(x1, y1, x2, y2){
		if(this.direction.v){
			let yy = y1+(y2-y1)*0.5;
			return `M${x1},${y1} C${x1},${yy} ${x2},${yy} ${x2},${y2}`;
		}else{
			let xx = x1+(x2-x1)*0.5;
			return `M${x1},${y1} C${xx},${y1} ${xx},${y2} ${x2},${y2}`;
		}
	}
	nodePosition(node, graph, nodes) {

		const { axis, sign, layoutAxis } = this.direction;
		const ts = Date.now();

		node[layoutAxis] = Math.round(node[layoutAxis]);

		let needsToRun = false;
		if(!node.location_init_) {
			node.location_init_ = ts;
			needsToRun = true;
		}

		if(!node.cluster_) {
			const idx = this.getIdx(node);
			node.cluster_ = graph.locationIdx[idx];
		}

		if(node.cluster_size_ != node.cluster_.length) {
			node.cluster_size_ = node.cluster_.length;
			needsToRun = true;
		}

		if(this.layout != this.last_layout_) {
			this.last_layout_ = this.layout;
			needsToRun = true;
		}

		if(this.dir != node.last_dir){
			node.last_dir = this.dir;
			needsToRun = true;
		}


		if(node.location_init_ > ts-64 || needsToRun || !node.layout_ctx_) {
			const cluster = node.cluster_;
			const clusterSize = cluster ? cluster.length || 1 : 1;

			if(!node.layout_ctx_ || node.layout_ctx_.clusterSize != clusterSize || needsToRun) {
				const clusterIdx = cluster && cluster.length ? cluster.indexOf(node) : 0;
				//const detPos = parseInt(node.data.blockHash.substring(64-4), 16) / 0xffff * clusterSize;
				const detPos = node.detsalt * clusterSize;
				node.layout_ctx_ = {
					enable : true
				};
				
				if(node.data.isChainBlock && (this.chainBlocksCenter == 'force' || this.isChainBlocksCenter == 'fixed')) {
					node.layout_ctx_.pos = 0;
				} else { 
					switch(this.layout) {
						case 'determ': {
							node.layout_ctx_.pos = ((0 - clusterSize/2) + detPos) * this.unitDist * 1.5;
						} break;
						case 'random': {
							node.layout_ctx_.pos = ((0 - clusterSize/2) + clusterIdx) * this.unitDist * 1.5;
						} break;
						case 'free': 
						default: {
							node.layout_ctx_.enable = false;				
							node[layoutAxis] = Math.random()*2-1;
						} break;
					}
				}
			}
			if(node.layout_ctx_.enable)
				node[layoutAxis] = node.layout_ctx_.pos;
		} 
		else {
			if(node.data.isChainBlock && this.chainBlocksCenter =='fixed')
				node[layoutAxis] *= 0.1;
			else
			if(this.chainBlocksCenter =='force' && node.data.isChainBlock && node.location_init_ > ts - 512)
				node[layoutAxis] = Math.random()-0.5;

			if(this.layout_pos_ctx_)
				delete this.layout_post_ctx_;
		}

		if(node.data.parentBlockHashes) {
			let max = node.data[this.unit] * this.unitScale * this.unitDist;
			node.data.parentBlockHashes.forEach((hash) => {
				let parent = graph.nodes[hash];
				if(parent && parent[axis] && Math.abs(parent[axis]) > max)
					max = Math.abs(parent[axis]);
			});

			node[axis] = Math.round(max + this.unitDist*2)*sign;
		} else {
			node[axis] = Math.round(node.data[this.unit] * this.unitScale * this.unitDist * sign);
		}

	}

	reposition(x, skipUpdate) {
		if(!this.max)
			return;

		this.position = x * this.max;
		// console.log('position:',this.position,'x:',x,'max:',this.max);
		if(skipUpdate)
			return;

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

	onToggle(e, value) {

		switch(e) {
			case 'track': {
				if(this.lastBlockData && this.track) {
					let v = this.lastBlockData[this.unit] * this.unitDist;
					this.graph.translate(v,0);
				}
			} break;
			case 'mass': {
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateSize();
				});
				this.restart();
			} break;
			case 'chainBlocksDistinct': {
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle();
				});
			} break;
			case 'chainBlocksCenter': {
				this.restart();
			} break;
			case 'curves': {
				let curves = this.curves;
				this.graph.curves = curves;
				Object.values(this.graph.nodes).forEach((node) => {
					node.linkNodes && node.linkNodes.map(link=>{
						link.curves = curves;
						link.updateStyle()
					})
				});
			} break;

			case 'dir': {
				const {sign:lastSign} = this.direction;
				this.direction = this.directions[value];

				const t = this.graph.paintEl.transform;
				const {layoutAxis, axis, sign} = this.direction;
				
				t[axis] = t[layoutAxis] * sign * lastSign;
				t[layoutAxis] = 0;
				this.graph.setChartTransform(t);

				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle();
				})
				this.graph.restartSimulation();
			} break;

			case 'layout': {
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle(true);
				})

				this.restart();
			} break;

			case 'quality': {
				this.rangeScale = this.quality == 'high' ? 1.4 : 1;
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle();
				})

			} break;
		}
	}

	restart() {
		const ts = Date.now();
		Object.values(this.graph.nodes).forEach((node) => {
			node.location_init_ = ts;
			delete node.layout_ctx_;
		})
		this.graph.restartSimulation();
	}

	updateMax(max) {
		if(max == null)
			return
		this.max = max;
	}

	getIdx(node) {
		return Math.round(node.data[this.unit] * 10);
	}

	onSelectionUpdate(selection) {
		// console.log('selection:',selection);
		let length = Object.keys(selection).length;
		if(length == 1) {
			$('.needs-single-select').css({
				display:'block',
				opacity : 0.65
			});
		}
		else
		if(length > 1) {
			$('.needs-multi-select').css({
				display:'block',
				opacity : 0.65
			});
		} else {
			$('.needs-single-select').css({
				opacity : 0
			});
			$('.needs-multi-select').css({
				opacity : 0
			});
		}

		this.app.storeUndo();
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

		this.undo = true;
		// this.init();
	}

	initCtls() {
		this.ctls = [];
		
		new Toggle(this.ctx,'track','TRACKING', 'fal fa-parachute-box:Track incoming blocks');
		new Toggle(this.ctx,'curves','CURVES','fal fa-bezier-curve:Display connections as curves or straight lines');
		new Toggle(this.ctx,'mass','MASS','far fa-weight-hanging:Size of the block is derived from block mass (capped at 200)');
		// new MultiChoice(this.ctx,'chainBlocksDistinct',{
		// 	'border' : 'BORDER',
		// 	'green' : 'GREEN',
		// 	'none' : 'NO',
		// 	'yellow' : 'YELLOW',
		// 	'cyan' : 'CYAN'
		// },'CHAIN BLOCKS DISTINCT','fal fa-highlighter:Highlight chain blocks');
		new MultiChoice(this.ctx,'chainBlocksCenter',{
			'disable':'OFF',
			'force':"FORCE",
			'fixed' : "FIXED"
		},'CENTER','fa fa-compress-alt:Chain block position is biased toward center');

		new MultiChoice(this.ctx,'layout',{
			'determ' : 'DETERMINISTIC',
			'random' : 'RANDOM',
			'free' : 'FREE',
		},'LAYOUT', 'fal fa-bring-front:Block layout');

		new MultiChoice(this.ctx,'quality',{
			'high' : 'HIGH',
			'medium' : 'MEDIUM',
			'low' : 'LOW',
		},'QUALITY','fal fa-tachometer-alt-fast:Rendering quality / performance');

		new MultiChoice(this.ctx,'dir',['E','S','W','N'],'ORIENTATION','Orientation');
	}

	init() {
		this.initGraph();
		this.initNavigator();
		this.initIO();
		this.afterInit();
		this.addSmallScreenCls(document.body);
		this.initCtls();
		this.initPosition();

		let ts = Date.now();

		setInterval(()=>{
			this.graph.updateSimulation();
		}, 1000);

		$(window).on('keydown', (e) => {
			let {v, h, sign} = this.ctx.direction;
			//console.log('keydown:pos:',this.ctx.position);
			if( (v && ['ArrowRight', 'ArrowLeft'].includes(e.key)) ||
				(h && ['ArrowUp', 'ArrowDown'].includes(e.key)))
				return

			//console.log('key:', e.key);
			switch(e.key) {
				case 'ArrowRight':
				case 'ArrowDown':{
					this.ctx.position += 10 * sign;
					if(this.ctx.position < 0)
						this.ctx.position = 0;

					console.log('pos:',this.ctx.position);
					this.updatePosition();
				} break;

				case 'ArrowLeft':
				case 'ArrowUp': {
					this.ctx.position -= 10 * sign
					if(this.ctx.position < 0)
						this.ctx.position = 0;
					console.log('pos:',this.ctx.position);
					this.updatePosition();
				} break;
			}
		});


		// window.addEventListener('hashchange', () => {
		// 	console.log('hash changed!');
		// }, false);

		window.addEventListener('popstate', (e) => {
			console.log('popstate:',e.state);
			e.preventDefault();

			const { state } = e;
			if(state)
				this.restoreUndo(state);
		});

		$('#get-multi-select-link').on('click', (e) => {
			const selection = Object.values(this.graph.selection).map(node => parseInt(node.data.lseq).toString(16)).join(':');
			let el = document.getElementById('copy-url');
			const url = window.location.toString();
			el.innerText = url;
			$(el).show();
			window.app.selectText(el);
			document.execCommand('copy');
			$(el).hide();
			// console.log('copied...');	

			$.notify({
				//title : 'DAGViz',
				text : 'Link Copied to Clipboard!',
				className : 'yellow',
				autoHide : true,
				autoHideDelay : 1200
			});
		});

		$("#clear-selection").on('click', (e) => {
			Object.values(this.graph.nodes).forEach((node) => {
				node.select(false);
			})
		});

		$("#logo").on('click', () => {
			this.ctx.reposition(0);
		});

		if(!this.$info)
			this.$info = $("#top .info");
		
		this.generateTooltips();
	}

	generateTooltips(root) {
		$("[tooltip]", root).each((idx,el) => {
			let tooltip = el.getAttribute('tooltip');
			let $el = $(el);
			$el.on('mouseover', ()=>{
				this.displayTooltip(tooltip);
			}).on('mouseout', ()=>{
				this.clearTooltip();
			})
		})
	}

	displayTooltip(tooltip) {
		let icon = 'fa-question-circle';
		if(/^fa[\w\-\s]+:/.test(tooltip)) {
			let parts = tooltip.split(':');
			icon = parts.shift();
			tooltip = parts.join(':');
		}
		this.$info.html(`<span class='tooltip'><i class="fa ${icon}"></i> <span class='text'>${tooltip}</span></span>`);
	}

	clearTooltip(text) {
		this.$info.html('');
	}

	createBlocks(blocks) {
		const nodes = blocks.map((block) => {
			return this.createBlock(block);
		});
		return nodes;
	}

	async updatePosition() {
		this.fullFetch = true;
		const t = this.graph.paintEl.transform;
		const {axis, sign} = this.ctx.direction;
		t[axis] = - (this.ctx.position * t.k * this.ctx.unitDist) * sign;
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
			$.ajax('/data-slice'+query, 
			{
				dataType: 'json',
				// timeout: 500,     // timeout milliseconds
				success: (data,status,xhr) => {
					if(data.blocks && data.blocks.length)
						data.blocks.forEach(block => block.seq = block.id);
					// console.log(data);
					resolve(data);
				},
				error: (jqXhr, textStatus, errorMessage) => {
					console.log(textStatus,errorMessage,jqXhr);
					reject(errorMessage);
				}
			});
		})

	}

	createBlock(data){
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

		this.lastBlock = data;
		this.createBlock(data);
		this.graph.updateSimulation();
	}

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

		this.ctx.init(this, this.graph);
		this.graph.registerRegionUpdateSink(this.updateRegion.bind(this));
	}

	initIO() {
		this.io = io();

		this.io.on('blocks', (blocks) => {
			// console.log('blocks:', blocks);
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
	}

	initNavigator() {
		this.navigator = document.getElementById("timenav");
		this.navigator.app = this;
		//this.updateRegion({pos:0, range:2});
	}

	async initPosition() {

		let url = new URL(window.location.href);
		let params = Object.fromEntries(url.searchParams.entries());
		console.log("initializing with params:",params);
		//if(params.pos === 'undefined')
		const { ctx } = this;
		const defaults = {
			pos : ctx.position,
			k : ctx.initZoom, // 0.35,
			track : ctx.track,
			curves : ctx.curves,
			mass : ctx.mass,
			chainBlocksDistinct : ctx.chainBlocksDistinct,
			chainBlocksCenter : ctx.chainBlocksCenter,
			layout : ctx.layout,
			quality : ctx.quality,
			select : 'none'
		}
		params = Object.assign(defaults, params);
				
		this.initContext(params);
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
		if(this.suspend)
			return Promise.resolve();

		let { pos, range } = o;
		let left = false, right = false;
		let {sign} = this.ctx.direction;
		if(pos > this.ctx.position)
			left = true;
		else
			right = true;

		this.ctx.position = pos;
		range *= this.ctx.rangeScale;
		this.ctx.range = range;
		this.range_ = range;
		
		if(Math.round(this.last_range_*10) != Math.round(range*10)) {
			this.last_range_ = range;
			this.fullFetch = true;
		}
		
		const half_range = range / 2;
		let from = pos - half_range;
		let to = pos + half_range;

		//console.log("from, to", from, to)
		//if(this._done)
		//return

		this.navigator.redraw();
		this.storeUndo();
		const eraseMargin = this.ctx.quality == 'high' ? half_range : half_range/2;
		let max, min;
		Object.values(this.graph.nodes).forEach((node) => {
			if(node.selected)
				return;
			if(this.ctx && this.ctx.lastBlockData && node.data.blockHash == this.ctx.lastBlockData.blockHash)
				return;
			if(node.data[this.ctx.unit] < (from-eraseMargin) || node.data[this.ctx.unit] > (to+eraseMargin)) {
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
		this.graph.updateSimulation();
		//this._done = true;

		return Promise.resolve();
	}

	enableUndo(enable) {
		this.undo = !!enable;
	}

	restoreUndo(state) {
		this.initContext(state);
	}
	
	async initContext(state) {
		// pos, k, select, all ctls
		// console.log('initContext',JSON.stringify(state,null,'\t'));
		this.suspend = true;

		let updateTransform = false;
		if(state.pos) {
			const position = parseFloat(state.pos);
			if(this.ctx.position != position) {
				this.ctx.position = position;
				updateTransform = true;
			}
		}

		if(state.k) {
			const t = this.graph.paintEl.transform;
			let k_ = t.k;
			const k = parseFloat(state.k);
			if(!isNaN(k) && k && k != k_) {
				t.k = k;
				updateTransform = true;
				this.graph.setChartTransform(t);
			}
		}

		if(state.select) {
			try {
				if(state.select != 'none') {
					let args = state.select.split('x');
					let type = args.shift();
					if(type == 'lseq') {
						args = args.map(v=>parseInt(v,16)).filter(v=>!isNaN(v)&&v!==undefined&&v>=0).map(v=>v.toString(16));
						// console.log('args:',args);
						if(args.length) {
							let blocks = await this.fetchBlock('lseq/'+args.join('x'));
							//console.log('got blocks array:', blocks);
							let selection = { }
							// console.log('requesting:',blocks);
							let nodes = blocks.map((block) => {
								// if(this.graph.nodes[block.blockHash])
								// 	return null;
								let node = this.createBlock(block);
								// console.log('selecting',node.data.lseq)
								node.select(true);

								selection[node.data.blockHash] = node;
								return node;
							}).filter(v=>v);

							Object.values(this.graph.selection).forEach((node) => {
								if(!selection[node.data.blockHash])
									node.select(false);
							});
						}
					}
				}
				else {
					Object.values(this.graph.selection).forEach((node) => {
						node.select(false);
					});

				}
			} catch(ex) {
				console.log(ex);
			}
		}
		// else
		// 	state.select = null;

		let ctls = {};
		this.ctls.forEach((ctl)=>{
			const { ident } = ctl;
			if(state[ident] !== undefined)
				ctl.setValue(state[ident]);
				//ctlSet[ctl.ident] = ctl;
		});

		this.suspend = false;
		this.undo = false;
		if(updateTransform) {
			this.updatePosition();
		}
		
		this.undo = true;

	}

	async focusOnBlock(hash) {
		console.log('focusing:',hash);
		if(this.graph.nodes[hash])
			this.graph.setFocusTargetHash(hash);
		else {
			let blocks = await this.fetchBlock('blockHash/'+hash);
			let node = createBlock(blocks.shift());
			this.graph.setFocusTargetHash(hash);
		}
	}

	storeUndo() {
		// console.log('storeUndo');
		if(!this.undo || this.suspend)
			return;
		// console.log('storeUndo starting...');

		const state = { }
		this.ctls.map(ctl=>state[ctl.ident] = ctl.getValue(true));

		const pos = Math.round(this.ctx.position);
		const k = (this.graph.paintEl.transform.k).toFixed(4);
		if(Math.round(pos/3) == Math.round(this.last_stored_pos_/3) && k == this.last_sored_k_)
			return;
		this.last_stored_pos_ = pos;
		this.last_stored_k_ = k;
		state.pos = pos;
		state.k = k;

//		state.unit = this.ctx.unit;
//		state.seek = this.ctx.seek;

		const lseq = Object.values(this.graph.selection).map(node=>parseInt(node.data.lseq).toString(16));
		if(lseq.length)
			state.select = 'lseqx'+lseq.join('x');
		else
			state.select = 'none';

		// console.log(state);
		if(!this.last_undo_state_)
			this.last_undo_state_ = { };

		const selectChange = state.select != this.last_undo_state_.select;

		let keys = Object.keys(state);

		keys.forEach((key) => {
			if(state[key] == this.last_undo_state_[key])
				delete state[key];
		});

		if(!Object.keys(state).length)
			return;

		// if(!state.select)// && this.last_undo_state_.select != 'none')
		// 	state.select = this.last_undo_state_.select;

		if(selectChange) {
			if(this.last_undo_state_.pos !== undefined)
				state.pos = this.last_undo_state_.pos;
			if(this.last_undo_state_.k !== undefined)
				state.k = this.last_undo_state_.k;
		}

		let url = new URL(window.location);
		keys.forEach((key) => {
			if(state[key] !== undefined) {
				this.last_undo_state_[key] = state[key];
				// console.log('setting',key,'to:',state[key]);
				url.searchParams.set(key, state[key]);
			}
		});

		const ts = Date.now();
		history.pushState(state, "DAGViz", "?"+url.searchParams.toString());//+('#'+ts.toString(16)));
	}

	getRegion() {
		let transform = this.graph.paintEl.transform;
		const {sign, axis, size} = this.ctx.direction;
		let position = -(transform[axis] / transform.k / this.ctx.unitDist) * sign;
		const box = this.graph.graphHolder.getBoundingClientRect();
		let range = Math.ceil(box[size] / transform.k / this.ctx.unitDist) * this.ctx.rangeScale;
		let from = position - range / 2;
		let to = position + range / 2;
		return { position, range, from, to };
	}

	fetchBlock(hash) {
		return new Promise((resolve,reject) => {
			$.ajax('/block/'+hash, {
				dataType: 'json',
				// timeout: 500,     // timeout milliseconds
				success: (data,status,xhr) => {
					resolve(data);
				},
				error: (jqXhr, textStatus, errorMessage) => {
					console.log(textStatus,errorMessage,jqXhr);
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

class Toggle {
	constructor(target, ident, caption, tooltip) {
		window.app.ctls.push(this);
		this.type = 'toggle';
		this.target = target;
		this.ident = ident;
		this.caption = caption;
		if(tooltip)
			tooltip = `tooltip="${tooltip}"`;
		this.el = $(`<span id="${ident}" class='toggle' ${tooltip}></span>`);
		$("#top .ctl").append(this.el);

		// let url = new URL(window.location.href);
		// let params = url.searchParams;
		// let p = params.get(ident);
		// if(p==1 || p==0)
		// 	this.setValue(p==1)

		$(this.el).on('click', () => {
		 	let value = !(!!this.target[this.ident]);
			this.setValue(value);
			window.app.storeUndo();
		})
		this.update();
	}

	setValue(value){
		if(value === 'false' || value === '0')
			value = false;
		else if(value === 'true' || value === '1')
			value = true;

		this.target[this.ident] = value;
		if(this.target.onToggle)
			this.target.onToggle(this.ident, value);
		this.update();
	}

	getValue(storage) {
		let v = this.target[this.ident];
		return  storage ? (v ? 1 : 0) : v;
	}

	update() {
		this.el.html(`${this.caption}: ${this.target[this.ident] ? 'ON' : 'OFF' }`);
	}
}

class MultiChoice {
	constructor(target, ident, choices, caption, tooltip) {
		window.app.ctls.push(this);
		this.target = target;
		this.ident = ident;
		this.caption = caption;
		this.choices = Array.isArray(choices) ? Object.fromEntries(choices.map(v=>[v,v])) : choices;
		if(tooltip)
			tooltip = `tooltip="${tooltip}"`;
		this.el = $(`<span id="${ident}" class='toggle' ${tooltip||''}></span>`);
		$("#top .ctl").append(this.el);

		$(this.el).on('click', () => {
		 	const choices = Object.keys(this.choices);
			let value = this.target[this.ident];
			let idx = choices.indexOf(value);
			idx++;
			if(idx > choices.length-1)
				idx = 0;
			value = choices[idx];
			this.setValue(value);
			window.app.storeUndo();
		})
		this.update();
	}

	getValue() {
		return this.target[this.ident];
	}	

	setValue(value){
//console.log(value);
		const choices = Object.keys(this.choices);
		if(!choices.includes(value))
			value = choices[0];

		this.target[this.ident] = value;
		if(this.target.onToggle)
			this.target.onToggle(this.ident, value);
		this.update();
	}

	update() {
		this.el.html(`${this.caption}: ${this.choices[this.target[this.ident]] }`);
	}
}
