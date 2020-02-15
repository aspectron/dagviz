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
		data.name = data.id.replace(/^\s*0+/,'').substring(0,6);
		data.parent = data.acceptingBlockHash;
		data.size = data.mass/10;
		data.xMargin = 500 + ((Date.now()/1000 - data.timestamp))*50;
		data.timestmp = data.timestamp / 1000;

		super(holder,data);


		this.x = Math.random();//0;

		this.y = Math.random();//0;
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

		//dpc(1000,()=>{

			this.buildLink();
		//})
		this.initPosition()
	}

	register() {
		//this.updateStyle();
		//this.attachNode();
		//this.holder.nodes[this.data.id] = this;
	}

	purge() {

		if(this.link) {
			this.link.remove();
			delete this.link;
		}


		delete this.holder.nodes[this.data.id];
		// TODO - css animate opacity
		this.remove();
	}

}



export class App {
	constructor() {

		this.blocks = [];
		//this.rpc = new FabricRPC({origin:window.location.origin, path: "/ctl"});
		this.init();
	}

	init() {
		this.initGraph();
		this.afterInit();
		this.addSmallScreenCls(document.body);
		
		this.index = 0;
		this.items = BLOCKDAGCHAIN.map((o, i)=>{
			o.name = `N${++i}`;
			o.timestamp = Date.now()/1000 + i;
			return o;
		})
		this.items = this.items.slice(0,25);
		this.fetchData();
	}

	createBlock(data){
		let block = new Block(this.graph, data);

		this.graph.addNode(block);
		this.blocks.push(block);

		while(this.blocks.length > 50) {
			let discarded = this.blocks.shift();
			discarded.purge();
		}
	}


	onDagSelectedTip(data) {
		//block.name = block.blockHash.replace(/^0+/,'').substring(0,4);
		this.createBlock(data);
	}

	fetchData(){

		let item = this.items.shift();
		if(item)
			this.createBlock(item);

		this.graph.updateSimulation();

		setTimeout(()=>{
			this.fetchData();
		}, 1000)
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
