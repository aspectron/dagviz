import { GraphNode, GraphNodeLink } from './dag-viz';



const dpc = (t,fn)=>{
	if(typeof(t) == 'function'){
		setTimeout(t, fn);
	}else{
		setTimeout(fn,t);
	}
}



const tsInit = Date.now();


export class Block extends GraphNode {
	constructor(holder,data) {

		data.id = data.blockHash;
		data.name = data.id.replace(/^\s*0+/,'').substring(0,6);//+'\n\n'+(data.blueScore||'####');
		data.parent = data.acceptingBlockHash;
		data.size = data.mass/20*Math.exp(data.mass/20/10);
		data.xMargin = /*500 +*/ ((Date.now()/1000 - data.timestamp))*50;
		data.timestmp = data.timestamp / 1000;
		data.shape = 'square';
		data.color = `rgba(194,244,255,0.99)`;
		super(holder,data);


		this.x = Math.random();
		this.y = Math.random();
		this.el
			.transition('cc')
			.duration(1000)
			.tween("attr.fill", function() {
				var i = d3.interpolateNumber(data.xMargin, 0);
				return function(t) {
					data.xMargin = i(t)
					//console.log('ssss', i(t));
				};
			});

		this.buildLink();
		this.initPosition()
	}

}



export class App {
	constructor() {
		//this.rpc = new FabricRPC({origin:window.location.origin, path: "/ctl"});
		this.argv = new URLSearchParams(location.search);

		this.connect = this.argv.get('connect') !== null;
		this.init();
	}

	init() {
		this.initGraph();
		this.afterInit();
		this.addSmallScreenCls(document.body);
		
		new Trigger(this.graph,'track','TRACKING');
		new Trigger(this,'connect','LINK SEQUENTIAL');

		let ts = Date.now();
		let _BLOCKDAGCHAIN = BLOCKDAGCHAIN.reverse();
		let first = _BLOCKDAGCHAIN[0];
		let delta = ts/1000 - first.timestamp;

		this.index = 0;
		this.items = _BLOCKDAGCHAIN.map((o, i)=>{
			o.name = `N${++i}`;
			o.timestamp += delta; // Date.now()/1000 + i;
			return o;
		})
		//this.items = this.items.slice(0,25);
		if(/simulate/.test(location.search))
		 	this.simulateData();

		setInterval(()=>{
			this.graph.updateSimulation();
		}, 1000);
	}

	createBlock(data){
		let block = new Block(this.graph, data);
		this.graph.addNode(block);
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

	simulateData(){

		let wait = 1000;
		let item = this.items.shift();
		if(item) {

			if(this.prevItem_) {
				let tdelta = item.timestamp - this.prevItem_.timestamp;
				if(tdelta)
					wait = tdelta * 1000;
			}
//console.log('wait:',wait);

		}

		
		setTimeout(()=>{
			
			if(item) {
				this.createBlock(item);
				this.prevItem_ = item;
				
			}
			
			this.graph.updateSimulation();

			this.simulateData();
		}, wait)
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
		this.graph.tdist = parseInt(this.argv.get('tdist') || 0) || this.graph.tdist;

		this.graph.track = this.argv.get('track') !== null;
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
		this.graph.centerBy(nodeId)
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
			this.update();
		})

		this.update();
	}

	update() {
		this.el.html(`${this.caption}: ${this.target[this.ident] ? 'ON' : 'OFF' }`);
	}
}