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

		/*
		$.ajax({
			url:'http://finland.aspectron.com:8082/blocks?limit=10',
			type:'json'
		}, (res)=>{
			console.log("res", res)
		})
		*/

		
		this.index++;
		if(this.items.length-1 < this.index)
			this.index = 0;
		let item = this.items[this.index];
		if(item)
			this.graph.addNodeData(item)

		setTimeout(()=>{
			this.fetchData();
		}, 5000)
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
