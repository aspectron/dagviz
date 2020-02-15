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
		data.parent = data.acceptingBlockHash;
		data.size = data.mass/10;

		super(holder,data);


		this.x = 0; // ((Date.now()/1000 - this.data.timestamp))*50;

		this.y = 0;

		// data.x = data.y = 0;
		// this.x = this.y = 0;


		let parent = holder.nodes[data.parent];
		let child = this;
		if(parent) {
			this.link = new GraphNodeLink(holder,{
				parent : parent.id, child : child.id
			})
		}

	}

	register() {
		this.updateStyle();
		this.attachNode();
		this.holder.nodes[this.data.id] = this;
	}

	purge() {

		if(this.link) {
			this.link.remove();
			delete this.link;
		}


		delete this.holderEl.nodes[this.data.id];
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
			o.timestamp = Date.now()/1000 + i
			return o;
		})
		this.fetchData();

// 		setTimeout(()=>{
// 			let i = 10;
// 			while(i--) {
// 				let item = this.items.shift();
// 				this.graph.addNodeData(item);
// //				item.x = 0; item.y = 0;
			
// //				this.graph.createNode(item).attachNode();//.updateStyle();
// 			}
// 		}, 1000);

		//this.updatePositions();

//		this.updateSimulation();

	}
	updatePositions() {
		if(!this.pending || !this.pending.length) {
			this.pending = Object.values(this.graph.nodes);
			// console.log(this.graph.nodes);
		}
		
		let node = this.pending.shift();
		if(node) {

			// node.x = -((Date.now()/1000 - node.data.timestamp))*100;
			node.updateStyle();			

			dpc(() => {
				this.updatePositions();
			})

		}
		else {
			dpc(1000, () => {
				this.updatePositions();
			})
		}
	}


	updateSimulation() {
		this.graph.updateSimulation();

		dpc(() => {
			this.updateSimulation();
		})
	}

	fetchData(){

		let item = this.items.shift();
		//this.graph.addNodeData(item);

		let block = new Block(this.graph, item);
		block.register();
		// block.updateStyle();
		// block.attachNode();

		this.graph.updateSimulation(block);

		this.blocks.push(block);

		while(this.blocks.length > 50) {
			let discarded = this.blocks.shift();
			discarded.remove();
		}

//		this.centerGraphBy(block.data.id);

/*
		let node = this.graph.createNode(item);
		node.updateStyle();
		node.attachNode();//.updateStyle();
*/
		if(this.items.length)
			setTimeout(()=>{
				this.fetchData();
			}, 1000)



		/*
		$.ajax({
			url:'http://kaspanet.aspectron.com:8085/blocks?limit=10',
			// url:'http://finland.aspectron.com:8082/blocks?limit=10',
			//type:'json'
			//method:'GET'
		}, (res)=>{
			console.log("res", res);


			setTimeout(()=>{
				this.fetchData();
			}, 5000)
	
		});
		*/

/*		
		this.index++;
		if(this.items.length-1 < this.index)
			this.index = 0;
		let item = this.items[this.index];
		if(item)
			this.graph.addNodeData(item)
*/
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

	// ---

	onDagSelectedTip(block) {
		block.name = block.blockHash.replace(/^0+/,'').substring(0,4);
		this.graph.addNodeData(block);

//		this.graph.createNode(block);


	}
}
