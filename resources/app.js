class App {
	constructor() {
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
	}
	fetchData(){

		
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


	}
}
