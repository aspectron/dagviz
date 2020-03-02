// Import BaseElement base class and html helper function
import { html, BaseElement, css, render } from './base-element.js';
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

	let size = o.size * 1.7;
    //o.originX = o.originY = 0;

    var h = (Math.sqrt(3)/2);
    var data = (originX, originY)=>{
    	return [
	        { "x": size+originX,      "y": originY}, 
	        { "x": size/2+originX,    "y": size*h+originY},
	        { "x": -size/2+originX,   "y": size*h+originY},
	        { "x": -size+originX,     "y": originY},
	        { "x": -size/2+originX,   "y": -size*h+originY},
	        { "x": size/2+originX,    "y": -size*h+originY},
	        { "x": size+originX,      "y": originY}, 
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
		//        .attr("stroke", D3x.rgba(o.rgba, 0.9))
		.attr("stroke", D3x.rgba([0,0,0], 0.5))
		//.attr("stroke", D3x.rgba(o.rgba, 0.9))
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

	// node = el.append('svg:g')

	let size = o.size;
	
	let root = null;
	let node = null;

	if(!o.pattern) {
		node = el.append('svg:rect');
		root = node;
	} else {
		root = el.append('svg:g');
		node = root.append('svg:rect');
		node.attr('opacity',1);
	}

	root.attr('opacity',1);


		//.attr('', 0)//Math.random() * 25 + 25)
	node
        .attr('x',-size)
        .attr('y',-size)
        .attr('width', size*2)
        .attr('height', size*2)
        //.attr('height', 0)// size*2)
//        .attr('opacity',0)
	//        .attr('opacity',0.85)
        //.attr('fill', o.rgba)//D3x.rgba(o.rgba))
        //.attr('fill', o.pattern ) // D3x.rgba(o.rgba))
        .attr('fill', o.rgba) // D3x.rgba(o.rgba))
//        .attr('fill', o.pattern ? `url(#${o.pattern})` : o.rgba) // D3x.rgba(o.rgba))
//        .attr('fill', o.pattern ? `url(#${o.pattern})` : o.rgba) // D3x.rgba(o.rgba))
//        .attr('fill', o.rgba) // D3x.rgba(o.rgba))
        .attr("stroke", D3x.rgba([0,0,0], 0.5))
		//.attr("stroke-width", 1)
//		.attr('class',['block'])

	if(o.strokeWidth)
		node.attr('stroke-width',o.strokeWidth);


	let pattern = null;

	 if(o.pattern) {
		 pattern = root.append('svg:rect')
		 //.attr('', 0)//Math.random() * 25 + 25)
		 .attr('x',-size)
		 .attr('y',-size)
		 .attr('width', size*2)
		 .attr('height', size*2)
		 //.attr('height', 0)// size*2)
		 //.attr('opacity',0.125)
		 .attr('opacity',o.patternOpacity || 0.125)
//		 .attr('opacity',0.075)
         .attr('fill', `url(#${o.pattern})`)
//		 .attr('class',['block'])

		 // console.log(o.pattern);
	 }
	// 	node.attr('fill')


	let selector = null;
	
	if(o.selected) {
		selector = root.append('svg:path')
	//.attr("transform", "translate(400,200)")
		.attr("d", d3.arc()
			.innerRadius( o.size*2 )
			.outerRadius( o.size*2+10 )
			.startAngle( 0 )     // It's in radian, so Pi = 3.14 = bottom.
			.endAngle( 6.29 )       // 2*Pi = 6.28 = top
		)
		 .attr('stroke', 'black')
		 .attr('stroke-width',0)
		.attr('fill', `rgba(0,0,0,0.5)`)	
	}
		
/*
	if(o.selected) {
		selector = el.append('svg:circle')
			.attr('r', o.size * 2)//Math.random() * 25 + 25)
			.attr('opacity',0.5)
			//.attr('fill', D3x.rgba(o.rgba))
			.attr('stroke', `rgba(0,0,0,0.5)`)	
			.attr('stroke-width',10)
	}
*/
	//}

	// node
	//  		.transition()
	// 	    //.ease('in-out')	// d3x
    // //     //.duration(1000)
	//  		.duration(1000)
	// 		 //.attr('opacity',0.85);
	// 		 .style("opacity", 1);

	//        .transition("c")
	        //.ease('in-out') // d3x
	//        .duration(1000)
	//        .attr("height", size * 2)

    root.setPosition = (x, y)=>{
    	node
    		.attr("x", x-size)
			.attr("y", y-size);

		if(pattern) {
			pattern
				.attr("x", x-size)
				.attr("y", y-size);
		}

		if(selector) {
			selector.attr('transform',`translate(${x},${y})`);
		}

    	return root;
	}
	
    root.setFill = (fn)=>{
		// console.log('set-fill');
    	node.attr("fill", fn())
	}
	

    return root;
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


/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/* accepts parameters
 * r  Object = {r:x, g:y, b:z}
 * OR 
 * r, g, b
*/
function RGBtoHSV(r, g, b) {
    if (arguments.length === 1) {
        g = r.g, b = r.b, r = r.r;
    }
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;

    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }

    return {
        h: h,
        s: s,
        v: v
    };
}


export class GraphNodeLink{
	constructor(holder, data){
		this.holder = holder;
		this.curves = holder.curves;
		this.data = data;
		this.el = holder.linksEl.append("path");
		this.el.style('opacity',0).style('fill', 'none');
		this.source = holder.nodes[data.child];
		this.target = holder.nodes[data.parent];
		this.target.addParentLink(this);
		this.target.attachNode();

		if((this.source && this.source.data.isChainBlock) && (this.target && this.target.data.isChainBlock)) {
			this.isChainBlockLink = true;
			this.defaultColor = 'rgba(0,32,64,1)';
			this.defaultStrokeWidth = 1;
			this.defaultOpacity = 0.95;
		} else 
		{
			this.defaultColor = 'black';
			this.defaultStrokeWidth = 1;
			this.defaultOpacity = 0.65;
		}

		if(this.holder.ctx.quality == 'low')
			this.defaultOpacity = 1;

		this.el.transition().duration(1000)
			.attr('stroke', this.defaultColor)
			.attr('stroke-width', this.defaultStrokeWidth)
			.style('opacity', this.defaultOpacity);

	}
	remove(){
		this.el.remove();
		//delete this.holder.links.parent[this.data.parent];
		this.target.removeParentLinks(this);
		// TODO - should we check/remove children?
	}
	updateStyle(){
		if(!this.source || !this.target){
			//console.log("this.source", this.data.child)
			return
		}
		if(!isNaN(this.source.x) && !isNaN(this.source.y) && !isNaN(this.target.x) && !isNaN(this.target.y)) {
			this.el
				//.transition('o')
				//.duration(2000)
				.attr("d", this.buildD(
					this.source.x,
					this.source.y,
					this.target.x,
					this.target.y
				))
				.attr('stroke-width', this.isChainBlockLink ? 7 : 1);
		}

		//this.el.transition().duration(1000).style('opacity', 1);
	}
	buildD(x1, y1, x2, y2) {
		if(!this.curves)
			return `M${x1},${y1} ${x2},${y2}`;
		//M100,100 C100,180 400,20 400,100
		let xx = x1+(x2-x1)*0.5;
		return `M${x1},${y1} C${xx},${y1} ${xx},${y2} ${x2},${y2}`;
	}
	setStaticPosition(x, y, x2, y2){
		if(typeof(x2) == 'undefined' || typeof(y2) == 'undefined'){
			if(!this.target)
				return
			x2 = this.target.x;
			y2 = this.target.y;
		}
		if(!isNaN(x) && !isNaN(y) && !isNaN(x2) && !isNaN(y2)) {
			this.el
				.attr("d", this.buildD(x, y, x2, y2));
		}
	}

	highlight(color, node) {

		let stroke = this.defaultColor;
		if(color) {
			if(this.isChainBlockLink) {
				if(this.source.selected && this.target.selected)
					stroke = 'blue';
				// else
				// if(color == 'red')
				// 	stroke = 'rgba(92,0,0,1)';
				// else
				// 	stroke = 'rgba(0,48,0,1)';
			}
			else
			if(this.source.selected && this.target.selected)
				stroke = 'blue';
			else if(node.selected)
				stroke = this.defaultColor;
			else
				stroke = color;
}

		this.el.transition()
			.duration(200)
			.style('opacity', color ? 1 : this.defaultOpacity)
			.attr('stroke', stroke)
			// .attr('stroke', color ? (this.isChainBlockLink ? (color == 'red' ? 'rgba(92,0,0,1)' : 'rgba(0,48,0,1)') : color) : this.defaultColor)
			.attr('stroke-width', color ? this.isChainBlockLink ? 7 : 1 : this.defaultStrokeWidth)
	}
}

export class GraphNode{
	constructor(holder, data){
		this.holder = holder;
		this.data 	= data;
		this.id 	= data.id || data.name;
		this.tOffset = 0;
		holder.nodes[this.id] = this;
		this.parentLinks = {};
		this.selected = false;

		this.holder.createIdx(this);
		this.attachNode();
	}
	setData(data){
		this.data = data;
		this.buildLinks();
		if(this.textEl)
			this.textEl.text(this.data.name);
		if(this.heightEl)
			this.heightEl.text(this.data.blueScore+'');
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
		    "tbd3" : { shape : 'circle', rgba : [136,170,255,1] },
		    "block" : { shape : 'square', rgba : [243,243,0,1] },
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
			if(this.textEl)
				this.holder.nodesEl.append(()=>{
					return this.textEl.node()
				});
			if(this.heightEl)
				this.holder.nodesEl.append(()=>{
					return this.heightEl.node()
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
	            size : this.data.size || 100,
	            rgba : shapeConfig.color,//shapeConfig.rgba,
				opacity : 0.5,
				pattern : this.holder.ctx.quality == 'high' ? (this.data.isChainBlock ? 'diagonal-stripe-2' : null) : null
	        });

	        //this.el.transform = d3.zoomIdentity.translate(0, 0).scale(0.5);
			// this.textEl = this.holder.nodesEl.append("text")
			// 	.attr("fill", "#000")
			// 	.attr("class", ["node-name",this.data.type].join(' '))
			// 	.text(this.data.name);
	    } else {
			this.el = this.holder.nodesEl.append("circle");
			// this.textEl = this.holder.nodesEl.append("text")
			// 	.attr("fill", "#000")
			// 	.attr("class", ["node-name",this.data.type].join(' '))
			// 	.text(this.data.name);
		}

//		this.el.attr("class",['block']);
		
		this.el
			//.style('opacity',0)
			.transition()
			.duration(500)
			.style('opacity',0.75);

		if(this.textEl)
			this.textEl = this.holder.nodesEl.append("text")
				.attr("fill", "#000")
				.attr("class", ["node-name",this.data.type].join(' '))
				.text(this.data.name);

		if(this.heightEl)
			this.heightEl = this.holder.nodesEl.append("text")
				.attr("fill", "#000")
				.attr("class", ["node-name",this.data.type].join(' '))
				.text(this.data.blueScore+'');


		this.bindElEvents();
		
		return this;

	}
	rebuildLinks() {
		this.removeLinks();
		this.buildLinks();
	}
	buildLinks(){
		let {data, holder} = this;
		//console.log("data", data, holder.nodes[data.parent])
		if(!data.parentBlockHashes || !data.parentBlockHashes.length){
			this.removeLinks();
		}else 
		// if(holder.nodes[data.acceptingBlockHash])
		{
				this.createLinks(data.parentBlockHashes);
			// else
			// 	console.warning(`Block not present during linkage: ${data.parent}`);
			// if(holder.nodes[data.parent].data.timestamp == data.timestamp)
			// 	data.timestamp -= 0.5;
				//holder.nodes[data.parent].data.timestamp;
		}
		//if(data.parent)
		//	console.log("data.parent", data.parent, this.linkNode)
		return this.linkNodes;
	}
	createLinks(parents){
		if(this.partialLinks) {
			this.removeLinks();
		}
		else
		if(this.linkNodes)
			return;

		this.partialLinks = false; 
		this.linkNodes = parents.map((parent) => {

			if(!this.holder.nodes[parent]) {
				// console.log('no parent is present, ignoring links...');
				this.partialLinks = true;
				return null;
			}

			return new GraphNodeLink(this.holder, {child:this.id, parent});
			//return this.createLink(this.id, parent);
		}).filter(nl=>nl);
	}
	removeLinks(filter){
		if(this.linkNodes){
			this.linkNodes = this.linkNodes.map((link)=>{
				if(filter) {
					if(link.data.parent != filter && link.data.child != filter)
						return link;
				}
				link.remove();
				return null;
			}).filter(v=>v); // .remove();

			if(!this.linkNodes.length)
				delete this.linkNodes;
			//delete this.linkNodes;
		}
	}
	remove(){
		this.removeElEvents();
		this.el.remove();
		if(this.textEl)
			this.textEl.remove();
		if(this.heightEl)
			this.heightEl.remove();
		this.removeLinks();

		_.each(this.parentLinks, (link, parent)=>{
			link.remove();
			delete this.parentLinks[parent];
		});

		this.holder.removeIdx(this);
	}
	initPosition(){
		let {x, y} = this;
		this.el.setPosition(x, y);
		//this.el.setStaticPosition(x, y);
		if(this.textEl){
			this.textEl
				.attr("x", x)
				.attr("y", y-0.75)
		}
		if(this.heightEl){
			this.heightEl
				.attr("x", x)
				.attr("y", y-0.25)
		}
		if(this.linkNodes)
			this.linkNodes.forEach(node => node.setStaticPosition(x, y));
				
	}
	updateStyle(force){
		if(isNaN(this.x) || isNaN(this.y) || !this.data.timestamp) {
			// console.log("aborting updateStyle (lack of data) for:",this);
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

		const isBlue = !!this.data.acceptingBlockHash;
		const isRed = !isBlue;

		// if(this.data.isChainBlock && this.holder.ctx.chainBlocksDistinct)
		// 	this.data.color = `rgba(194,255,204,0.99)`;
		// else 
		if(isBlue)
			this.data.color = `rgba(194,244,255,0.99)`;
		else
			this.data.color = `rgba(255,194,194,0.99)`;


			/*
		if(this.selected) {
			let colors = [...this.data.color.matchAll(/(\d+),(\d+),(\d+),([\.\d]+)/g)].shift();
			//console.log('colors:',JSON.stringify(colors));
			colors.shift();
			const a = colors.pop();
			//console.log('a:',a);
			const [r_,g_,b_] = colors.map(v=>parseInt(v)); //v.map(v=>Math.round(parseInt(v)/2));
			let {h,s,v} = RGBtoHSV(r_,g_,b_);
			v = 0.9;
			s = 0.75;

			// h -= 0.2;
			// if(h < 0)
			// 	h = 0;
			// if(h > 1)
			// 	h = 1;
			//s *= 1.3;
			v = v > 1 ? 1 : v < 0 ? 0 : v;
			s = s > 1 ? 1 : s < 0 ? 0 : s;

			
			let {r,g,b} = HSVtoRGB(h,s,v);
			//console.log(h,s,v,r,g,b);

			this.data.color = `rgba(${r},${g},${b},${a})`;
			//console.log(this.data.color);
		}*/

		if(force || this.data.shape != this.shape || this.data.color != this.color || this.data.size != this.size || this.quality != this.holder.ctx.quality) {
			this.removeElEvents();
			// console.log("DATA CHANGE",this);
			this.el.remove();

			this.quality = this.holder.ctx.quality;

			let pattern = null;
			let patternOpacity = 0.125;
			if(this.holder.ctx.quality == 'high') {
				if(isRed) {
					//pattern = 'crosshatch';
					pattern = 'diagonal-stripe-1';
					patternOpacity = 0.125;
				}
				// if(this.holder.ctx.chainBlocksDistinct && this.data.isChainBlock) {
				// }
			}
			

	        this.el = D3x.createShape(this.holder.nodesEl, shapeConfig.shape, {
	            size : this.data.size,
	            rgba : this.data.color || shapeConfig.color,//shapeConfig.rgba,
				opacity : 0.5,
				pattern, patternOpacity, // : this.holder.ctx.isChainBlock ? (this.data.isChainBlock ? 'diagonal-stripe-1' : null) : null,
//				pattern : this.holder.ctx.isChainBlock ? (this.data.isChainBlock ? 'diagonal-stripe-2' : null) : null,
				strokeWidth : this.data.isChainBlock ? 7 : 1,
				selected : this.selected
	        });

	        this.shape = this.data.shape;
			this.color = this.data.color;
			this.size = this.data.size;

/*
			if(this.selected) {


				this.el.append("path")

				//.attr("transform", "translate(400,200)")
				.attr("d", d3.arc()
					.innerRadius( 100 )
					.outerRadius( 150 )
					.startAngle( 0 )     // It's in radian, so Pi = 3.14 = bottom.
					.endAngle( 6.28 )       // 2*Pi = 6.28 = top
					)
				.attr('stroke', 'black')
				.attr('fill', '#69b3a2');

			}*/

			const textColor = this.data.textColor || '#000';

			if(this.textEl)
		        this.textEl.remove();


			if(this.quality != 'low') {
				this.textEl = this.holder.nodesEl.append("text")
		    	.attr("class", "node-text")
				.style('opacity',0)
				.attr("fill", textColor)
				.attr("class", ["node-name",this.data.type].join(' '))
				//.attr("class", )
				.text(this.data.name);
			}

			//this.textEl.__box = this.textEl.node().getBoundingClientRect();

			if(this.heightEl)
				this.heightEl.remove();

			if(this.quality == 'high') {
				this.heightEl = this.holder.nodesEl.append("text")
					.attr("class", "node-text")
					.style('opacity',0)
					.attr("fill", textColor)
					.attr("class", ["node-name",this.data.type].join(' '))
					//.attr("class", )
					.text(this.data.blueScore+'');
			}
			else {
				delete this.heightEl;
			}

			//this.heightEl.__box = this.heightEl.node().getBoundingClientRect();

			this.bindElEvents();

			this.el.transition()
				.duration(500)
				.style('opacity', 1);

			if(this.textEl)
				this.textEl.transition()
					.duration(500)
					.style("opacity", 1);

			if(this.heightEl)
				this.heightEl.transition()
					.duration(500)
					.style("opacity", 1);

			// this.rebuildLinks();

	    }

		//console.log("EL:", Date.now()/1000, this.data.timestamp)
		if(this.holder.maxTS < this.data.timestamp) {
			if(this.holder.maxTS) {
				if(!this.holder.delta)
					this.holder.delta = 0;
				this.holder.delta
			}
			this.holder.maxTS = this.data.timestamp;
		}

		//		const ts = Date.now();

				// let tDelta = this.holder.maxTS - this.tOffset;
		//		this.tOffset = this.holder.maxTS;
		//		let offset = (Date.now()-this.holder.startTS) / 1000;
		//		let x = this.data.xMargin-((Date.now()/1000 - this.data.timestamp))*50 + 256;//*Math.random()*100;
		//let x = this.holder.xMargin-((Date.now()/1000 - this.data.timestamp))*this.holder.tdist;//*Math.random()*100;
		//let x = this.data.xMargin-((Date.now()/1000 - this.data.timestamp))*this.holder.tdist + 256;//*Math.random()*100;
		//let x = this.data.xMargin-((Date.now()/1000 - this.data.timestamp))*50 + 256;//*Math.random()*100;
		//let x = -((this.holder.maxTS - this.data.timestamp))*50 - 256;//*Math.random()*100;
		//let x = -((this.tOffset - this.data.timestamp))* 100 - 256 ;//*Math.random()*100;
		//console.log(x);

		// x = Date.now() - (this.data.timestamp) * this.holder.unitDist;
		//console.log(x);

		//		this.x = x;
		if(this.holder.ctx)
			this.holder.ctx.nodePosition(this, this.holder, this.holder.nodes);


		this.el
			.setPosition(this.x, this.y)
			.setFill(()=>{

				// if(this.data.isChainBlock)
				// 	return `url(#diagonal-stripe-1)`;

				if(this.data.color) {
					return this.data.color;
				} 
				// else {
				// 	return host && host.online ? "#b3e2ff" : "#ffb3b3";
				// }
			})
		// if(this.data.isChainBlock)
		// 	this.el.setPattern('diagonal-stripe-1');
		let zoom = this.holder.paintEl.transform.k

		if(this.textEl) {
			let textBox = this.textEl.node().getBoundingClientRect();
			let textBoxWidth = textBox.width / zoom;
			let textBoxHeight = textBox.height / zoom;

			this.textEl
				//.transition('o')
				//.duration(2000)
				.attr("x", Math.round(this.x-textBoxWidth/2))
				.attr("y", Math.round((this.y-12)-0.25))
				//.attr("y", (this.y+height/3)-0.75)
				.attr("opacity", 1)
		}
		
		if(this.heightEl) {
			let infoBox = this.heightEl.node().getBoundingClientRect();
			let infoBoxWidth = infoBox.width / zoom;
			let infoBoxHeight = infoBox.height / zoom;
			this.heightEl
				//.transition('o')
				//.duration(2000)
				.attr("x", Math.round(this.x-infoBoxWidth/2))
				.attr("y", Math.round((this.y+20)-0.25))
				//.attr("y", (this.y+height/3)-0.25)
				.attr("opacity", 1);
		}


			
		if(this.linkNodes)
			this.linkNodes.forEach(node=>node.updateStyle());

		// if(this.selected)
		// 	this.highlightLinks(true);
	}
	addParentLink(parentLink){
		this.parentLinks[parentLink.data.child] = parentLink;
	}
	removeParentLinks(parentLink){
		delete this.parentLinks[parentLink.data.child];
	}

	getLinks() {
		return (this.linkNodes || []).concat(Object.values(this.parentLinks));
	}

	onNodeClick(e) {
		if (d3.event.defaultPrevented)
			return
		this.holder.onNodeClick(this, d3.event);

//		this.holder.select(this);
	}
	onNodeHover(){
		// this.holder.showNodeInfo(this.data, this);
		this.holder.highlightLinks(this.linkNodes || [], 'green', this);
		this.holder.highlightLinks(Object.values(this.parentLinks), 'red', this);

		const { data } = this;

		if(!this.$info)
			this.$info = $("#top .info");
		this.$info.html(`<i class="fa fal fa-cube"></i> ${data.blockHash} &Delta;${data.blueScore} [${(data.parentBlockHashes||[]).length}]->[${(data.childBlockHashes||[]).length}] - ${this.getTS(new Date(data.timestamp*1000))}`);

		if(this.nodeInfoEl)
			this.nodeInfoEl.addClass('focus');

	}

	highlightLinks(highlight = true) {
		if(highlight) {
			this.holder.highlightLinks(this.linkNodes || [], 'green', this);
			this.holder.highlightLinks(Object.values(this.parentLinks), 'red', this);
	
		}
		else {
			this.holder.highlightLinks(this.getLinks(), null, this);

		}
	}

	onNodeOut(){
		// this.holder.hideNodeInfo(this.data, this);

		if(this.nodeInfoEl)
			this.nodeInfoEl.removeClass('focus');

		this.$info.html('');

		if(!this.selected)
			this.holder.highlightLinks(this.getLinks(), null, this);


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


	getTS(src_date) {
		var a = src_date || (new Date());
		var year = a.getFullYear();
		var month = a.getMonth()+1; month = month < 10 ? '0' + month : month;
		var date = a.getDate(); date = date < 10 ? '0' + date : date;
		var hour = a.getHours(); hour = hour < 10 ? '0' + hour : hour;
		var min = a.getMinutes(); min = min < 10 ? '0' + min : min;
		var sec = a.getSeconds(); sec = sec < 10 ? '0' + sec : sec;
		//var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
		return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
	}
	

	getBoundingClientRect(){
		if(this.el.getBoundingClientRect)
			return this.el.getBoundingClientRect();
		return this.el.node().getBoundingClientRect();
	}
	purge(){

		if(this.nodeInfoEl)
			this.nodeInfoEl.remove();

		delete this.holder.nodes[this.data.id];
		// TODO - css animate opacity
		this.remove();
		let index = this.holder.simulationNodes.indexOf(this);
		if(index > -1){
			this.holder.simulationNodes.splice(index, 1);
		}
	}

	select(flag) {


		if(flag === undefined)
			this.selected = !this.selected;
		else {
			flag = !!flag;
			if(this.selected == flag)
				return;
			this.selected = flag;
		}
//		if(this.selected)

		if(!this.selected)
			delete this.holder.selection[this.data.blockHash];
		else
			this.holder.selection[this.data.blockHash] = this;

		this.holder.ctx.onSelectionUpdate(this.holder.selection);

		// dpc(()=>{
		// 	this.updateStyle(true);
		// });

		// this.el.transition()
		// 	.duration(200)
		// 	.attr('stroke', this.selected ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.5)')
		// 	.attr('stroke-width', this.selected ? 5 : 1);

		this.updateStyle();

		if(!this.selected) {
			if(this.nodeInfoEl) {
				this.nodeInfoEl.remove();
				delete this.nodeInfoEl;
			}
			this.highlightLinks(false, null, this);
			return;
		}

		this.highlightLinks(true, null, this);
		this.nodeInfoEl = $(`<block-info hash='${this.data.blockHash}'></block-info>`);
		$('#bottom .selection').append(this.nodeInfoEl);

	}

}

export class DAGViz extends BaseElement {
	static get is(){
		return 'dag-viz';
	}
	static get properties() {
		return {
			// max : { type: Number, value: 384 },
			// tdist : { type: Number, value: 50 },
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
				user-select: none;        

			}
			:host([hidden]) { display: none;}
			#graph{
				flex:1;
				height:100%;
				/*height: 100vh;*/
				/*cursor:grab;*/
			}

			.block {
				cursor: pointer;
			}
			
			.node-name{font-size:12px;pointer-events: none;
			
				font-family:'Exo 2','Consolas', 'Roboto Mono', 'Open Sans', 'Ubuntu Mono', courier-new, courier, monospace;
				font-weight: 200;
			
			}
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

		this.maxTS = 0;
		this.startTS = Date.now();

		this.max = 256;
		this.tdist = 50;

		this.xMargin = 384;

		//this.track = false;

		this.links = {
			// parent : { },
			// child : { }
		}

		this.locationIdx = { };

		this.selection = { };
		//this.unitDist = 100;

		//
	}
	render() {
		// https://iros.github.io/patternfills/sample_d3.html
		return html`
		<div id="graph"></div>
		<div id="nodeInfo"></div>
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="diagonal-stripe-1" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzEnLz4KPC9zdmc+Cg==" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>		
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="diagonal-stripe-2" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzInLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>
		<svg height="8" width="8" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="crosshatch" patternUnits="userSpaceOnUse" width="8" height="8"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnPgogIDxyZWN0IHdpZHRoPSc4JyBoZWlnaHQ9JzgnIGZpbGw9JyNmZmYnLz4KICA8cGF0aCBkPSdNMCAwTDggOFpNOCAwTDAgOFonIHN0cm9rZS13aWR0aD0nMC41JyBzdHJva2U9JyNhYWEnLz4KPC9zdmc+Cg==" x="0" y="0" width="8" height="8"> </image> </pattern> </defs> </svg>
		<svg height="6" width="6" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="whitecarbon" patternUnits="userSpaceOnUse" width="6" height="6"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyB3aWR0aD0nNicgaGVpZ2h0PSc2Jz4KICA8cmVjdCB3aWR0aD0nNicgaGVpZ2h0PSc2JyBmaWxsPScjZWVlZWVlJy8+CiAgPGcgaWQ9J2MnPgogICAgPHJlY3Qgd2lkdGg9JzMnIGhlaWdodD0nMycgZmlsbD0nI2U2ZTZlNicvPgogICAgPHJlY3QgeT0nMScgd2lkdGg9JzMnIGhlaWdodD0nMicgZmlsbD0nI2Q4ZDhkOCcvPgogIDwvZz4KICA8dXNlIHhsaW5rOmhyZWY9JyNjJyB4PSczJyB5PSczJy8+Cjwvc3ZnPg==" x="0" y="0" width="6" height="6"> </image> </pattern> </defs> </svg>
		<svg height="5" width="5" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="smalldot" patternUnits="userSpaceOnUse" width="5" height="5"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgo8cmVjdCB3aWR0aD0nNScgaGVpZ2h0PSc1JyBmaWxsPScjZmZmJy8+CjxyZWN0IHdpZHRoPScxJyBoZWlnaHQ9JzEnIGZpbGw9JyNjY2MnLz4KPC9zdmc+" x="0" y="0" width="5" height="5"> </image> </pattern> </defs> </svg>
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="circles-1" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSJ3aGl0ZSIgLz4KICA8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iYmxhY2siLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>						
		<svg height="5" width="5" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="lightstripe" patternUnits="userSpaceOnUse" width="5" height="5"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgogIDxyZWN0IHdpZHRoPSc1JyBoZWlnaHQ9JzUnIGZpbGw9J3doaXRlJy8+CiAgPHBhdGggZD0nTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVonIHN0cm9rZT0nIzg4OCcgc3Ryb2tlLXdpZHRoPScxJy8+Cjwvc3ZnPg==" x="0" y="0" width="5" height="5"> </image> </pattern> </defs> </svg>
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
			// this.hideNodeInfo(true)
			
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
		const self = this;
		this.nodes = {};
		this.svg = d3.select(this.graphHolder).append("svg");
		var zoom = d3.zoom()
			.scaleExtent([0.1,3.5])
    		.on('zoom', (e)=>{
//console.log(e);
    			this.setChartTransform(d3.event.transform)
    			let w = Math.max(0.01, 1/this.paintEl.transform.k)
    			this.nodesEl.attr("stroke-width", w);
    			this.nodesEl.attr("stroke", 'rgba(0,0,0,0.5)');
				this.linksEl.attr("stroke-width", w);
				// d3.select('node-text').attr("stroke-width", 0.5);
				//this.updatePanInfo(this.paintEl.transform);
				//this.updateRegion(this.paintEl.transform);
			})
			.on('start', (e)=>{
				window.app.enableUndo(false);
			})
			.on('end', () => {
				window.app.enableUndo(true);
				window.app.storeUndo();
			})
    	this.svg.call(zoom);
    	this.paintEl = this.svg.append("g")
    	this.paintEl.transform = d3.zoomIdentity.translate(0, 0).scale(1);

		this.graphHolder.addEventListener('mouseup', (e) => {
			console.log("YES!!!!!!!!!!!!!!!");
		})

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


		this.simulationLinkForce = d3.forceLink([]).id(d=>d.id).distance(200).strength(0.5)
		this.simulationLinks = this.simulationLinkForce.links();

		//console.log("this.simulationNodes", this.simulationNodes)

		this.simulation

		// .force("y", d3.forceY().y((d) => {
		// 	// console.log('d',d);
		// 	if(d.data.isChainBlock)
		// 		return 0;
		// 	return 100;
		// }))


//		.velocityDecay(0.45)
			// .force("link", this.simulationLinkForce)
			.force('collision', d3.forceCollide().radius((d) => {
				//console.log("d.size", d)

				return this.ctx.mass ? d.data.size * 2 : 75;

			 	//return d.data.size * 3;// * 2//d.radius
			}))
			.force("charge", d3.forceManyBody().strength(-200))
			//.force("charge", d3.forceManyBody().strength(350))
			//.force("charge", d3.forceManyBody().strength(150))
			//.force("y", d3.forceY())


		this.simulation.on("tick", () => {
			//console.log('tick');
			let nodes = this.simulationNodes;
			//console.log("nodes", nodes.length)
			for(let i=0, l=nodes.length; i<l; ++i){
				nodes[i].updateStyle();
			}

			this._updateNodeInfoPosition();

			this.updateTracking();

			// if(this.ctx.track)
			// 	this.simulation.restart();

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


		// this.tAxis = this.paintEl.append('path')
		// 	.attr('stroke', 'rgba(0,0,0,1.0)')
		// 	.attr('stroke-width', 1)
		// 	.attr('class', 'tip-line')
		// 	//.attr('marker-end', 'url(#tipArrow)')
		// 	.attr('d', `M${this.xMargin} -1000 L ${this.xMargin} 1000`)
	
		this.tAxis = [];

		for(let i = 0; i < 10; i++) {
			this.tAxis60 = this.paintEl.append('path')
				.attr('stroke', 'rgba(0,0,0,0.1)')
				.attr('stroke-width', 1)
				.attr('class', 'tip-line')
				//.attr('marker-end', 'url(#tipArrow)')
				.attr('d', `M${this.xMargin-(60*i*this.tdist)} -1000 L ${this.xMargin-(60*i*this.tdist)} 1000`)
		}

		window.addEventListener("resize", this.updateSVGSize.bind(this))
		this.fire("ready", {})
	}
	centerBy(nodeId, options){
		let node  = this.nodes[nodeId];
		if(!node)
			return false;
	
		let t = this.paintEl.transform;
		// let 

		let pBox = this.getBoundingClientRect();
		let centerX = pBox.left + pBox.width/2;
		if(options && options.offsetX)
			centerX += options.offsetX * pBox.width;
		let centerY = pBox.top + pBox.height/2;
		let box = node.getBoundingClientRect();
		//console.log("box", pBox, box)
		let cX = box.left + box.width/2;
		let cY = box.top + box.height/2;
		cX = centerX-cX;
		cY = centerY-cY;
		if(options && options.filter) {
			options.filter(t,{ cX, cY });
		} else {
			t.x += cX;// * 0.01;
			t.y += cY;// * 0.01;
		}
		this.setChartTransform(this.paintEl.transform);
	}

	translate(x,y, options) {
		console.log("doing translate...");
		let pBox = this.getBoundingClientRect();
		let centerX = pBox.left + pBox.width/2;
		if(options && options.offsetX)
			centerX += options.offsetX * pBox.width;
		let centerY = pBox.top + pBox.height/2;
		// let box = node.getBoundingClientRect();
		// //console.log("box", pBox, box)
		// let cX = box.left + box.width/2;
		// let cY = box.top + box.height/2;
		// let cX = centerX-x;
		// let cY = centerY-y;
		// let cX = centerX-x;
		// let cY = centerY-y;

		let t = this.paintEl.transform;

		t.x = -(x * t.k);
		t.y = -y;

		// if(options && options.filter) {
		// 	options.filter(t,{ cX, cY });
		// } else {
			// t.x += cX;// * 0.01;
			// t.y += cY;// * 0.01;
		//}

		this.setChartTransform(this.paintEl.transform);

	}
	setChartTransform(transform, skipUpdates){
		this.paintEl.transform = transform;
		//this.paintEl.
		// transition().duration(1000)
		// .attr('transform', transform);
		this.paintEl.attr('transform', transform);

		if(skipUpdates)
			return;

		if(this._node){//if node info window is active
			this.updateNodeInfoPosition();
		}

		this.updatePanInfo(this.paintEl.transform);
		this.updateRegion(this.paintEl.transform);

		// window.app.storeUndoPosition()

		// const { k }	= transform;
		// let url = new URL(window.location.href);
		// url.searchParams.set('k', k.toFixed(4));
		// let state = { k };
		// history.replaceState(state, "BlockDAG Viz", "?"+url.searchParams.toString()+url.hash);

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


		if(node.data.origin == 'tip-update') {
			this.lastNodeAdded = node;
			this.lastNodeAddedTS = Date.now();
		}
		//console.log("max:",this.max);
		// while(this.simulationNodes.length > this.max) {
		// 	let discarded = this.simulationNodes.shift();
		// 	discarded.purge();
		// }



		let linksUpdated = false;
		let links = node.buildLinks();
		if(links && links.length) {
			this.simulationLinks.push(...links);
			linksUpdated = true;
		}

		this.simulationNodes.forEach(n=>{
			if(n.partialLinks) {
				links = n.buildLinks();
				if(links && links.length) {
					this.simulationLinks.push(...links);
					linksUpdated = true;
				}
			}
		})

		
		//console.log("node", node.data)
		if(linksUpdated){
			this.updateSimulationLinks();
			//this.simulationLinkForce.links(this.simulationLinks);
			//this.simulation.force('link', d3.forceLink(this.simulationLinks).id(d=>d.id).distance(30).strength(0.1));
		}

		this.restartSimulation();
//		this.simulation.restart();
	}

	restartSimulation() {
		this.simulationTimeoutTS = Date.now();
		this.simulation.alpha(0.01);
		this.simulation.restart();
	}

	// createLink(parent, child) {
	// 	let link = new GraphNodeLink(this, {parent, child});
	// 	this.links[parent+child] = link;
	// 	return link;
	// }

	updateSimulationLinks() {
		if(this.simulation.force('link'))
			this.simulation.force('link').links(this.simulationLinks);
	}

	updateSimulation() {
		try {
			this.simulation.nodes(this.simulationNodes)
		} catch(ex) {
			console.log(ex);
		}
// console.log('update simulation..');
		if(1) {
			this.simulation.alpha(0.005);
//			this.simulation.alphaTarget(0.005);
this.simulation.alphaDecay(0.005);
//this.simulation.alphaDecay(0.525);
			
		} else {
			this.simulation.alpha(0.0045);
	//		this.simulation.alphaTarget(0.005);
			this.simulation.alphaDecay(0.001);
		}
		//		this.simulation.alpha(0.005);
		//		this.simulation.alpha(0.01);

		if(Date.now() - this.simulationTimeoutTS > 10 * 1000) {
			this.simulation.stop();
			//console.log('setting simulation alphaDecay to 0.1')
			//this.simulation.alphaDecay(0.1);
			//this.simulation.
		}


		//		this.updateNodeInfoPosition();
	}

	UID(){
		return Math.random()*1e10;
	}

	renderInfo(){ 
		let nodeName = this._node ? this._node.data.name : '';
		let data = JSON.stringify(this._node ? this._node.data : {});
		let tpl = html`
		<node-panel node="${nodeName}" data="${data}" salt="${this.UID()}"></node-panel>
		`;
		render(tpl, this.nodeInfoEl)
	}
	onNodeClick(node, e){
		e.preventDefault();
		e.stopPropagation();

		this.selectNode(node);
		// this._selectedNode = null;
		// this.showNodeInfo(node.data, node);
		// this._node = node;
		// this._selectedNode = node;
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

		iH *= 1.1;
		iW *= 1.1;
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
			//this.updateDragInfo(d);
		}

		let dragged = d=>{
			d.fx = d3.event.x;
			d.fy = d3.event.y;
			//this.updateDragInfo(d);
		}

		let dragended = d=>{
			if (!d3.event.active)
				simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
			//this.updateDragInfo(d);
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

	updatePanInfo(transform) {
		//console.log('transform:',transform);

		let pos = -(transform.x / transform.k / this.ctx.unitDist);

		// let suffix = '';
		// let sign = t > 0 ? '+' : t < 0 ? '' : '';
		// if(t > 60 * 60) {
		// 	t = t / 60 / 60;
		// 	t = t.toFixed(2);
		// 	suffix = 'hrs';
		// }
		// else
		// if(t > 60) {
		// 	t = t / 60;
		// 	t = t.toFixed(2);
		// 	suffix = 'min';
		// }
		// else {
		// 	t = t.toFixed();
		// 	suffix = 'sec';
		// }

		// t = `${sign}${t} ${suffix}`;

		if(!this.$position)
			this.$position = $("#top .position");
		this.$position.html(`Pos: ${pos.toFixed(1)}`);
	}

	registerRegionUpdateSink(fn) {
		this.regionUpdateSink_ = fn;
	}

	updateRegion(transform) {
		if(!this.regionUpdateSink_)
			return;

		if(!this.ctx) {
			console.log('updateRegion - no ctx');
			return;
		}

		const { axis, size, sign } = this.ctx.direction;

		let pos = -(transform[axis] / transform.k / this.ctx.unitDist) * sign;
		//console.log("updateRegion::transform:", pos, -transform.x, transform.k,  this.ctx.unitDist)
		//pos = -transform.x;
		var box = this.graphHolder.getBoundingClientRect();
		let range = Math.ceil(box[size] / transform.k / this.ctx.unitDist);

		//if(Math.round(this._last_pos/3) != Math.round(pos/3) || this._last_range != range) {
			this._last_pos = pos;
			this._last_range = range;
			// console.log("regionUpdateSink_", pos)
			this.regionUpdateSink_({pos, range, transform,box});
		//}
	}

	filterCenterByTransform(t, v) {
		t.x += v.cX * 0.01;
		t.y += v.cY * 0.01;
	}

	updateTracking() {
		if(this.ctx && this.ctx.lastBlockData && this.ctx.track) {
			const ts = Date.now();
			// let delta = (ts - this.ctx.lastBlockDataTS) / 1000;
			// if(delta > 1.0)
			// 	delta = 1.0;
			// delta = 1.0 - delta;
			//delta = 1.0;

			let { k } = this.paintEl.transform;
			
			this.centerBy(this.ctx.lastBlockData.blockHash, { filter : (t,v) => {
				
				let X_ = Math.abs(v.cX / k / this.ctx.unitDist);
				let Y_ = Math.abs(v.cY / k / this.ctx.unitDist);

				let delta = 0.015;
				if(X_ > 256 || Y_ > 256)
					delta = 0.75;
				else
				// if(X_ > 16 || Y_ > 16)
				// 	delta = 0.05;
				// else
				if(X_ > 16 || Y_ > 16)
					delta = 0.05;

				//let n = 1/k;
				//delta *= n*n*1.5; console.log(k,delta);
			
				t.x += v.cX * delta; //0.0075;// * delta;
				t.y += v.cY * delta; //0.0075;// * delta;
			}, offsetX : 0.1 } );
		}
		else if(this.focusTargetHash) {

			let { k } = this.paintEl.transform;

			this.centerBy(this.focusTargetHash, { filter : (t,v) => {
				// console.log('???',v.cX,k,t.x,t.y);
				let X_ = Math.abs(v.cX / k / this.ctx.unitDist);
				let Y_ = Math.abs(v.cY / k / this.ctx.unitDist);
				if(X_ < 1e-1 && Y_ < 1e-1) {
					delete this.focusTargetHash;
					window.app.enableUndo(true);
				}

				let delta = 0.45;
				t.x += v.cX * delta; //0.0075;// * delta;
				t.y += v.cY * delta; //0.0075;// * delta;
			}, offsetX : 0 } );

		}

	}

	highlightLinks(links, highlight, node) {
		links.forEach((link)=>{ 
			link.highlight(highlight, node); 
		});
	}

	createIdx(node) {
		const idx = this.ctx.getIdx(node);
		if(!this.locationIdx[idx])
			this.locationIdx[idx] = [ ]
		this.locationIdx[idx].push(node);

		this.locationIdx[idx].sort((a,b) => {
			return a.detsalt - b.detsalt;
		})
	}

	removeIdx(node) {
		const idx = this.ctx.getIdx(node);
		if(this.locationIdx[idx]) {
			this.locationIdx[idx] = this.locationIdx[idx].filter((block) => {
				return block.data.blockHash != node.data.blockHash;
			});

			if(!this.locationIdx[idx].length)
				delete this.locationIdx[idx];
		}
	}

	selectNode(node) {
		node.select();
	}
	
	setFocusTargetHash(hash) {
		this.focusTargetHash = hash;
		this.simulation.restart();
		window.app.enableUndo(false);
	}
}

// Register the element with the browser
DAGViz.register();