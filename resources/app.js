class App {
	constructor() {
		//this.rpc = new FabricRPC({origin:window.location.origin, path: "/ctl"});
		this.init();
	}

	init() {
		this.initGraph();
		this.afterInit();
		this.addSmallScreenCls(document.body);
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
		this.graph.updateGraph([{
			id: "node1",
			type: '',
			name: "N1"
		},{
			id: "node2",
			type: '',
			name: "N2",
			peers:['node1']
		}])
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
