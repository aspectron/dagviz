import { GraphNode, GraphNodeLink } from './dag-viz.js';
import { KAPI, kLinkStyles, KPath} from '/components/k-explorer/k-explorer.js';

import { html, BaseElement, css } from './base-element.js';

class KApi extends KAPI{
	constructor(options={}){
		options = Object.assign(options, {
			origin: window.location.origin+"/api/"
		})
		super(options)
	}
}

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
			if(data.isChainBlock && ctx.chainBlocksDistinct){
				data.color = `rgba(194,255,204,0.99)`;
				//data.highlightColor = 'rgba(86,193,251,1)'
			}
			else{
				data.color = `rgba(194,244,255,0.99)`;
				//data.highlightColor = 'rgba(251,116,118,1)'
			}
		}
		super(holder,data);
		this.detsalt = data.detsalt;
		this.lvariance = 0;
		data.size = this.getSize(); 
		this.x = Math.random();
		this.y = Math.random();
		this.vx = 0;
		this.vy = 0;
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

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
/*console.log("isMobile: ", isMobile);*/

class GraphContext {
	constructor(app, options) {
		this.unit = options.unit; // timestamp
		this.app = app;

		this.linearScale = d3.scaleLinear()
		this.linearScale.domain([0, 100000]).range([0, 15000]);
		this.unitScale = 1.0;
		this.unitDist = 130;
		this.position = 10;
		this.offset = 0;
		this.updateOffset();
		this.min = 0;
		this.max = 0;
		this.mass = false;
		this.curves = true;
		this.initZoom = 0.5; // initial zoom
		this.rangeScale = 1.4;  // fog of war vs viewport window coefficient (default)
		this.chainBlocksDistinct = 'border';
		this.chainBlocksCenter = 'fixed';
		this.selectionMode = 'linking';
		this.track = true;
		this.shape = 'square';
		this.layout = 'determ';
		this.quality = 'high';
		this.spacingFactor = 1.5;
		this.arrows = 'multis';
		this.childShift = 1;
		this.lvariance = true;
		this['k-theme'] = 'light';
		this.highlightNewBlock = 3;//seconds
		this.advanced = false;
		//this.unit2Pos = {};

		this.dir = 'E';

		if(isMobile) {
			this.dir = 'N';
		}

		this.directions = {
			'E' : {
				h : true,
				size : 'width',
				sizePerp : 'height',
				axis : 'x',
				layoutAxis : 'y',
				sign : 1,
			},
			'S' : {
				v : true,
				size : 'height',
				sizePerp : 'width',
				axis : 'y',
				layoutAxis : 'x',
				sign : 1,
			},
			'W' : {
				h : true,
				size : 'width',
				sizePerp : 'height',
				axis : 'x',
				layoutAxis : 'y',
				sign : -1,
			},
			'N' : {
				v : true,
				size : 'height',
				sizePerp : 'width',
				axis : 'y',
				layoutAxis : 'x',
				sign : -1,
			}
		}

		this.direction = this.directions[this.dir];
		this.initMaxScoreEvents();
	}
	updateOffset(pos){
		pos = pos!==undefined? pos : this.position;
		this.offset = Math.ceil(this.linearScale(pos/this.unitDist) - pos * this.unitDist);
		//console.log("this.offset", this.offset)
		//if(Math.abs(offset - this.offset) > 10)
		//	this.offset = offset;
	}
	/*
	get position(){
		return this._position || 0;
	}
	set position(value){
		this._position = value;
		//this.offset = this.linearScale(value/this.unitDist) - value * this.unitDist;
		//console.log("this.offset", value, this.offset)
		/*
		if(value != 20 && value!==0){
			try{
				throw new Error("")
			}catch(e){
				console.log(e.stack)
			}
		}
		* /
	}
	*/

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
			let yy = Math.round(y1+(y2-y1)*0.5);
			return `M${x1},${y1} C${x1},${yy} ${x2},${yy} ${x2},${y2}`;
		}else{
			let xx = Math.round(x1+(x2-x1)*0.5);
			return `M${x1},${y1} C${xx},${y1} ${xx},${y2} ${x2},${y2}`;
		}
	}
	nodePosition(node, graph, nodes) {

		const { axis, sign, layoutAxis } = this.direction;
		const ts = Date.now();

		//node[layoutAxis] = Math.round(node[layoutAxis]);

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
						// case 'determ': {
						// 	node.layout_ctx_.pos = ((0 - clusterSize/2) + detPos) * this.unitDist * 1.5;
						// } break;
						case 'determ': {
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
			else
			if(Math.abs(node[layoutAxis]) < 50)
				node[layoutAxis] += node[layoutAxis] > 0 ? 3 : -3; //Math.random();

			// if(this.layout_pos_ctx_)
			// 	delete this.layout_post_ctx_;
		}

		// console.log('lvariance:',node.lvariance);
		let offset = this.lvariance ? node.lvariance * this.unitDist * 0.45 : 0;
		if(node.data.parentBlockHashes && this.childShift) {
			let max = node.data[this.unit] * this.unitScale * this.unitDist;
			node.data.parentBlockHashes.forEach((hash) => {
				let parent = graph.nodes[hash];
				if(parent && parent.xx && Math.abs(parent.xx) > max){
					max = Math.abs(parent.xx);
					//console.log("new max", max)
				}
			});

			node[axis] = (max + (this.unitDist * this.unitScale * this.spacingFactor))*sign+offset;
			//if(node.data.name == '8f74e9')
			//	console.log("aaaaaaaaa", this.offset, node[axis])
		} else {
			node[axis] = node.data[this.unit] * this.unitScale * this.unitDist * this.spacingFactor * sign + offset;
			//if(node.data.name == '8f74e9')
			//	console.log("xxxxxxxxxx", this.offset, node[axis])
		}
		node.xx = node[axis];
		//this.unit2Pos[node.data[this.unit]] = node.xx;
		node[axis] = Math.round(node[axis] + (sign * this.offset))
		//if(node.data.name == '8f74e9')
		//	console.log("node[axis]node[axis]node[axis]node[axis]", node[axis])
		node[layoutAxis] = Math.round(node[layoutAxis])
	}

	reposition(x, skipUpdate) {
		if(!this.max)
			return;

		this.position = x * this.max;
		this.updateOffset();
		//console.log('updateOffset:',this.position,'x:', x,'max:',this.max);
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
				//console.log("this.lastBlockData", this.lastBlockData)
				if(this.lastBlockData && this.track) {
					//let v = this.lastBlockData[this.unit] * this.unitDist;
					//this.graph.translate(v,0);
					this.graph.centerBy(this.lastBlockData.blockHash)
				}
			} break;
			case 'mass': {
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateSize();
				});
				this.restart();
			} break;
			case 'lvariance':
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
				this[this.dir+"_transformed"] = 0;
				//this.unit2Pos = {};
				this.updateViewportTransform(t, true);

			} break;

			case 'layout': {
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle(true);
				})

				this.restart();
			} break;

			case 'quality': {
				//this.rangeScale = this.quality == 'high' ? 1.4 : 1;
				this.updateRangeScale();
				Object.values(this.graph.nodes).forEach((node) => {
					node.updateStyle();
				})

			} break;
		}
	}

	updateRangeScale() {
		this.rangeScale = this.quality == 'high' || this.direction.v ? 1.4 : 1;
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
		//console.log("updateMax:"+max)
		if(max == null)
			return
		this.max = max;
		/*
		console.log("this.linearScale1111", this.linearScale(100000))
		this.linearScale.domain([0, max])
		console.log("this.linearScale2222", this.linearScale(100000))
		*/
		let ce = new CustomEvent("max-blue-score", {detail:{maxBlueScore:this.max}})
		document.body.dispatchEvent(ce);
	}

	initMaxScoreEvents(){
		document.body.addEventListener("get-max-blue-score", e=>{
			e.detail.maxBlueScore = this.max;
		});
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

	updateViewportTransform(t, force) {

		if(this[this.dir+"_transformed"]>1)
			return

		let max = 0;
		t = t || this.graph.paintEl.transform;
		const {v} = this.direction;
		const locationIdx = this.graph.locationIdx, unitDist = this.unitDist;
		const box = this.graph.getBoundingClientRect();
		let layoutSize = v?box.width:box.height;
		layoutSize *= 0.70;

		//console.log("this.graph.locationIdx", locationIdx, layoutSize)
		Object.values(locationIdx).forEach(list=>{
			max = Math.max(max, list.length * unitDist * 1.5);
		})

		if(max<1 || (!force && this._viewportMax == max))
			return;
		if(max>0){
			this._viewportMax = max;
			const k = layoutSize/max;
			//console.log("#### max #####", {max, layoutSize, k:t.k, newK:k})
			//if(k < t.k){
				//t.k = k;
			//}
			this[this.dir+"_transformed"]++;
		}
		this.graph.setChartTransform(t);

		Object.values(this.graph.nodes).forEach((node) => {
			node.updateStyle();
		})
		
		this.updateRangeScale();
		this.graph.restartSimulation();
	}

	disableTracking() {
		if(this.track) {
			this.app.ctls.track.setValue(false);


			$.notify({
				//title : 'DAGViz',
				text : 'Tracking Disabled',
				className : 'red',
				autoHide : true,
				autoHideDelay : 750
			});

		}
	}
}

export class App {
	constructor() {
		this.scores = [];
		this.ctx = new GraphContext(this, { unit : 'blueScore' });
		//this.rpc = new FabricRPC({origin:window.location.origin, path: "/ctl"});
		this.argv = new URLSearchParams(location.search);
		this.connect = this.argv.get('connect') !== null;

		this.last_range_ = 1;
		this.last_position_ = -1;

		this.undo = true;
		// this.init();
		this.lastBlockWidget = document.getElementsByTagName("last-block-widget")[0];
	}

	initCtls() {
		this.ctls = { };
		
		new Toggle(this.ctx,'track','TRACKING', 'fal fa-parachute-box:Track incoming blocks', {
			update : (v) => {
				if(v)
					$("#tracking,body").addClass('tracking-enabled');
				else
					$("#tracking,body").removeClass('tracking-enabled');
			}
		});
		new Toggle(this.ctx,'curves','CURVES','fal fa-bezier-curve:Display connections as curves or straight lines',{advanced:false});
		new Toggle(this.ctx,'mass','MASS','far fa-weight-hanging:Size of the block is derived from block mass (capped at 200)',{advanced:false});
		new Toggle(this.ctx,'lvariance','L-VARIANCE','far fa-question:Local variance: blocks are shifted by their relative timestamp within their local blue score domain',{advanced:true});
		// new MultiChoice(this.ctx,'chainBlocksDistinct',{
		// 	'border' : 'BORDER',
		// 	'green' : 'GREEN',
		// 	'none' : 'NO',
		// 	'yellow' : 'YELLOW',
		// 	'cyan' : 'CYAN'
		// },'CHAIN BLOCKS DISTINCT','fal fa-highlighter:Highlight chain blocks');
		new MultiChoice(this.ctx,'chainBlocksCenter', {
			'disable':'OFF',
			'force':"FORCE",
			'fixed' : "FIXED"
		},'CENTER','fa fa-compress-alt:Chain block position is biased toward center', {advanced:true});

		new MultiChoice(this.ctx,'layout', {
			'determ' : 'DETERMINISTIC',
			// 'random' : 'RANDOM',
			'free' : 'FREE',
		},'LAYOUT', 'fal fa-bring-front:Block layout', {advanced:true});

		new MultiChoice(this.ctx,'quality', {
			'high' : 'HIGH',
			'medium' : 'MEDIUM',
			'low' : 'LOW',
		},'QUALITY','fal fa-tachometer-alt-fast:Rendering quality / performance',{advanced:false});

		new MultiChoice(this.ctx,'dir', {
			E:'LANDSCAPE',
			S:'PORTRAIT',
			W:'LANDSCAPE',
			N:'PORTRAIT'
		},'ORIENTATION','Orientation', {
			advanced : false,
			limit : ['E','N'],
			update : (text, v) => {
				const $orientationImg = $('#orientation > img, body');
				$orientationImg.removeClass('orient-N orient-E orient-S orient-W');
				$orientationImg.addClass(`orient-${v}`);
				let vertical = false;
				if(v=='N' || v=='S'){
					$orientationImg.addClass('orient-v');
					vertical = true;
				}else{
					$orientationImg.removeClass('orient-v');
				}
				this.graph.updateSVGSize();
				this.navigator.vertical = vertical;
			}
		});

		new MultiChoice(this.ctx,'spacingFactor',[1,1.5,2.0,2.5,3.0],'SPACING','Spacing Factor', {
			update : (v) => {
				this.graph.restartSimulation();
			}
		});

		new Toggle(this.ctx,'childShift','CHILD SHIFT','Child Shift');

		new MultiChoice(this.ctx, 'arrows', {
			'off' : 'OFF',
			'single' : 'SINGLE',
			'multis' : 'MULTI-S',
			'multir': 'MULTI-R'
		},'ARROWS','fal fa-location-arrow:Display Arrows', {
			update : (v) => {
				//d3.select('node-text').attr("stroke-width", 0.5);
				let {arrows} = this.ctx;
				this.ctx._arrows = arrows.indexOf("multi")>-1? "multi": arrows;
				if(arrows =="multis"){
					this.graph.setArrowsOrient(null)
				}else if(arrows=="multir"){
					this.graph.setArrowsOrient("auto")
				}
				Object.values(this.graph.nodes).forEach(node => {
					node.rebuildLinks();
					node.updateStyle();
				});
			}
		});

		new MultiChoice(this.ctx, 'k-theme',{
			'dark':'DARK',
			'light':"LIGHT",
		}, 'THEME','fa fa-palette:UI Theme', {
			update:(v)=>{
				if(this.kExplorer){
					this.kExplorer.setSettings({theme: v.toLowerCase()}, true);
					this.navigator.redraw();
				}
			}
		});

		new MultiChoice(this.ctx, 'highlightNewBlock',{
			15:'15 sec',
			10:'10 sec',
			5:'5 sec',
			3:'3 sec',
			0:'OFF'
		}, 'HIGHLIGHT NEW','fa fa-palette:Highlight new blocks', {
			update:(text, v)=>{
				this.updateNewBlockTimer(+v)
			}
		});


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

		let metrics = document.getElementById('metrics');
		let searchEl = document.getElementById('search');
		const $searchBtn = $('.search-btn');
		const $search = $(searchEl);
		$search.on('keyup', (e) => {
			console.log(e);
			const v = $search.val();
			metrics.innerHTML = v;

			let left = searchEl.offsetLeft;
			let width = Math.max(200,metrics.clientWidth+40);
			let max = window.innerWidth - left - 128;
			width = Math.min(width,max);
			console.log(width);
			$search.css('width',width+'px');
			$searchBtn.css('opacity',v?0.9:0);
			//console.log(v);

			if(e.key == 'Enter') {
				$search.val('');
				$search.css('width','320px');
				$searchBtn.css('opacity',0);
				this.search(v);
			}

		});

		$('#search-execute').on('click', () => {
			const v = $search.val();
			$search.val('');
			if(v)
				this.search(v);
			$searchBtn.css('opacity',0);
		});

		$('#search-clear').on('click', () => {
			$search.val('');
			$searchBtn.css('opacity',0);
		});

		const $orientationImg = $('#orientation > img');
		$orientationImg.addClass(`orient-${this.ctx.dir}`);
		$orientationImg.click((e) => {
			this.ctls.dir.toggle({
				disableLimit : (e.ctrlKey || e.shiftKey)				
			});
		});

		const $trackingImg = $('#tracking');
		// $trackingImg.addClass(`orient-${this.ctx.dir}`);
		$trackingImg.click((e) => {
			this.ctls.track.toggle();
		});

		const $explorerImg = $('#explorer');
		$explorerImg.click((e) => {
			if(this.kExplorerWin && this.kExplorerWin.classList.contains("active")){
				this.kExplorerWin.close();
				this.storeUndo();
				return
			}
			this.openExplorer("blocks");
		})

		$(window).on('keydown', (e) => {
			if(e.key == 'Escape') {
				let els = document.querySelectorAll('block-info');
				[...els].forEach(el => {
					if($('#info-panel',el.renderRoot).hasClass('advanced'))
						el.close();
				});

				this.kExplorerWin.close();
				
				//console.log(els);
				//$('block-info').
			}
		});

		if(!this.$info)
			this.$info = $("#info");
		
		this.generateTooltips();

		// this.isDevicePortrait = window.innerWidth < window.innerHeight;
		// console.log(`${this.isDevicePortrait?'portrait':'landscape'} device detected`)
		// window.addEventListener("orientationchange", () => {
		// 	// Announce the new orientation number
		// 	// alert(window.orientation);
		// 	console.log("WINDOW ORIENTATION VALUE: ",window.orientation);
		// 	let isPortrait = (window.orientation == 0 || window.orientation == 180) ? this.isDevicePortrait : !this.isDevicePortrait;
		// 	console.log(isPortrait);
		// 	console.log("this.isPortrait", this.isPortrait);
		// 	if(isPortrait !== this.isPortrait) {

		// 		this.ctls.dir.setValue(isPortrait ? 'N' : 'E');
		// 		// this.ctls.dir.toggle({
		// 		// 	disableLimit : (e.ctrlKey || e.shiftKey)				
		// 		// });
		// 	}

		// 	this.isPortrait = isPortrait;
		// }, false);		
		if (isMobile){
			window.addEventListener("orientationchange", () => {
				// Announce the new orientation number
				// alert(window.orientation);
				console.log("WINDOW ORIENTATION VALUE: ",window.orientation);
				if(window.orientation == 0 || window.orientation == 180)
					this.ctls.dir.setValue('N');
				else if (window.orientation == 90 || window.orientation == 270 || window.orientation == -90)
					this.ctls.dir.setValue('E');
				
			
			}, false);		
		}
	}

	search(v_) {

		let v = v_+'';

		if(/^\d+$/.test(v)) {
			v = parseInt(v);
			if(!isNaN(v) && v >= 0 && v < this.ctx.max) {
				this.ctx.position = v;
				this.updatePosition();
			} else {
				this.userErrorNotify(`Invalid value ${v_}`);
			}

		} else {

			this.fetchSearch(v).then((result) => {
				console.log(result);
				if(result && result.blocks && result.blocks.length)
					this.createAndSelectBlocks(result.blocks);
			}, (error) => {
				// console.log('error:', error);

				this.userErrorNotify(error);
			});
		}
	}

	userErrorNotify(text) {
		$.notify({
			//title : 'DAGViz',
			text,
			class : 'error',
			autoHide : true,
			autoHideDelay : 1000
		});

	}

	createAndSelectBlocks(blocks, clear) {

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

		if(clear) {
			Object.values(this.graph.selection).forEach((node) => {
				if(!selection[node.data.blockHash])
					node.select(false);
			});
		}

		let first = Object.values(this.graph.selection).shift();
		if(first)
			this.graph.setFocusTargetHash(first.data.blockHash);
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
		this.$info.html(`<span class='tooltip'><i class="fal ${icon}"></i> <span class='text'>${tooltip}</span></span>`);
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
		//console.log('updatePosition');
		this.graph.style.opacity = 0;
		this.fullFetch = true;
		const t = this.graph.paintEl.transform;
		const {axis, sign} = this.ctx.direction;
		//let pos = Math.ceil(this.ctx.position);
		//console.log("t[axis]t[axis]t[axis]", this.ctx.position+"->"+pos, sign, this.ctx.unit2Pos[pos])
		//if(this.ctx.unit2Pos[pos]){
		//	t[axis] = - (this.ctx.unit2Pos[pos] * t.k);// * sign;
		//}else{
		//	this.ctxApproxPos = pos;
			t[axis] = - (this.ctx.position * t.k * this.ctx.unitDist) * sign;
		//}
		
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

			if(isNaN(args.from) || isNaN(args.to))
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
		this._updateRegion = _.debounce(this.updateRegion.bind(this), 50)
		this.graph.registerRegionUpdateSink(this._updateRegion);
		
		this.region = this.getRegion();
	}

	initIO() {
		this.io = io();

		this.newBlocks = {};



		this.io.on('dag/blocks', (blocks) => {
			this.verbose && console.log('blocks:', blocks);
			// this.ctx.lastBlockData = blocks[blocks.length-1];
			// this.ctx.lastBlockDataTS = Date.now();
			
			if(this.ctx.highlightNewBlock>0){
				let cTS = Date.now();
				blocks.forEach(b=>{
					b.cTS = cTS;
					b.isNew = 1;
					this.newBlocks[b.blockHash] = {cTS};
				})
			}

			this.lastBlockWidget.updateBlocks(blocks);
			let ce = new CustomEvent("k-last-blocks", {detail:{blocks}})
			window.dispatchEvent(ce)

			if(!this.ctx.track && this.region) {
				// let region = this.getRegion();
				blocks = blocks.filter((block) => {
					block.origin = 'tip-update';
					if(block[this.ctx.unit] < (this.region.from-this.range_) || block[this.ctx.unit] > (this.region.to+this.range_))
						return false;
					return true;
				});
			}
	
			if(blocks.length) {

				blocks.forEach(block=>block.isChainBlock = false);

				this.createBlocks(blocks);
				this.graph.updateSimulation();
				let oldLastBlock = this.ctx.lastBlockData;
				let newLastBlock = blocks[blocks.length-1];
				if(!oldLastBlock || oldLastBlock.blueScore<=newLastBlock.blueScore){
					this.ctx.lastBlockData = newLastBlock;
					this.ctx.lastBlockDataTS = Date.now();
					this.verbose && console.log("dag/blocks: newLastBlock", newLastBlock.blueScore, newLastBlock)
				}

				if(newLastBlock.blueScore > this.ctx.max)
					this.ctx.updateMax(newLastBlock.blueScore)

			}

			if(this.ctx.track) {
				dpc(()=>{
					this.regionCleanup();
				})
			}

		});

		// this.io.on('last-block-data', (data) => {
		// 	// console.log('last block:', data);
		// 	let v = data[this.ctx.unit];
		// 	if(v)
		// 		this.ctx.updateMax(v);
		// });

		this.io.on('dag/selected-tip', (data) => {
			return;

			this.verbose && console.log('dag/selected-tip:', data);

			this.ctx.lastBlockData = data;
			this.ctx.lastBlockDataTS = Date.now();

			let v = data[this.ctx.unit];
			if(v)
				this.ctx.updateMax(v);

			this.createBlocks([data]);
			this.graph.updateSimulation();
		});

		this.io.on('dag/selected-parent-chain', (args) => {
			this.verbose && console.log('dag/selected-parent-chain', args);

			const { addedChainBlocks, removedBlockHashes } = args;
			const { nodes } = this.graph;
			const updateMap = { };

			removedBlockHashes.forEach((hash) => {
				const node = nodes[hash]
				if(node) {
					node.data.isChainBlock = false;
					node.data.acceptingBlockHash = null;
					updateMap[node.data.blockHash] = node;
				}
			});

			addedChainBlocks && addedChainBlocks.length && addedChainBlocks.forEach((instr) => {
				const { hash, acceptedBlockHashes } = instr;
				const ref = nodes[hash];
				if(ref) {
					ref.data.isChainBlock = true;
					updateMap[ref.data.blockHash] = ref;
				}
				acceptedBlockHashes.forEach((target) => {
					const node = nodes[target];
					if(node) {
						node.data.acceptingBlockHash = hash;
						updateMap[node.data.blockHash] = node;
					}
				});
			});

			Object.values(updateMap).forEach((node) => {
				node.updateStyle();
				node.rebuildLinks();
			});

		});

	}

	initNavigator() {
		this.navigator = document.getElementById("timenav");
		this.navigator.app = this;
		//this.updateRegion({pos:0, range:2});
	}

	async initPosition() {

		let url = new URL(window.location.href);
		let expParams = KPath.parse(url);
		//console.log("expParams", expParams)
		let params = Object.fromEntries(url.searchParams.entries());
		//console.log("initializing with params:",params);
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
			select : 'none',
			theme: ctx['k-theme'],
			highlightNewBlock: ctx.highlightNewBlock,
			expParams
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
		//pos = Math.round(pos);
		let forward = false, reverse = false;
		let {sign, axis} = this.ctx.direction;
		if(pos > this.ctx.position)
			forward = true;
		else
			reverse = true;

		this.ctx.position = pos;
		//console.log("updateRegion:this.ctx.position", this.ctx.position)
		range *= this.ctx.rangeScale;
		this.ctx.range = range;
		this.range_ = range;
		
		if(o.fullFetch)
			this.fullFetch = true;
		else
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
		let max=0, min = -1;

		if(!o.noCleanup && !this.fullFetch)
		Object.values(this.graph.nodes).forEach((node) => {
			if(node.selected)
				return;
			if(this.ctx && this.ctx.lastBlockData && node.data.blockHash == this.ctx.lastBlockData.blockHash)
				return;
			if(!o.noCleanup && (node.data[this.ctx.unit] < (from-eraseMargin) || node.data[this.ctx.unit] > (to+eraseMargin))) {
				node.purge();
			} else {
				if(min<0 || min > node.data[this.ctx.unit])
					min = node.data[this.ctx.unit];
				if(max < node.data[this.ctx.unit])
					max = node.data[this.ctx.unit];

			}
		})
		else{
			Object.values(this.graph.nodes).forEach(node=>{
				//if((node.data[this.ctx.unit] < (from-eraseMargin) || node.data[this.ctx.unit] > (to+eraseMargin))) {
					
					node.updateStyle();
					//if(node.data.name == '8f74e9')
					//	console.log("#######   node.updateStyle", node.data.name, node[axis])
				//}
			})
		}

		if(!this.fullFetch) {
			if(forward && min > 0) {
				from = min;
			} else if(reverse && max) {
				to = max;
			}
			this.ctx[this.ctx.dir+"_transformed"] = 10;
		}
		else
			this.fullFetch = false;
		

		// console.log("max, min", this.fullFetch, {forward, reverse, max, min, from, to})
		let { blocks, max : max_ } = await this.fetch({ from : Math.floor(from), to : Math.ceil(to) });
		this.ctx.updateMax(max_);

		this.region = this.getRegion();
		//console.log("xxxxx",this.ctx.position, region.position, range, region.range);
		//console.log("region.from, region.to", region.from-half_range, region.to+half_range)
		//let l1 = blocks.length;
		if(!o.noCleanup) {
			blocks = blocks.filter((block) => {
				if(block[this.ctx.unit] < (this.region.from-half_range) || block[this.ctx.unit] > (this.region.to+half_range))
					return false;
				return true;
			});
		}

		//console.log("blocks", blocks.length, l1, blocks)
		// console.log('tracking:', this.ctx.position,'blocks:',blocks);
		this.createBlocks(blocks);
		this.graph.updateSimulation();
		this.ctx.updateViewportTransform()
		/*if(this.ctxApproxPos && this.ctx.unit2Pos[this.ctxApproxPos]){
			let pos = this.ctxApproxPos;
			this.ctxApproxPos = null;

			setTimeout(()=>{
				this.updatePosition();
			}, 100);
		}else{*/
			this.graph.style.opacity = 1;
		/*}*/

		/***** just for track issue testing *****/
		//this.ctx.lastBlockData = blocks[blocks.length-1];
		/**************************************************/

		this.lastBlockWidget.updateRegion(this.region);

		return Promise.resolve();
	}

	enableUndo(enable) {
		this.undo = !!enable;
	}

	restoreUndo(state) {
		this.initContext(state);
	}

	highlightNewBlockTimer(ts){
		ts = ts || Date.now() - this.ctx.highlightNewBlock;
		let {nodes} = this.graph;
		Object.entries(this.newBlocks).forEach(([blockHash, o])=>{
			if(o.cTS >= ts)
				return
			if(nodes[blockHash]){
				nodes[blockHash].data.isNew = false;
				nodes[blockHash].updateStyle();
			}
			delete this.newBlocks[blockHash];
		})
	}

	updateNewBlockTimer(highlightNewBlock, time=0){
		if(highlightNewBlock){
			if(this.highlightNewBlockTimerId)
				clearInterval(this.highlightNewBlockTimerId);

			this.highlightNewBlockTimerId = setInterval(()=>{
				this.highlightNewBlockTimer();
			}, (time || highlightNewBlock) * 1000)
			return
		}

		if(this.highlightNewBlockTimerId){
			this.highlightNewBlockTimer(Date.now() + 100000)
			clearInterval(this.highlightNewBlockTimerId);
		}

	}
	
	async initContext(state) {
		// pos, k, select, all ctls
		// console.log('initContext',JSON.stringify(state,null,'\t'));
		this.suspend = true;

		let updateTransform = false;
		if(state.pos) {
			let position = parseFloat(state.pos);
			if(this.ctx.position != position) {
				// if(position > this.ctx.max)
				// 	position = this.ctx.max;
				// if(position < this.ctx.min)
				// 	position = this.ctx.min;
				this.ctx.position = position;
				// console.log("init position:",this.ctx.position);
				updateTransform = true;
				this.ctx.updateOffset();
			}
		}
		this.updateNewBlockTimer(+state.highlightNewBlock);

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

		//let ctls = {};
		Object.values(this.ctls).forEach((ctl)=>{
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
		let expParams = state.expParams || {};
		this.initExplorer(expParams);
	}

	openExplorer(pathname="blocks", params={}){
		let paths = pathname.split("/");
		let method = paths.shift();
		this.initExplorer({method, paths, params})
	}

	initExplorer(expParams){
		let {method, paths, params} = expParams;
		paths = paths || [];
		if(!this.kExplorer){
			this.kExplorer = document.querySelector("#kExplorer");
			this.kExplorer.hideSettings = true;
			this.kExplorerWin = document.querySelector("#explorerWin");
			this.kExplorerWin.close = ()=>{
				document.body.classList.toggle("explorer-active", false);
				if(this.kExplorerWin.classList.contains("active")){
					this.kExplorerWin.classList.remove("active");
					this.storeUndo()
				}
			}
			this.kExplorer.setApi(new KApi());
			let $body = $(document.body);
			$body.on("click", ".win .backdrop", (e, el)=>{
				let $win = $(e.target).parent();
				$win.removeClass("active");
				if($win.find("k-explorer").length){
					this.storeUndo();
				}
			});

			window.addEventListener("k-explorer-close", ()=>{
				this.kExplorerWin.close();
			})

			window.addEventListener("k-explorer-state-changed", e=>{
				let {block} = e.detail || {};
				//console.log("k-explorer-state-changed", e.detail);
				if(block){
					//this.setPosition(block.blueScore)
					this.ctx.position = block[this.ctx.unit];
					this.updatePosition();
				}
				this.storeUndo();
			})
			window.addEventListener("k-settings", e=>{
				let {theme} = this.kExplorer.settings;
				let ctl = this.ctls['k-theme'];
				if(!ctl)
					return
				let v = ctl.getValue();
				v = v? v.toLowerCase():'';
				if(v != theme){
					ctl && this.ctls['k-theme'].setValue(theme);
					this.navigator.redraw();
				}
			})

			if(method == "block" && paths.length && paths[0].length > 32){
				setTimeout(()=>{
					this.fetchSearch(paths[0]).then((result) => {
						//console.log(result);
						if(result && result.blocks && result.blocks.length){
							let [block] = result.blocks;
							this.ctx.position = block[this.ctx.unit];
							let node = this.createBlock(block);
							// console.log('selecting',node.data.lseq)
							node.select(true);
							this.graph.setFocusTargetHash(block.blockHash)
							//this.updatePosition();
							//this.createAndSelectBlocks(result.blocks);
						}
					}, (error) => {
						// console.log('error:', error);

						//this.userErrorNotify(error);
					});
				}, 1000)
			}
		}
		if(!method)
			return
		this.kExplorerWin.classList.add("active");
		document.body.classList.toggle("explorer-active", true);
		if(this.kExplorer.callApi)
			this.kExplorer.callApi([method, ...paths], params);
		
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

	deepClone(obj){
		if(_.isArray(obj)){
			return _.map(obj, (e)=>{
				return this.deepClone(e);
			})
		}

		if(_.isObject(obj)){
			var r = {};
			_.each(obj, (e, k)=>{
				r[k] = this.deepClone(e);
			})
			return r;
		}
		return obj;
	}

	storeUndo() {
		// console.log('storeUndo');
		if(!this.undo || this.suspend)
			return;
		if(!this.last_undo_state_)
			this.last_undo_state_ = { };
		//console.log('storeUndo starting...');

		const state = { }
		Object.values(this.ctls).forEach(ctl=>state[ctl.ident] = ctl.getValue(true));
		const expParams = $(this.kExplorerWin).hasClass('active')?this.deepClone(this.kExplorer.buildUrlState()):{};
		//console.log("storeUndo:expParams", expParams, expParams.params)
		const lastExpParams = this.last_undo_state_.expParams;
		const expParamsChanged = JSON.stringify(expParams) != JSON.stringify(lastExpParams);

		const pos = Math.round(this.ctx.position);
		const k = (this.graph.paintEl.transform.k).toFixed(4);
		if(!expParamsChanged && Math.round(pos/3) == Math.round(this.last_stored_pos_/3) && k == this.last_sored_k_)
			return;
		this.last_stored_pos_ = pos;
		this.last_stored_k_ = k;
		state.pos = pos;
		state.k = k;

		//state.unit = this.ctx.unit;
		//state.seek = this.ctx.seek;

		const lseq = Object.values(this.graph.selection).map(node=>parseInt(node.data.lseq).toString(16));
		if(lseq.length)
			state.select = 'lseqx'+lseq.join('x');
		else
			state.select = 'none';

		const selectChange = state.select != this.last_undo_state_.select;

		let keys = Object.keys(state);

		keys.forEach((key) => {
			if(state[key] == this.last_undo_state_[key])
				delete state[key];
		});

		if(!Object.keys(state).length && !expParamsChanged)
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

		this.last_undo_state_.expParams = expParams;
		state.expParams = expParams;

		url = KPath.buildUrl(expParams, url)
		//console.log("url", url, url.pathname+url.search)
		history.pushState(state, "DAGViz", url.pathname+url.search);
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
			$.ajax('/get-block/'+hash, {
				dataType: 'json',
				// timeout: 500,     // timeout milliseconds
				success: (data,status,xhr) => {
					resolve(data);
				},
				error: (jqXhr, textStatus, errorMessage) => {
					console.log(textStatus,errorMessage,jqXhr);
					if(jqXhr.responseJSON && jqXhr.responseJSON.error)
						reject(jqXhr.responseJSON.error);
					else
						reject(errorMessage);
				}
			});
		});
	}

	fetchSearch(v) {
		return new Promise((resolve,reject) => {
			$.ajax('/search?q='+(v+'').trim(), {
				dataType: 'json',
				// timeout: 500,     // timeout milliseconds
				success: (data,status,xhr) => {
					resolve(data);
				},
				error: (jqXhr, textStatus, errorMessage) => {
					console.log(textStatus,errorMessage,jqXhr);
					if(jqXhr.responseJSON && jqXhr.responseJSON.error)
						reject(jqXhr.responseJSON.error);
					else
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

		} else {
			console.warn("Could not select text in node: Unsupported browser.");
		}
	}
	
	regionCleanup() {
		const { from, to, range } = this.getRegion();
		//const { region : { from, to, range } } = this.getRegion();

		Object.values(this.graph.nodes).forEach((node) => {
			if(node.selected)
				return;
			if(this.ctx && this.ctx.lastBlockData && node.data.blockHash == this.ctx.lastBlockData.blockHash)
				return;
			if(node.data[this.ctx.unit] < (from-range) || node.data[this.ctx.unit] > (to+range))
				node.purge();
		})

	}
}

class Toggle {
	constructor(target, ident, caption, tooltip, options) {
		window.app.ctls[ident] = this;
		this.type = 'toggle';
		this.target = target;
		this.ident = ident;
		this.caption = caption;
		this.options = options;
		if(tooltip)
			tooltip = `tooltip="${tooltip}"`;
		this.el = $(`<span id="${ident}" class='toggle' ${tooltip}></span>`);
		$("menu-panel .items").append(this.el);

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

	toggle() {
		this.setValue(!this.getValue());
	}

	update() {
		const value = this.target[this.ident];
		this.el.html(`<span class="caption">${this.caption}:</span><span class="value">${value ? 'ON' : 'OFF' }</span>`);
		if(this.options && this.options.update)
			this.options.update(value);
	}
}

class MultiChoice {
	constructor(target, ident, choices, caption, tooltip, options) {
		window.app.ctls[ident] = this;
		this.target = target;
		this.ident = ident;
		this.caption = caption;
		this.options = options;
		this.choices = Array.isArray(choices) ? Object.fromEntries(choices.map(v=>[v,v])) : choices;
		this.limit = options && options.limit ? (Array.isArray(options.limit) ? Object.fromEntries(options.limit.map(v=>[v,v])) : options.limit) : null;
		if(tooltip)
			tooltip = `tooltip="${tooltip}"`;
		//const hidden = isMobile&&options.isMobile===false?"hidden":"";
		
		this.el = $(`<span id="${ident}" class='toggle' ${tooltip||''}></span>`);
		$("menu-panel .items").append(this.el);

		$(this.el).on('click', (e) => {
			this.toggle({
				disableLimit : (e.ctrlKey || e.shiftKey)
			});
		});
		this.update();
	}

	toggle(opts_) {
		const opts = opts_ || { };
		const choices = this.limit && !opts.disableLimit ? Object.keys(this.limit) : Object.keys(this.choices);
		let value = this.target[this.ident];
		let idx = choices.indexOf(value);
		idx++;
		if(idx > choices.length-1)
			idx = 0;
		value = choices[idx];
		this.setValue(value);
		window.app.storeUndo();
	}

	getValue() {
		return this.target[this.ident];
	}	

	setValue(value){
		const choices = Object.keys(this.choices);
		if(this.choices[value] === undefined)
			value = choices[0];

		this.target[this.ident] = value;
		if(this.target.onToggle)
			this.target.onToggle(this.ident, value);
		this.update();
	}

	update() {
		const value = this.choices[this.target[this.ident]];
		this.el.html(`<span class="caption">${this.caption}:</span><span class="value">${ value }</span>`);
		if(this.options && this.options.update)
			this.options.update(value, this.target[this.ident]);
	}
}

class LastBlockWidget extends BaseElement{

	static get properties() {
		return {
			height: { type:String },
		};
	}
	static get styles(){
		return css `
			:host{
				position: absolute;
				font-family: "Cousine";
				font-size: 16px;
				z-index:4;
				display:block;
				min-width: 160px;
				top: 128px;
				right: 32px;
				transition: opacity 750ms;
				opacity: 0;
				background-color: rgba(0, 150, 136, 1);
				border: 1px solid var(--last-block-widget-border-color, #ccc);
				border-radius: 10px;
				text-align: center;
				color: white;
				transform: translate3d(0,0,0);
				perspective: 1000px;				
				cursor: pointer;
			}
			:host(.visible) { opacity: 1 }
			div[wrapper]{
				padding:6px;
				display: flex;
				flex-direction: column;
			}
			
			@keyframes wiggle {
				0% { transform: rotate(0deg); }
			   80% { transform: rotate(0deg); }
			   85% { transform: rotate(5deg); }
			   95% { transform: rotate(-5deg); }
			  100% { transform: rotate(0deg); }
			}
			@keyframes shake {
				10%, 90% { transform: translate3d(-1px, 0, 0); }
				20%, 80% { transform: translate3d(2px, 0, 0); }
				30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
				40%, 60% { transform: translate3d(4px, 0, 0); }
			}
			:host(.wiggle) {
				animation: wiggle 2.5s ;
			}
			:host(.shake) {
				/*animation: shake 2.5s ;*/
				animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
			}

			.arrow {
				width: 36px;
				height: auto;
				margin: 2px;
				opacity: 0.8;
			}

			.subtitle {
				font-size: 10.4px;
				opacity: 0.8;

			}

			/* mobile portrait */
			@media(max-width:425px){
				:host{
					font-size: 10px;
					min-width: 120px;
					top: 64px;
					left: 24px;
					right:unset !important;
				}
			}
			/* mobile landscape */
			@media(max-height:425px){ 	
				:host{
					font-size: 10px;
					min-width: 120px;
					top:24px;
					right: 64px;
				}
			}
			
			
		`;
	}

	constructor() {
		super();
		
		this.blocks = 0;
		this.active = false;
	}

	render(){

		return html`<div wrapper @click=${this.click}>
				<div>
					${this.blocks} new block${this.blocks!=1?'s':''}
				</div>
				<div>
					<img class='arrow' src="/resources/images/arrow-right-white.png" />
					<!--

					// TODO @surinder

					<fa-icon icon="/resources/images/k-subtract.svg" color="red" size="48"></fa-icon>
					<fa-icon icon="/resources/images/arrow-right.svg#arrow-right" color="red" size="48"></fa-icon>
					<fa-icon icon="fal:arrow-right" size="24" color="red"></fa-icon>
					-->
				</div>
				<div class='subtitle'>CLICK TO TRACK</div>
			</div>`;
	}

	updateBlocks(blocks) {
		let length = blocks.length;

		this.blueScore = blocks[0].blueScore;

		if(this.region === undefined)
			return;

		let pos = -app.ctx.graph.paintEl.transform.x / app.ctx.graph.paintEl.transform.k / app.ctx.unitDist * app.ctx.direction.sign;
		let from = pos - this.region.range * 0.5;
		let to = pos + this.region.range * 0.5;
		//console.log(pos,from,to);
		if(from < this.blueScore && this.blueScore < to ) {
			this.halt();
		} else {
			this.post(length);
		}

		//console.log("last-block-widget::updateBlocks",blocks,this);
	}

	click() {
		//console.log('click called');
		//app.ctx.reposition(1.0);
		app.ctls.track.setValue(true);
		this.halt();
		// dpc(750, () => {
		// })
		// app.position = this.blueScore(); //ctx.reposition(1.0);
		// app.updatePosition();
		//this.graph.setFocusTargetHash(first.data.blockHash);

	}

	updateRegion(region) {
		this.region = region;
		//console.log("last-block-widget::updateRegion",region);
		this.update();
	}

	halt() {
		if(this.active) {
			this.blocks = 0;
			this.active = false;
			this.classList.remove('visible');
		}
	}

	post(length) {
		if(!this.active)
			this.classList.add('visible');
		
		this.classList.remove('shake');
		dpc(300, () => {
			this.classList.add('shake');
		})

		this.active = true;
		this.blocks += length;
		this.update();
	}
}

LastBlockWidget.register();