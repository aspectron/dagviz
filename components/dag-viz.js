// Import BaseElement base class and html helper function
import { html, BaseElement, css, render } from './base-element';
import './node-panel.js';

const D3x = { }

D3x.types = {
    "kaspad" : { rgba : [255,170,0,1] },
    "mysql" : { id : 2, rgba : [243,243,0,1] },
    "pgsql" : { rgba : [221,170,136,0.75] },
    "apiserver" : { rgba : [221,170,204,1] },
    "txgen" : { rgba : [17,221,187,1] },
    "mqtt" : { rgba : [187,209,36,1] },
    "simulator" : { rgba : [226,204,216,1] },
    "unknown" : { rgba : [184,163,136,1] },
    "tbd2" : { rgba : [1,255,255,1] },
    "tbd3" : { rgba : [136,170,255,1] }
}


D3x.rgba = function(rgba, alphaOverride) {
    if(typeof(rgba) == 'undefined')
        throw new Error("Supplying undefined RGBA object");

    if(typeof(rgba) == 'string')
        return rgba;

    if(_.isArray(rgba))
        return 'rgba('+Math.round(rgba[0])+','+Math.round(rgba[1])+','+Math.round(rgba[2])+','+(alphaOverride || rgba[3])+')';

    return 'rgba('+Math.round(rgba.r)+','+Math.round(rgba.g)+','+Math.round(rgba.b)+','+(alphaOverride || rgba.a)+')';
}

D3x.randomRGBA = function() {
    return [Math.random() * 127 + 127,Math.random() * 127 + 127,Math.random() * 127 + 127, 1]
}

D3x.shape = { }

D3x.shape.hexagonA = function(el, o) {
    // o.r o.xPos o.o.yPosos
    if(!o.size)
    	o.size = 50;

    //o.originX = o.originY = 0;

    var h = (Math.sqrt(3)/2);
    var data = (originX, originY)=>{
    	return [
	        { "x": o.size+originX,      "y": originY}, 
	        { "x": o.size/2+originX,    "y": o.size*h+originY},
	        { "x": -o.size/2+originX,   "y": o.size*h+originY},
	        { "x": -o.size+originX,     "y": originY},
	        { "x": -o.size/2+originX,   "y": -o.size*h+originY},
	        { "x": o.size/2+originX,    "y": -o.size*h+originY}
	    ];
	}

    var hexagon = d3.line(d3.curveLinearClosed)
        .x(d=>d.x)
        .y(d=>d.y)

    var node = el.append('svg:g')
		//.attr("transform", function(o) { return "rotate(30)"; })

    //if(o.opacity)
    //    node.attr('opacity', o.opacity);

    var path = node.append("path")
        .attr("d", hexagon(data(0, 0)))
        .attr("stroke", D3x.rgba(o.rgba, 0.9))
        // .attr("stroke-dasharray","20,5")
        
        .attr("fill", D3x.rgba(o.rgba)) //"rgba(255,0,0,0.4)");
        //.attr("stroke-width", 1);

    node.setPosition = (x, y)=>{
    	path.attr("d", hexagon(data(x, y)))
    	return node;
    }
    node.setFill = (fn)=>{
    	path.attr("fill", fn())
    }
    node.getBoundingClientRect = ()=>{
    	return path.node().getBoundingClientRect();
    }

    return node;
}

D3x.shape.hexagonB = function(el, o) {
    // o.r o.xPos o.o.yPosos

    //o.originX = o.originY = 0;
    if(!o.size)
    	o.size = 50;

    var h = (Math.sqrt(3)/2);
    var data = (originX, originY)=>{
		return [
	        { "x": originX+o.size*h,    "y": originY - o.size*0.5}, 
	        { "x": originX,    			"y": originY - o.size},
	        { "x": originX-o.size*h,    "y": originY - o.size*0.5},
	        { "x": originX-o.size*h,    "y": originY + o.size*0.5},
	        { "x": originX,   			"y": originY + o.size},
	        { "x": originX+o.size*h,    "y": originY + o.size*0.5}
	    ];
	}


    var hexagon = d3.line().curve(d3.curveLinearClosed)
        .x(d=>d.x)
        .y(d=>d.y)
        

    var node = el.append('svg:g')
    	.attr("class", "hexagon-b")
        //.attr("transform", function(o) { return "rotate(30)"; })


    //if(o.opacity)
    //    node.attr('opacity', o.opacity);

    var path = node.append("path")
        .attr("d", hexagon(data(0, 0)))
        .attr("stroke", D3x.rgba(o.rgba, 0.9))
        // .attr("stroke-dasharray","20,5")
        
        .attr("fill", o.rgba)// D3x.rgba(o.rgba)) //"rgba(255,0,0,0.4)");
        //.attr("stroke-width", 1);

    node.setPosition = (x, y)=>{
    	path.attr("d", hexagon(data(x, y)))
    	return node;
    }
    node.setFill = (fn)=>{
    	path.attr("fill", fn())
    }
    node.getBoundingClientRect = ()=>{
    	return path.node().getBoundingClientRect();
    }

    return node;
}

D3x.shape.triangle = function(el, o) {
    if(!o.size)
    	o.size = 100;

	//    var h = (Math.sqrt(3)/2);
	const size = o.size;// * 1.25;
	const offsetY = -2;
    var data = (originX, originY)=>{
		return [
	        { "x": originX,    "y": originY - size + offsetY}, 
	        { "x": originX+size*1.1,  "y": originY + size + offsetY},
	        { "x": originX-size*1.1,    "y": originY + size + offsetY}
	    ];
	}


    var hexagon = d3.line().curve(d3.curveLinearClosed)
        .x(d=>d.x)
        .y(d=>d.y)
        

    var node = el.append('svg:g')
    	.attr("class", "triangle")
        //.attr("transform", function(o) { return "rotate(30)"; })


    //if(o.opacity)
    //    node.attr('opacity', o.opacity);

    var path = node.append("path")
        .attr("d", hexagon(data(0, 0)))
        .attr("stroke", D3x.rgba(o.rgba, 0.9))
        // .attr("stroke-dasharray","20,5")
        
        .attr("fill", o.rgba)// D3x.rgba(o.rgba)) //"rgba(255,0,0,0.4)");
        //.attr("stroke-width", 1);

    node.setPosition = (x, y)=>{
    	path.attr("d", hexagon(data(x, y)))
    	return node;
    }
    node.setFill = (fn)=>{
    	path.attr("fill", fn())
    }
    node.getBoundingClientRect = ()=>{
    	return path.node().getBoundingClientRect();
    }

    return node;
}



D3x.shape.circle = function(el, o) {
    var node = el.append('svg:circle')
        .attr('r', 0)//Math.random() * 25 + 25)
        .attr('opacity',0.5)
        .attr('fill', D3x.rgba(o.rgba))
        .attr("stroke", D3x.rgba([0,0,0], 0.5))
        //.attr("stroke-width", 1)

    node
        //.transition("c")
        //.ease('in-out')	// d3x
        //.duration(1000)
        .attr("r", o.size)

    node.setPosition = (x, y)=>{
    	node
    		//.transition('o')
			//.duration(2000)
    		.attr("cx", x)
    		.attr("cy", y)
    	return node;
    }
    node.setStaticPosition = (x, y)=>{
    	node
    		.attr("cx", x)
    		.attr("cy", y)
    	return node;
    }
    node.setFill = (fn)=>{
    	node.attr("fill", fn())
    }

    return node;
}

D3x.shape.square = function(el, o) {

    var size = o.size;
    var node = el.append('svg:rect')
        //.attr('', 0)//Math.random() * 25 + 25)
        .attr('x',-size)
        .attr('y',-size)
        .attr('width', size*2)
        .attr('height', 0)// size*2)
        .attr('opacity',0.65)
        .attr('fill', o.rgba)//D3x.rgba(o.rgba))
        .attr("stroke", D3x.rgba([0,0,0], 0.5))
        //.attr("stroke-width", 1)

    node
        .transition("c")
        //.ease('in-out') // d3x
        .duration(1000)
        .attr("height", size * 2)

    node.setPosition = (x, y)=>{
    	node
    		.attr("x", x-size)
    		.attr("y", y-size)
    	return node;
    }
    node.setFill = (fn)=>{
    	node.attr("fill", fn())
    }

    return node;
}

D3x.shape.diamond = function(el, o) {
    if(!o.size)
    	o.size = 50;

    var h = (Math.sqrt(3)/2);
    var data = (originX, originY)=>{
		return [
	        { "x": originX+o.size*5/6,    	"y": originY}, 
	        { "x": originX,    			"y": originY - o.size},
	        { "x": originX-o.size*5/6,      "y": originY},
	        { "x": originX,     		"y": originY+o.size}
	    ];
	}


    var hexagon = d3.line().curve(d3.curveLinearClosed)
        .x(d=>d.x)
        .y(d=>d.y)
        

    var node = el.append('svg:g')
    	.attr("class", "hexagon-b")
        //.attr("transform", function(o) { return "rotate(30)"; })


    //if(o.opacity)
    //    node.attr('opacity', o.opacity);

    var path = node.append("path")
        .attr("d", hexagon(data(0, 0)))
        .attr("stroke", D3x.rgba(o.rgba, 0.9))
        .attr('opacity',0.75)
        // .attr("stroke-dasharray","20,5")
        
        .attr("fill", o.rgba)// D3x.rgba(o.rgba)) //"rgba(255,0,0,0.4)");
        //.attr("stroke-width", 1);

    node.setPosition = (x, y)=>{
    	path.attr("d", hexagon(data(x, y)))
    	return node;
    }
    node.setFill = (fn)=>{
    	path.attr("fill", fn())
    }
    node.getBoundingClientRect = ()=>{
    	return path.node().getBoundingClientRect();
    }

    return node;
}

D3x.createShape = function(el, type, data) {

    if(!D3x.shape[type])
        type = 'circle';
    return D3x.shape[type](el, data);
}


export class GraphNodeLink{
	constructor(holder, data){
		this.holder = holder;
		this.data = data;
		this.el = holder.linksEl.append("line");
		this.source = holder.nodes[data.child];
		this.target = holder.nodes[data.parent];
		this.target.addChildLink(this);
		this.target.attachNode();
	}
	remove(){
		this.el.remove();
		this.target.removeChildLink(this);
	}
	updateStyle(){
		if(!this.source){
			//console.log("this.source", this.data.child)
			return
		}
		this.el
			//.transition('o')
			//.duration(2000)
			.attr("x1", this.source.x)
			.attr("y1", this.source.y)
			.attr("x2", this.target.x)
			.attr("y2", this.target.y);
	}
	setStaticPosition(x, y, x2, y2){
		if(typeof(x2) == 'undefined' && typeof(y2) == 'undefined'){
			if(!this.target)
				return
			x2 = this.target.x;
			y2 = this.target.y;
		}
		this.el
			.attr("x1", x)
			.attr("y1", y)
			.attr("x2", x2)
			.attr("y2", y2);
	}
}

export class GraphNode{
	constructor(holder, data){
		this.holder = holder;
		this.data 	= data;
		this.id 	= data.id || data.name;
		holder.nodes[this.id] = this;
		this.childLinks = {};
		this.attachNode();
	}
	setData(data){
		this.data = data;
		this.buildLink();
		this.textEl.text(this.data.name);
		this.updateStyle();
	}

	getShapeConfig() {
		const map = {
		    "kaspad" : { shape : 'circle', rgba : [255,170,0,1] },
		    "mysql" : { shape : 'square', rgba : [243,243,0,1] },
		    "pgsql" : { shape : 'square', rgba : [221,170,136,0.75] },
		    "server" : { shape : 'hexagonA', rgba : [221,170,204,1] },
		    "syncd" : { shape : 'hexagonA', rgba : [136,170,255,1] },
		    "txgen" : { shape : 'hexagonB', rgba : [17,221,187,1] },
		    "mqtt" : { shape : 'square', rgba : [187,209,36,1] },
		    "simulator" : { shape : 'hexagonB', rgba : [226,204,216,1] },
		    "unknown" : { shape : 'circle', rgba : [184,163,136,1] },
		    "tbd2" : { shape : 'circle', rgba : [1,255,255,1] },
		    "tbd3" : { shape : 'circle', rgba : [136,170,255,1] }
		};

		let c = map[this.data.type] || map['unknown'];

		let shape = this.data.shape || c.shape;
		let color = this.data.color || c.rgba;

		return { shape, color };
	}

	bindElEvents(){
		this.el.on("click", this.onNodeClick.bind(this))
		this.el.on("mouseover", this.onNodeHover.bind(this))
		this.el.on("mouseout", this.onNodeOut.bind(this))
	}
	removeElEvents(){
		if(this.el)
			this.el.on(".", null)
	}

	attachNode(){
		if(this.el){
			if(this.el.node().parentNode)
				return
			this.holder.nodesEl.append(()=>{
				return this.el.node()
			});
			this.holder.nodesEl.append(()=>{
				return this.textEl.node()
			});
			return this.bindElEvents();
		}

		const CUSTOM_SHAPES = true;

		if(CUSTOM_SHAPES) {

			let shapeConfig = this.getShapeConfig();
			// console.log("shapeConfig",this.data.type,shapeConfig);

			//this.el = this.holder.nodesEl.append("circle");
			//this.el = this.holder.nodesEl.append("g");

	        this.el = D3x.createShape(this.holder.nodesEl, shapeConfig.shape, {
	            size : this.data.size,
	            rgba : shapeConfig.color,//shapeConfig.rgba,
	            opacity : 0.5
	        });

	        //this.el.transform = d3.zoomIdentity.translate(0, 0).scale(0.5);


			this.textEl = this.holder.nodesEl.append("text")
				.attr("fill", "#000")
				.attr("class", ["node-name",this.data.type].join(' '))
				.text(this.data.name);


	    } else {


			this.el = this.holder.nodesEl.append("circle");

			this.textEl = this.holder.nodesEl.append("text")
				.attr("fill", "#000")
				.attr("class", ["node-name",this.data.type].join(' '))
				.text(this.data.name);
	    }

		this.bindElEvents();
		
		return this;

	}
	buildLink(){
		let {data, holder} = this;
		//console.log("data", data, holder.nodes[data.parent])
		if(!data.parent){
			this.removeLink();
		}else if(holder.nodes[data.parent]){
			this.createLink(data.parent)
		}
		//if(data.parent)
		//	console.log("data.parent", data.parent, this.linkNode)
		return this.linkNode;
	}
	createLink(parent){
		if(this.linkNode)
			return
		this.linkNode = new GraphNodeLink(this.holder, {child:this.id, parent})
	}
	removeLink(){
		if(this.linkNode){
			this.linkNode.remove();
			delete this.linkNode;
		}
	}
	remove(){
		this.removeElEvents();
		this.el.remove();
		this.textEl.remove();
		this.removeLink();

		_.each(this.childLinks, (link, child)=>{
			link.remove();
			delete this.childLinks[child];
		})
	}
	initPosition(){
		let {x, y} = this;
		this.el.setStaticPosition(x, y);
		if(this.textEl){
			this.textEl
				.attr("x", x)
				.attr("y", y-0.5)
		}
		if(this.linkNode)
			this.linkNode
				.setStaticPosition(x, y)
	}
	updateStyle(){
		if(isNaN(this.x) || isNaN(this.y) || !this.data.timestamp) {
			console.log("aborting updateStyle (lack of data) for:",this);
			return
		}

		//console.log("this.x", this.x, this.y)

		let host = null//app.identToHost(this.data.host);
		//console.log("GraphNode: host", this.data.name,  host)

		const typeColors = {
			'kaspad' : "#b3ffc1",
			'simulator' : "#feffb3",
			'txgen' : "#fbb3ff",
			'server' : "#b3fffc",
			'syncd' : "#b3ffb3"
		}

		let shapeConfig = this.getShapeConfig();

		if(this.data.shape != this.shape || this.data.color != this.color) {
			this.removeElEvents();
			// console.log("DATA CHANGE",this);
			this.el.remove();
	        this.el = D3x.createShape(this.holder.nodesEl, shapeConfig.shape, {
	            size : this.data.size,
	            rgba : shapeConfig.color,//shapeConfig.rgba,
	            opacity : 0.5
	        })

	        this.shape = this.data.shape;
	        this.color = this.data.color;

	        this.textEl.remove();
			this.textEl = this.holder.nodesEl.append("text")
				.attr("fill", "#000")
				.attr("class", ["node-name",this.data.type].join(' '))
				//.attr("class", )
				.text(this.data.name);

			this.bindElEvents();

	    }

		//console.log("EL:", Date.now()/1000, this.data.timestamp)

		let x = this.data.xMargin-((Date.now()/1000 - this.data.timestamp))*50;//*Math.random()*100;
		this.x = x;
		this.el
			.setPosition(this.x, this.y)
			.setFill(()=>{
				if(this.data.color) {
					return this.data.color;
				} else {
					return host && host.online ? "#b3e2ff" : "#ffb3b3";
				}
			})
		let textBox = this.textEl.node().getBoundingClientRect();
		let {width, height} = textBox;
		let zoom = this.holder.paintEl.transform.k
		width = width/zoom;
		height = height/zoom;
		//console.log("this.textEl", this.textEl)
		this.textEl
			//.transition('o')
			//.duration(2000)
			.attr("x", this.x-width/2)
			.attr("y", (this.y+height/3)-0.5)
        	.attr("opacity", 1)

		if(this.linkNode)
			this.linkNode.updateStyle();
	}
	addChildLink(childLink){
		this.childLinks[childLink.data.child] = childLink;
	}
	removeChildLink(childLink){
		delete this.childLinks[childLink.data.child];
	}
	onNodeClick(e) {
		if (d3.event.defaultPrevented)
			return
		this.holder.onNodeClick(this, d3.event);
	}
	onNodeHover(){
		this.holder.showNodeInfo(this.data, this);
	}
	onNodeOut(){
		this.holder.hideNodeInfo(this.data, this);
		/*
		let box = this.el.node().getBoundingClientRect();
		let {x, y} = d3.event;
		if(x<box.left || x>box.right || y<box.top || y>box.bottom){
			//console.log("d3.event.target", d3.event, box)
			this.holder.hideNodeInfo(this.data, this);
			return
		}
		let r = box.width /2
		let cx = box.left + r;
		let cy = box.top + r;
		let X = x>cx? x-cx : cx-x;
		let Y = y>cy? y-cy : cy-y;
		if(Math.sqrt(X*X + Y*Y) > r)
			this.holder.hideNodeInfo(this.data, this);

		//console.log("rrrr", r, Math.sqrt(X*X + Y*Y) < r)
		*/
	}
	getBoundingClientRect(){
		if(this.el.getBoundingClientRect)
			return this.el.getBoundingClientRect();
		return this.el.node().getBoundingClientRect();
	}
	purge(){
		delete this.holder.nodes[this.data.id];
		// TODO - css animate opacity
		this.remove();
	}
}

export class DAGViz extends BaseElement {
	static get is(){
		return 'dag-viz';
	}
	static get properties() {
		return {
			data: { type: Array },
			extra: {type: String },
			_nodeName:{type:String, value:""}
		};
	}

	static get styles(){
		return css `
			:host {
				min-height:100px;
				min-width:100px;
				display:flex;
				flex-direction:column;
				box-sizing:border-box;
				position:relative;
			}
			:host([hidden]) { display: none;}
			#graph{flex:1;height:100%;}
			
			.node-name{font-size:4px;pointer-events: none;}
			.observer{font-size:1px;pointer-events: none;}

			.diamond-box{transform-orizn:center center;}
			#nodeInfo{
				pointer-events: none;
				border-radius:5px;
				border:1px solid rgba(0,0,0,.12);
				display:none;position:absolute;
				background-color:#FFF;
				box-shadow: 0 1px 1.5px 0 rgba(0,0,0,.12), 0 1px 1px 0 rgba(0,0,0,.24);
				z-index:10;
				transition:left 0.1s ease,top 0.1s ease;
				left:0px;
				top:0px;
			}
			#nodeInfo.active{
				display:inline-block;
			}
			#nodeInfo .content{
				padding:10px;
			}
			#nodeInfo .title{
				padding:5px;
				border-bottom:1px solid #DDD;
			}

			/*
			#graph svg .tip-line{
				transition:all 0.2s ease;
			}
			*/

		`;
	}
	constructor() {
		// Must call superconstructor first.
		super();

		this.tipTS = Date.now();

		//
	}
	render() {
		return html`
		<div id="graph"></div>
		<div id="nodeInfo"></div>
		`;
	}
	firstUpdated() {
		this.graphHolder = this.renderRoot.getElementById('graph');
		this.nodeInfoEl = this.renderRoot.getElementById('nodeInfo')
		this._updateNodeInfoPosition = this.updateNodeInfoPosition.bind(this);
		this.nodeInfoEl.addEventListener('node-panel-resize', (e)=>{
			this.debounce("node-panel-resize", this._updateNodeInfoPosition, 100)
		})
		this.nodeInfoEl.addEventListener('node-panel-close', (e)=>{
			this.hideNodeInfo(true)
		});
		this.nodeInfoEl.addEventListener('node-panel-pin-to', (e)=>{
			this.pinNodeInfoTo(e.detail.pinTo)
		});
		this.nodeInfoEl.addEventListener('transitionstart', (e)=>{
			this.nodeInfoEl.style.pointerEvents = 'none';
			//console.log("transitionstart")
		});
		this.nodeInfoEl.addEventListener('transitionend', (e)=>{
			this.debounce("nodeInfoEl-ts", ()=>{
				this.nodeInfoEl.style.pointerEvents = 'inherit';
			}, 100)
		});
		
		this.graphHolder.addEventListener('click', ()=>{
			this.hideNodeInfo(true)
		})
		this.initChart();
	}
	updated(changedProperties) {
		changedProperties.forEach((oldValue, propName) => {
			//console.log(`${propName} changed. oldValue: ${oldValue}`);
			if(propName == "data")
				this.updateGraph(this.data);
		});
	}

	initChart(){
		this.nodes = {};
		this.svg = d3.select(this.graphHolder).append("svg");
		var zoom = d3.zoom()
    		.on('zoom', ()=>{
    			this.setChartTransform(d3.event.transform)
    			let w = Math.max(0.01, 1/this.paintEl.transform.k)
    			this.nodesEl.attr("stroke-width", w);
    			this.linksEl.attr("stroke-width", w)
    		})
    	this.svg.call(zoom);
    	this.paintEl = this.svg.append("g")
    	this.paintEl.transform = d3.zoomIdentity.translate(0, 0).scale(1);

		this.updateSVGSize();
		this.linksEl = this.paintEl.append("g")
			.attr("class", "link")
			.attr("stroke", "#999")
			.attr("stroke-width", 1)
			.attr("stroke-opacity", 0.6)
		this.svgLink = this.linksEl.selectAll("line")
		this.nodesEl = this.paintEl.append("g")
			.attr("fill", "#fff")
			.attr("stroke", "#000")
			.attr("stroke-width", 1)
		this.svgNode = this.nodesEl.selectAll("circle")
		this.simulation = d3.forceSimulation();
		//let firstNode = new GraphNode(this, {x:1000, y:0 });
		this.simulationNodes = []
		this.simulation.nodes(this.simulationNodes)
		this.simulationNodes = this.simulation.nodes();


		this.simulationLinkForce = d3.forceLink([]).id(d=>d.id).distance(10).strength(1)
		this.simulationLinks = this.simulationLinkForce.links();

		//console.log("this.simulationNodes", this.simulationNodes)

		this.simulation
			.force("link", this.simulationLinkForce)
			.force('collision', d3.forceCollide().radius(function(d) {
				//console.log("d.size", d)
			 	return d.data.size * 2;// * 2//d.radius
			}))
			.force("charge", d3.forceManyBody().strength(150))
			.force("x", d3.forceX())
			.force("y", d3.forceY())


		this.simulation.on("tick", () => {
			//console.log('tick');
			let nodes = this.simulationNodes;
			//console.log("nodes", nodes.length)
			for(let i=0, l=nodes.length; i<l; ++i){
				nodes[i].updateStyle();
			}
		});

		//this.simulation.restart();
		/*this.tipLine = this.svg.append('line')
            .attr('class','tipline')
            .attr('stroke', 'rgba(0,0,0,0.5)')
            .attr('stroke-width', 1)
            .attr('fill', 'none');*/
        

        // this.svg.append('svg:defs').append('svg:marker')
        // 	.attr('id', 'tipArrow')
        // 	.attr('orient', 'auto')
        // 	.attr('markerWidth', '10')
        // 	.attr('markerHeight', '10')
        // 	.attr('refX', '1')
        // 	.attr('refY', '3')
        // 	.append('svg:path')
        // 		.attr('d', 'M0,0 V6 L3,3 Z')
        // 		.attr('fill', 'rgba(0,0,0,0.5)')
       this.tipLine2 = this.svg.append('path')
        	.attr('stroke', 'rgba(0,0,0,0.5)')
            .attr('stroke-width', 1)
            .attr('class', 'tip-line')
            .attr('marker-end', 'url(#tipArrow)')
            //.attr('d', 'M100 100 L 10 10')

		window.addEventListener("resize", this.updateSVGSize.bind(this))
		this.fire("ready", {})
	}
	centerBy(nodeId){
		let node  = this.nodes[nodeId];
		if(!node)
			return false;

		let pBox = this.getBoundingClientRect();
		let centerX = pBox.left + pBox.width/2;
		let centerY = pBox.top + pBox.height/2;
		let box = node.getBoundingClientRect();
		//console.log("box", pBox, box)
		let cX = box.left + box.width/2;
		let cY = box.top + box.height/2;
		cX = centerX-cX;
		cY = centerY-cY;
		let t = this.paintEl.transform;
		t.x += cX;
		t.y += cY;
		this.setChartTransform(this.paintEl.transform);
	}
	setChartTransform(transform){
		this.paintEl.transform = transform;
		this.paintEl.attr('transform', transform);
		if(this._node){//if node info window is active
			this.updateNodeInfoPosition();
		}
	}
	createNode(data){
		if(!this.nodes[data.id]){
			if(data instanceof GraphNode){
				this.nodes[data.id] = data;
			}else{
				this.nodes[data.id] = new GraphNode(this, data);
			}
		}else{
			if(data instanceof GraphNode)
				data = data.data;
			this.nodes[data.id].setData(data);
		}
		return this.nodes[data.id];
	}
	addNode(node){
		node = this.createNode(node);
		this.simulationNodes.push(node);
		while(this.simulationNodes.length > 50) {
			let discarded = this.simulationNodes.shift();
			discarded.purge();
		}

		let link = node.buildLink();
		//console.log("node", node.data)
		if(link){
			this.simulationLinks.push(link);
			this.simulation.force('link').links(this.simulationLinks)
			//this.simulationLinkForce.links(this.simulationLinks);
			//this.simulation.force('link', d3.forceLink(this.simulationLinks).id(d=>d.id).distance(30).strength(0.1));
		}
	}

	updateSimulation() {
		this.simulation.nodes(this.simulationNodes)
		this.simulation.alpha(0.005);
	}

	UID(){
		return Math.random()*1e10;
	}

	renderInfo(){ 
		let nodeName = this._node ? this._node.data.name : '';
		let tpl = html`
		<node-panel node="${nodeName}" salt="${this.UID()}"></node-panel>
		`;
		render(tpl, this.nodeInfoEl)
	}
	onNodeClick(node, e){
		e.preventDefault();
		e.stopPropagation();
		this._selectedNode = null;
		this.showNodeInfo(node.data, node);
		this._node = node;
		this._selectedNode = node;
	}

	showNodeInfo(data, node){
		if(this._selectedNode)
			return
		this._node = node;
		this.nodeInfoEl.style.pointerEvents = 'none';
		this.renderInfo();
		this.updateNodeInfoPosition();
		this.nodeInfoEl.classList.add("active");
		this.debounce("showNodeInfo", this._updateNodeInfoPosition, 100);
	}
	hideNodeInfo(force){
		if(force !== true && this._selectedNode)
			return
		if(window.localStorage && localStorage.debug == "node-panel")
			return
		this._selectedNode = null;
		this._node = null;
		this.nodeInfoEl.classList.remove("active");
		this.renderInfo();
		this.tipLine2.attr("opacity", 0);
	}
	pinNodeInfoTo(pinTo){
		this.tip.pinned = pinTo;
		this.updateNodeInfoPosition();
	}
	updateNodeInfoPosition(){
		if(!this._node){
			this.hideNodeInfo(true);
			return
		}

		let {width, height} = this.graphHolder.getBoundingClientRect();
		let {width:iW, height:iH} = this.nodeInfoEl.getBoundingClientRect();
		let nodeBox = this._node.getBoundingClientRect();
		//console.log("iW", iW, iH)
		if(!iW)
			return
		//let tipOffset = 4 * this.paintEl.transform.k;

		let x1 = nodeBox.left + nodeBox.width/2;
		let y1 = nodeBox.top + nodeBox.height/2;
		let x2 = x1;
		let y2 = y1;
		let xOffset = nodeBox.width*0.3;
		let yOffset = nodeBox.height*0.3;
		if(x1 > width/2){
			x2 -= nodeBox.width*0.5 + iW;
			xOffset *= -1;
		}else{
			x2 += nodeBox.width*0.5;
		}
		if(y1 > height/2){
			y2 -= nodeBox.height*0.5 + iH;
			yOffset *= -1;
		}else{
			y2 += nodeBox.height*0.5;
		}

		
		if(x2+iW > width){
			x2 = width - iW;
		}else if(x2<0){
			x2 = 0
		}

		if(y2+iH > height){
			y2 = height - iH;
		}else if(y2<0){
			y2 = 0
		}
		if(this.tip && this.tip.pinned){
			switch(this.tip.pinned){
				case 'nw':
					x2 = y2 = 0;
					xOffset = -1* Math.abs(xOffset);
					yOffset = -1* Math.abs(yOffset);
				break;
				case 'ne':
					x2 = width-iW; y2 = 0;
					xOffset = Math.abs(xOffset);
					yOffset = -1* Math.abs(yOffset);
				break;
				case 'se':
					x2 = width-iW; y2 = height-iH;
					xOffset = Math.abs(xOffset);
					yOffset = Math.abs(yOffset);
				break;
				case 'sw':
					x2 = 0; y2 = height-iH;
					xOffset = -1 * Math.abs(xOffset);
					yOffset = Math.abs(yOffset);
				break;
			}
			this.tip.x2 = x2;
			this.tip.y2 = y2;

			this.tip.x1 = x1;
			this.tip.y1 = y1;
		}else{
			this.tip = {x1,	y1, x2,	y2}
		}
		let style = this.nodeInfoEl.style;
		style.left = this.tip.x2+"px";
		style.top = this.tip.y2+"px";
		style.maxHeight = height+"px";
		let hW = width/2;
		let hH = height/2;
		let f = (v)=>{
			if(!v.toFixed)
				console.log("v.toFixedv.toFixed", v)
			return v.toFixed(4);
		}
		x1 = x1-hW+xOffset;
		y1 = y1-hH+yOffset;
		x2 = x2-hW+iW/2;
		y2 = y2-hH+iH/2;



		this.tipLine2
            .attr('d', `M${f(x2)} ${f(y2)} L${f(x1)} ${f(y1)}` )
            .attr('opacity', 1);

    	/*this.tipLine
            .attr('x1',()=>{ return this.tip.x1-width/2; })
            .attr('y1',()=>{ return this.tip.y1-height/2; })
            .attr('x2',()=>{ return this.tip.x2-width/2; })
            .attr('y2',()=>{ return this.tip.y2-height/2; })
            .attr('opacity', 1);
            */
        this.debounce("nodeInfoEl-ts", ()=>{
			this.nodeInfoEl.style.pointerEvents = 'inherit';
		}, 100)
    }

	_drag(simulation){
		let dragstarted = d=>{
			if (!d3.event.active)
				simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		let dragged = d=>{
			d.fx = d3.event.x;
			d.fy = d3.event.y;
		}

		let dragended = d=>{
			if (!d3.event.active)
				simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}

		return d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended);
	}
	updateSVGSize(){
		var box = this.graphHolder.getBoundingClientRect();
		//console.log("graphHolder:box",box)
		this._width = box.width;
		this._height = box.height;
		this.svg.attr("viewBox", [
			-this._width / 2,
			-this._height / 2, 
			this._width,
			this._height
		]);
	}

}

// Register the element with the browser
DAGViz.register();