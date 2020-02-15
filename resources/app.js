import { GraphNode } from '../components/dag-viz';

export class Block extends GraphNode {
	constructor(holderEl,data) {

		data.id = data.blockHash;
		data.parent = data.acceptingBlockHash;
		data.size = data.mass/10;

		super(holderEl,data);
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
	}
	fetchData(){

		let item = this.items.shift();
		//this.graph.addNodeData(item);

		let block = new Block(this.graph, item);
		block.updateStyle();
		block.attach();

		this.blocks.push(block);

		while(this.blocks.length > 5) {
			let discarded = this.blocks.shift();
			discarded.remove();
		}


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
