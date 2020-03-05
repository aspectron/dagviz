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
    	.attr("class", "hexagon-a")

    var path = node.append("path")
        .attr("d", hexagon(data(0, 0)))
		.attr("stroke", D3x.rgba([0,0,0], 0.5))
        .attr("fill", D3x.rgba(o.rgba))

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

    var path = node.append("path")
        .attr("d", hexagon(data(0, 0)))
        .attr("stroke", D3x.rgba(o.rgba, 0.9))
        .attr("fill", o.rgba)

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

	const size = o.size;
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

    var path = node.append("path")
        .attr("d", hexagon(data(0, 0)))
        .attr("stroke", D3x.rgba(o.rgba, 0.9))
        .attr("fill", o.rgba)

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

	let size = o.size;
	let root = el.append('svg:g')
				.attr('opacity',1)
	let node = root.append('svg:rect')
		.attr('opacity',1)
        .attr('x',-size)
        .attr('y',-size)
        .attr('width', size*2)
        .attr('height', size*2)
		//.attr('height', 0)// size*2)
		//.attr('opacity',0)
		//.attr('opacity',0.85)
        //.attr('fill', o.rgba)//D3x.rgba(o.rgba))
        //.attr('fill', o.pattern ) // D3x.rgba(o.rgba))
        .attr('fill', o.rgba) // D3x.rgba(o.rgba))
		//.attr('fill', o.pattern ? `url(#${o.pattern})` : o.rgba) // D3x.rgba(o.rgba))
		//.attr('fill', o.pattern ? `url(#${o.pattern})` : o.rgba) // D3x.rgba(o.rgba))
		//.attr('fill', o.rgba) // D3x.rgba(o.rgba))
        .attr("stroke", D3x.rgba([0,0,0], 0.5))
		//.attr("stroke-width", 1)
		//.attr('class',['block'])

	if(o.strokeWidth)
		node.attr('stroke-width', o.strokeWidth);


	let pattern = null;

	if(o.pattern) {
		pattern = root.append('svg:rect')
			.attr('x',-size)
			.attr('y',-size)
			.attr('width', size*2)
			.attr('height', size*2)
			.attr('opacity', o.patternOpacity || 0.125)
			.attr('fill', `url(#${o.pattern})`)
	}

    root.setPosition = (x, y)=>{

		/*
		if(isNaN(x) || isNaN(y)) {
			console.log('error: invalid coordinates:',x,y);
			return root;
		}
		*/

    	return root;
	}
	
    root.setFill = (fn)=>{
		node.attr("fill", fn());
		return root;
	}

	root.setSelected = (selected)=>{
		if(!selected){
			if(root.selector){
				root.selector.remove();
				delete root.selector;
			}
			return
		}
		if(root.selector)
			return
		root.selector = root.append('svg:path')
			.attr("d", d3.arc()
				.innerRadius( size*2 )
				.outerRadius( size*2+10 )
				.startAngle( 0 )//It's in radian, so Pi = 3.14 = bottom.
				.endAngle( 6.29 )//2*Pi = 6.28 = top
			)
			.attr('stroke', 'rgba(0,0,0,0.5)')
			.attr('stroke-width', 1)
			.attr('fill', `rgba(0,0,0,0.5)`);
	}

	root.setSelected(o.selected);
	

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
		this.el = holder.linksEl.append("g");
		this.el.path = this.el.append("path");
		this.el.path.style('opacity', 0).style('fill', 'none');
		//this.el.attr("marker-end", "url(#endarrow)");
		this.source = holder.nodes[data.child];
		this.target = holder.nodes[data.parent];
		this.target.addParentLink(this);
		this.target.attachNode();
		this.linkIndex = 0;//holder.getNodeSortedIndex(this.source);

		if((this.source && this.source.data.isChainBlock) && (this.target && this.target.data.isChainBlock)) {
			this.isChainBlockLink = true;
			this.defaultColor = 'rgba(0,32,64,1)';
			this.defaultStrokeWidth = 7;
			this.defaultOpacity = 0.95;
		} else 
		{
			this.defaultColor = 'black';
			this.defaultStrokeWidth = 1;
			this.defaultOpacity = 0.65;
		}

		if(this.holder.ctx.quality == 'low')
			this.defaultOpacity = 1;

		this.el.path.transition().duration(1000)
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
		const { source, target } = this;
		if(!source || !target){
			//console.log("this.source", this.data.child)
			return
		}
		//if(isNaN(this.target.x)){
		//	console.log("this.target", this.target.data.blockHash, this.target.x)
		//}
		//if(!isNaN(this.source.x) && !isNaN(this.source.y) && !isNaN(this.target.x) && !isNaN(this.target.y)) {
			this.el.path
				//.transition('o')
				//.duration(2000)
				.attr("d", this.buildD(
					source.x,
					source.y,
					target.x,
					target.y
				))
				//.attr('stroke-width', this.isChainBlockLink ? 7 : 1);
		//}

		//this.el.transition().duration(1000).style('opacity', 1);

		if(this.arrowType == this.holder.ctx.arrows+this.holder.ctx.dir)
			return
		this.arrowType = this.holder.ctx.arrows+this.holder.ctx.dir;
		if(this.holder.ctx.arrows == 'multi') {
			this.updateArrow();
		}else{
			this.removeArrow();
		}
	}
	
	updateArrow() {
		let dir = this.holder.ctx.dir.toLowerCase();
		this.el.path.attr("marker-end", this.isChainBlockLink?`url(#endarrowsm-${dir})`:`url(#endarrow-${dir})`)
	}

	removeArrow() {
		this.el.path.attr("marker-end", null)
	}
	buildD(x1, y1, x2, y2) {
		const {h, sign} = this.holder.ctx.direction;
		const {arrows} = this.holder.ctx;
		if(arrows != 'off') {
			let tSize = this.target.data.size+(this.target.data.isChainBlock?9:6)
			const sSize = this.source.data.size
			let boxHSize = tSize;
			const margin = (boxHSize*2)/(this.target.parentLinks.length+1);
				
			if(arrows=="single")
				tSize += 15;
			else if(this.isChainBlockLink)
				tSize += 1;

			if(h){
				x1 -= sSize * sign
				x2 += tSize * sign
				if(arrows=="multi"){
					//console.log("this.linkIndex", this.linkIndex, this.el.node())
					y2 += (this.linkIndex * margin) - boxHSize + margin;
				}
			}else{
				y1 -= sSize * sign
				y2 += tSize * sign
				if(arrows=="multi")
					x2 += (this.linkIndex * margin) - boxHSize + margin;
			}
		}
		if(!this.curves)
			return `M${x1},${y1} ${x2},${y2}`;
		return this.holder.ctx.nodeLinkCurveData(x1, y1, x2, y2, this, this.holder);
		//let xx = x1+(x2-x1)*0.5;
		//return `M${x1},${y1} C${xx},${y1} ${xx},${y2} ${x2},${y2}`;
	}
	setStaticPosition(x, y, x2, y2){
		if(typeof(x2) == 'undefined' || typeof(y2) == 'undefined'){
			if(!this.target)
				return
			x2 = this.target.x;
			y2 = this.target.y;
		}
		if(!isNaN(x) && !isNaN(y) && !isNaN(x2) && !isNaN(y2)) {
			this.el.path
				.attr("d", this.buildD(x, y, x2, y2));

			this.updateArrow();
		}
	}

	highlight(color, node) {

		let stroke = this.defaultColor;
		let strokeWidth = this.defaultStrokeWidth;
		if(color) {
			if(this.isChainBlockLink) {
				strokeWidth = 7;
				if(this.source.selected && this.target.selected)
					stroke = 'blue';
			}
			else
			if(this.source.selected && this.target.selected){
				stroke = 'blue';
				strokeWidth = 5;
			}
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
			.attr('stroke-width', strokeWidth)
	}
}

export class GraphNode{
	constructor(holder, data){
		this.holder = holder;
		this.data 	= data;
		this.id 	= data.id || data.name;
		this.tOffset = 0;
		holder.nodes[this.id] = this;
		this.parentLinks = [];
		this.selected = false;
		this.x = 0;
		this.y = 0;

		this.holder.createIdx(this);
		this.attachNode();
	}
	set x(value){
		if(isNaN(value))
			throw new Error("isNaN isNaN isNaN isNaN isNaN isNaN")
		this._x = value;
	}
	get x(){
		return this._x;
	}

	set y(value){
		if(isNaN(value))
			throw new Error("isNaN isNaN isNaN isNaN isNaN isNaN")
		this._y = value;
	}
	get y(){
		return this._y;
	}

	set vx(value){
		if(isNaN(value))
			throw new Error("isNaN isNaN isNaN isNaN isNaN isNaN")
		this._vx = value;
	}
	get vx(){
		return this._vx;
	}

	set vy(value){
		if(isNaN(value))
			throw new Error("isNaN isNaN isNaN isNaN isNaN isNaN")
		this._vy = value;
	}
	get vy(){
		return this._vy;
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
			return this.bindElEvents();
		}

		this.initElements();
		return this;
	}
	rebuildLinks() {
		this.removeLinks();
		this.buildLinks();
	}
	buildLinks(){
		let {data, holder} = this;
		if(!data.parentBlockHashes || !data.parentBlockHashes.length){
			this.removeLinks();
		}else{
			this.createLinks(data.parentBlockHashes);
		}
		return this.linkNodes;
	}
	createLinks(parents){
		if(this.partialLinks) {
			this.removeLinks();
		}else if(this.linkNodes)
			return;

		this.partialLinks = false; 
		this.linkNodes = parents.map(parent => {
			if(!this.holder.nodes[parent]){
				this.partialLinks = true;
				return null;
			}
			return new GraphNodeLink(this.holder, {child:this.id, parent});
		}).filter(nl=>nl);
		if(this.selected)
			this.highlightLinks(true);
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
			}).filter(v=>v);

			if(!this.linkNodes.length)
				delete this.linkNodes;
		}
	}
	remove(){
		this.removeElEvents();
		this.el.remove();
		if(this.textEl)
			delete this.textEl;
		if(this.heightEl)
			delete this.heightEl;
		this.removeLinks();

		this.parentLinks.forEach(link=>link.remove());
		this.parentLinks=[];

		this.removeArrowHead();
		this.holder.removeIdx(this);
	}
	initPosition(){
		let {x, y} = this;
		this.el.setPosition(x, y);
		if(this.linkNodes)
			this.linkNodes.forEach(node => node.setStaticPosition(x, y));	
	}
	initElements(){
		let shapeConfig = this.getShapeConfig();
		let zoom = this.holder.paintEl.transform.k
		const data = this.data;
		const isBlue = !!data.acceptingBlockHash;
		const isRed = !isBlue;
		if(isBlue)
			data.color = `rgba(194,244,255,0.99)`;
		else
			data.color = `rgba(255,194,194,0.99)`;

		this.shape 	= data.shape;
		this.color 	= data.color;
		this.size 	= data.size;
		this.quality = this.holder.ctx.quality;

		this.removeElEvents();
		if(this.el)
			this.el.remove();

		let pattern = null;
		let patternOpacity = 0.125;
		if(this.holder.ctx.quality == 'high') {
			if(isRed) {
				//pattern = 'crosshatch';
				pattern = 'diagonal-stripe-1';
				patternOpacity = 0.125;
			}
		}
		

        this.el = D3x.createShape(this.holder.nodesEl, shapeConfig.shape, {
            size : data.size || 50,
            rgba : data.color || shapeConfig.color,
			opacity : 0.5,
			pattern, patternOpacity,
			strokeWidth : data.isChainBlock ? 7 : 1,
			selected : this.selected
		})

		this.el.setFill(()=>{
			return this.data.color;
		})

		const textColor = data.textColor || '#000';

		if(this.textEl)
	        this.textEl.remove();

		if(this.quality != 'low') {
			this.textEl = this.el.append("text")
		    	.attr("class", "node-text")
				.attr("fill", textColor)
				.attr("class", ["node-name", this.data.type].join(' '))
				.text(data.name);

			let textBox = this.textEl.node().getBoundingClientRect();
			this.textEl
				.attr("x", -textBox.width/zoom/2)
				.attr("y", -8)
				.attr("opacity", 1)
		}else{
			delete this.textEl;
		}

		if(this.heightEl)
			this.heightEl.remove();

		if(this.quality == 'high') {
			this.heightEl = this.el.append("text")
				.attr("class", "node-text")
				.attr("fill", textColor)
				.attr("class", ["node-name", this.data.type].join(' '))
				.text(data.blueScore+'');
			let textBox = this.heightEl.node().getBoundingClientRect();
			this.heightEl
				.attr("x", -textBox.width/zoom/2)
				.attr("y", 14)
		}else{
			delete this.heightEl;
		}

		this.bindElEvents();

		this.el
			.style('opacity', 0)
			.transition()
			.duration(500)
			.style('opacity', 1);

		if(this.selected)
			this.highlightLinks(true);
	}
	updateStyle(force){
		//if(isNaN(this.x) || isNaN(this.y) || !this.data.timestamp) {
			// console.log("aborting updateStyle (lack of data) for:",this);
		//	return
		//}

		/*
		const typeColors = {
			'kaspad' : "#b3ffc1",
			'simulator' : "#feffb3",
			'txgen' : "#fbb3ff",
			'server' : "#b3fffc",
			'syncd' : "#b3ffb3"
		}
		*/

		const isBlue = !!this.data.acceptingBlockHash;
		const data = this.data;

		if(isBlue)
			data.color = `rgba(194,244,255,0.99)`;
		else
			data.color = `rgba(255,194,194,0.99)`;

		if(force || data.shape != this.shape || data.color != this.color || data.size != this.size || this.quality != this.holder.ctx.quality) {
			this.initElements();
	    }

		if(this.holder.ctx)
			this.holder.ctx.nodePosition(this, this.holder, this.holder.nodes);

		this.el
			.style('transform', `translate(${this.x}px, ${this.y}px)`)
		if(this.holder.ctx.arrows == "multi")
			this.updateLinkIndexes();
		this.updateArrowHead();	
		if(this.linkNodes)
			this.linkNodes.forEach(node=>node.updateStyle());
		this.parentLinks.forEach(link=>link.updateStyle())
	}
	addParentLink(link){
		if(this.parentLinks.indexOf(link)<0){
			this.parentLinks.push(link);
			this.updateArrowHead();
		}
	}
	removeParentLinks(link){
		let index = this.parentLinks.indexOf(link)
		if(index>-1){
			this.parentLinks.splice(index, 1);
			this.updateArrowHead();
		}
	}

	updateLinkIndexes(){
		let links = this.parentLinks;
		if(this.holder.ctx.direction.h)
			links = links.sort((a, b)=>{
				return a.source.y-b.source.y;
			})
		else
			links = links.sort((a, b)=>{
				return a.source.x-b.source.x;
			})
		links.forEach((link, index)=>{
			link.linkIndex = index;
		})
	}
	updateArrowHead(){
		const {arrows, dir} = this.holder.ctx;
		if(!this.parentLinks.length || arrows != 'single')
			return this.removeArrowHead();

		if(!this.el.arrow){
			this.el.arrow = this.el.append('polygon')
				.attr("fill", "#000").attr('stroke', "#000");
		}
		let arrow = this.el.arrow;
		if(arrow._type == arrows+dir)
			return
		
		arrow._type = arrows+dir
		const {h, sign} = this.holder.ctx.direction;
		let dist = (this.data.size+(this.data.isChainBlock?4:1))*sign;
		if(h){
			arrow.attr("points", `${dist} 0, ${dist+20*sign} -6, ${dist+20*sign} 6`);
		}else{
			arrow.attr("points", `0 ${dist}, -6 ${dist+20*sign}, 6 ${dist+20*sign}`);
		}
	}
	removeArrowHead(){
		if(this.el.arrow){
			this.el.arrow.remove();
			delete this.el.arrow
		}
	}

	getLinks() {
		return (this.linkNodes || []).concat(this.parentLinks);
	}

	onNodeClick(e) {
		if (d3.event.defaultPrevented)
			return
		this.holder.onNodeClick(this, d3.event);
	}
	onNodeHover(){
		this.holder.highlightLinks(this.linkNodes || [], 'green', this);
		this.holder.highlightLinks(this.parentLinks, 'red', this);

		const { data } = this;

		if(!this.$info)
			this.$info = $("#info");
		this.$info.html(`
		<table class='block-info-tip'>
			<tr>
				<td>
					<i class="fa fal fa-cube"></i> 
				</td>
				<td>
				<span class="caption">Block Hash:</span> <span class="value">${data.blockHash}</span><br/>
				<span class="caption">Timestamp:</span> <span class="value">${this.getTS(new Date(data.timestamp*1000))}</span>&nbsp;
				<span class="caption">Version:</span> <span class="value">${data.version}</span>&nbsp;
				<span class="caption">Bits:</span> <span class="value">${data.bits}</span><br/>
				<span class="caption">Blue Score:</span> <span class="value">${data.blueScore}</span>&nbsp;
				<span class="caption">Mass:</span> <span class="value">${data.mass}</span>&nbsp;
				<span class="caption">Nonce:</span> <span class="value">${data.nonce}</span>&nbsp;
				<span class="caption">SPC:</span> <span class="value">${data.isChainBlock}</span>
		
				</td>
			</tr>
		</table>
		`);
		if(this.nodeInfoEl)
			this.nodeInfoEl.addClass('focus');

	}

	highlightLinks(highlight = true) {
		if(highlight) {
			this.holder.highlightLinks(this.linkNodes || [], 'green', this);
			this.holder.highlightLinks(this.parentLinks, 'red', this);
		}else {
			this.holder.highlightLinks(this.getLinks(), null, this);
		}
	}

	onNodeOut(){
		if(this.nodeInfoEl)
			this.nodeInfoEl.removeClass('focus');

		this.$info.html('');

		if(!this.selected)
			this.holder.highlightLinks(this.getLinks(), null, this);
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
		this.remove();
		let index = this.holder.simulationNodes.indexOf(this);
		if(index > -1)
			this.holder.simulationNodes.splice(index, 1);
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

		if(!this.selected)
			delete this.holder.selection[this.data.blockHash];
		else
			this.holder.selection[this.data.blockHash] = this;

		this.holder.ctx.onSelectionUpdate(this.holder.selection);
		this.el.setSelected(this.selected);

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
			.svg-patterns{position:absolute}

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
		<div class="svg-patterns">
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="diagonal-stripe-1" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzEnLz4KPC9zdmc+Cg==" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>		
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="diagonal-stripe-2" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzInLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>
		<svg height="8" width="8" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="crosshatch" patternUnits="userSpaceOnUse" width="8" height="8"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnPgogIDxyZWN0IHdpZHRoPSc4JyBoZWlnaHQ9JzgnIGZpbGw9JyNmZmYnLz4KICA8cGF0aCBkPSdNMCAwTDggOFpNOCAwTDAgOFonIHN0cm9rZS13aWR0aD0nMC41JyBzdHJva2U9JyNhYWEnLz4KPC9zdmc+Cg==" x="0" y="0" width="8" height="8"> </image> </pattern> </defs> </svg>
		<svg height="6" width="6" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="whitecarbon" patternUnits="userSpaceOnUse" width="6" height="6"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyB3aWR0aD0nNicgaGVpZ2h0PSc2Jz4KICA8cmVjdCB3aWR0aD0nNicgaGVpZ2h0PSc2JyBmaWxsPScjZWVlZWVlJy8+CiAgPGcgaWQ9J2MnPgogICAgPHJlY3Qgd2lkdGg9JzMnIGhlaWdodD0nMycgZmlsbD0nI2U2ZTZlNicvPgogICAgPHJlY3QgeT0nMScgd2lkdGg9JzMnIGhlaWdodD0nMicgZmlsbD0nI2Q4ZDhkOCcvPgogIDwvZz4KICA8dXNlIHhsaW5rOmhyZWY9JyNjJyB4PSczJyB5PSczJy8+Cjwvc3ZnPg==" x="0" y="0" width="6" height="6"> </image> </pattern> </defs> </svg>
		<svg height="5" width="5" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="smalldot" patternUnits="userSpaceOnUse" width="5" height="5"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgo8cmVjdCB3aWR0aD0nNScgaGVpZ2h0PSc1JyBmaWxsPScjZmZmJy8+CjxyZWN0IHdpZHRoPScxJyBoZWlnaHQ9JzEnIGZpbGw9JyNjY2MnLz4KPC9zdmc+" x="0" y="0" width="5" height="5"> </image> </pattern> </defs> </svg>
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="circles-1" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSJ3aGl0ZSIgLz4KICA8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iYmxhY2siLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>						
		<svg height="5" width="5" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="lightstripe" patternUnits="userSpaceOnUse" width="5" height="5"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgogIDxyZWN0IHdpZHRoPSc1JyBoZWlnaHQ9JzUnIGZpbGw9J3doaXRlJy8+CiAgPHBhdGggZD0nTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVonIHN0cm9rZT0nIzg4OCcgc3Ryb2tlLXdpZHRoPScxJy8+Cjwvc3ZnPg==" x="0" y="0" width="5" height="5"> </image> </pattern> </defs> </svg>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 100" fill="#000">
			<defs>
			    <marker id="startarrow" markerWidth="10" markerHeight="7" 
			    	refX="10" refY="3.5" orient="auto">
			      <polygon points="10 0, 10 7, 0 3.5"/>
			    </marker>
			    <marker id="endarrow-e" markerWidth="6" markerHeight="6" 
			    	refX="6" refY="3">
			        <polygon points="6 6, 0 3, 6 0"/>
			    </marker>
			    <marker id="endarrow-w" markerWidth="6" markerHeight="6" 
			    	refX="0" refY="3">
			        <polygon points="0 0, 6 3, 0 6"/>
			    </marker>
			    <marker id="endarrow-n" markerWidth="6" markerHeight="6" 
			    	refX="3" refY="0">
			        <polygon points="0 0, 6 0, 3 6"/>
			    </marker>
			    <marker id="endarrow-s" markerWidth="6" markerHeight="6" 
			    	refX="3" refY="6">
			        <polygon points="3 0, 6 6, 0 6"/>
			    </marker>
			    <marker id="endarrowsm-e" markerWidth="2" markerHeight="2" 
			    	refX="1" refY="1">
			        <polygon points="2 2, 0 1, 2 0"/>
			    </marker>
			    <marker id="endarrowsm-w" markerWidth="2" markerHeight="2" 
			    	refX="1" refY="1">
			        <polygon points="0 0, 2 1, 0 2"/>
			    </marker>
			    <marker id="endarrowsm-n" markerWidth="2" markerHeight="2" 
			    	refX="1" refY="1">
			        <polygon points="0 0, 2 0, 1 2"/>
			    </marker>
			    <marker id="endarrowsm-s" markerWidth="2" markerHeight="2" 
			    	refX="1" refY="1">
			        <polygon points="1 0, 2 2, 0 2"/>
			    </marker>
		  </defs>
		</svg>
		</div>
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
		//this.simulation.nodes(this.simulationNodes)
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


			//.velocityDecay(0.45)
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
			//this.simulation.alphaTarget(0.005);
			this.simulation.alphaDecay(0.001);
		}
		//this.simulation.alpha(0.005);
		//this.simulation.alpha(0.01);

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
		const {sign, axis} = this.ctx.direction;
		let pos = -(transform[axis] / transform.k / this.ctx.unitDist) * sign;

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

		// if(!this.$position)
		// 	this.$position = $("#info");
		// this.$position.html(`Pos: ${pos.toFixed(1)}`);
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
		//console.log("axis", axis, this.ctx.direction)
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

			this.ctx.disableTracking();

			let { k } = this.paintEl.transform;

			this.centerBy(this.focusTargetHash, { filter : (t,v) => {
				// console.log('???',v.cX,k,t.x,t.y);
				let X_ = Math.abs(v.cX / k / this.ctx.unitDist);
				let Y_ = Math.abs(v.cY / k / this.ctx.unitDist);
				if(X_ < 1e-1 && Y_ < 1e-1) {
					delete this.focusTargetHash;
					window.app.enableUndo(true);
					window.app.updatePosition();
				}

				let delta = 0.45;
				if(X_ < 7 && Y_ < 7) {
					delta = 0.3;
				}
				
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
			this.locationIdx[idx] = [ ];
		const l = this.locationIdx[idx];
		l.push(node);

		l.sort((a,b) => {
			return a.detsalt - b.detsalt;
		});

		if(l.length > 2) {
			let t = Math.round(l.length/2-0.5);
			for(let i = 0; i < l.length; i++)
				if(l[i].data.isChainBlock) {
					if(t == i)
						break;
					// console.log(i,'->',t,'/',l.length);
					let v = l[t];
					l[t] = l[i];
					l[i] = v;
					break;
				}
		}
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
		//this.simulation.restart();
		this.restartSimulation();
		window.app.enableUndo(false);
	}
}

// Register the element with the browser
DAGViz.register();