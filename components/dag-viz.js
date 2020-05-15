// Import BaseElement base class and html helper function
import { html, BaseElement, css, render, svg} from './base-element.js';
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
        .attr("stroke", 'var(--graph-square-stroke)')
		//.attr("stroke-width", 1)
		//.attr('class',['block'])
	root.blockBox = node;

	if(o.strokeWidth)
		node.attr('stroke-width', o.strokeWidth);


	let pattern = null;

	if(o.pattern) {
		pattern = root.append('svg:rect')
			.attr('x',-size)
			.attr('y',-size)
			.attr('width', size*2)
			.attr('height', size*2)
			.attr("stroke", 'var(--graph-square-stroke)')
			.attr('opacity', o.patternOpacity || 0.125)
			.attr('fill', `url(#${o.pattern})`)
		if(o.strokeWidth)
			pattern.attr('stroke-width', o.strokeWidth);
	}

    root.setPosition = (x, y)=>{

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
			.attr('stroke', 'var(--graph-node-selector-stroke)')
			.attr('stroke-width', 1)
			.attr('fill', 'var(--graph-node-selector-fill)');
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
		this.el = holder.linksEl.append("path");
		this.el.path = this.el;//this.el.append("path");
		this.el.path.style('opacity', 0).style('fill', 'none');
		//this.el.attr("marker-end", "url(#endarrow)");
		this.source = holder.nodes[data.child];
		this.target = holder.nodes[data.parent];
		this.target.addParentLink(this);
		this.target.attachNode();
		this.linkIndex = 0;//holder.getNodeSortedIndex(this.source);
		this.isTealing = false;

		if((this.source && this.source.data.isChainBlock) && (this.target && this.target.data.isChainBlock)) {
			this.isChainBlockLink = true;
			this.defaultColor = 'var(--graph-node-link-default-color-1)';
			this.defaultStrokeWidth = 4;
			this.defaultOpacity = 0.95;
		} else 
		{
			this.defaultColor = 'var(--graph-node-link-default-color-2)';
			this.defaultStrokeWidth = 2;
			this.defaultOpacity = 0.65;
		}

		if(this.holder.ctx.quality == 'low')
			this.defaultOpacity = 1;

		this.el.path.transition().duration(1000)
			.attr('stroke', this.defaultColor)
			.attr('stroke-width', this.holder.buildStrokeWidth(this.defaultStrokeWidth) )
			.style('opacity', this.defaultOpacity);
	}
	remove(){
		this.el.remove();
		//delete this.holder.links.parent[this.data.parent];
		if(this.source.linkNodes)
			this.source.linkNodes = this.source.linkNodes.filter(l=>l!=this)
		this.target.removeParentLinks(this);
		// TODO - should we check/remove children?
	}
	updateStyle(){
		const { source, target } = this;
		if(!source || !target){
			return
		}
		this.el.path
			.attr("d", this.buildD(
				source.x,
				source.y,
				target.x,
				target.y
			))

		if(this.arrowType == this.holder.ctx._arrows+this.holder.ctx.dir)
			return
		this.arrowType = this.holder.ctx._arrows+this.holder.ctx.dir;
		this._updateArrow(this._lastArrowType || "");
	}

	_updateArrow(type=""){
		this._lastArrowType = type;
		if(this.holder.ctx._arrows == 'multi') {
			this.updateArrow(type);
		}else{
			this.removeArrow();
		}
	}
	
	updateArrow(type="") {
		let dir = this.holder.ctx.dir.toLowerCase();
		if(this.holder.ctx.arrows == "multir")
			dir = 'w'
		this.el.path.attr("marker-end", this.isChainBlockLink?`url(#endarrowsm-${dir}${type})`:`url(#endarrow-${dir}${type})`)
	}

	removeArrow() {
		this.el.path.attr("marker-end", null)
	}
	buildD(x1, y1, x2, y2) {
		const {h, sign} = this.holder.ctx.direction;
		const {_arrows:arrows} = this.holder.ctx;
		if(arrows != 'off') {
			let tSize = this.target.data.size+(this.target.data.isChainBlock?8:6)
			const sSize = this.source.data.size
			let boxHSize = tSize;
			const margin = (boxHSize*2)/(this.target.parentLinksLength+1);
				
			if(arrows=="single")
				tSize += 15;
			else if(this.isChainBlockLink)
				tSize += 1;

			if(h){
				x1 -= sSize * sign;
				x2 += tSize * sign;
				x1 = Math.round(x1);
				x2 = Math.round(x2);
				if(arrows=="multi"){
					y2 += (this.linkIndex * margin) - boxHSize + margin;
					y2 = Math.round(y2)
				}
			}else{
				y1 -= sSize * sign;
				y2 += tSize * sign;
				y1 = Math.round(y1);
				y2 = Math.round(y2);
				if(arrows=="multi"){
					x2 += (this.linkIndex * margin) - boxHSize + margin;
					x2 = Math.round(x2)
				}
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

	highlight(color, node, isTealing=false) {
		//isTealing = isTealing || !!this.source.parentLinks.find(l=>l.isTealing);
		//console.log('highlight arrows ->', node);
		//console.log('source:',this.source.data.blockHash, this.source.data.acceptingBlockHash)
		//console.log('target:',this.target.data.blockHash, this.target.data.acceptingBlockHash)
		let stroke = this.defaultColor;
		let strokeWidth = this.holder.buildStrokeWidth(this.defaultStrokeWidth);
		let arrowType = '';
		//if(color) {
			if(this.isChainBlockLink) {
				strokeWidth = 7;
				if(this.source.selected && this.target.selected){
					stroke = 'var(--graph-link-selected-color)';
					arrowType = '-selected';
				}
			}
			else
			if(this.source.selected && this.target.selected){
				stroke = 'var(--graph-link-selected-color)';
				strokeWidth = 5;
				arrowType = '-selected';
			}
			else
			if((isTealing || this.source.selected) && this.source.data.blockHash == this.target.data.acceptingBlockHash){
				stroke = 'var(--graph-link-tealing-color)';
				strokeWidth = 3;
				isTealing = true;
				arrowType = '-teal';
			}
			else if(color){
				if(node.selected)
					stroke = this.defaultColor;
				else {
					strokeWidth = 2;
				}
			}
		//}

		if(this.isTealing != isTealing){
			this.isTealing = isTealing;
			(this.target.linkNodes || []).forEach(l=>{
				dpc(100, ()=>{
					if(l.target.data.acceptingBlockHash)
						l.highlight(false, l.source, isTealing);
				})
				
			});
		}

		this.el.path.transition()
			.duration(200)
			.style('opacity', (color || isTealing) ? 1 : this.defaultOpacity)
			.attr('stroke', stroke)
			// .attr('stroke', color ? (this.isChainBlockLink ? (color == 'red' ? 'rgba(92,0,0,1)' : 'rgba(0,48,0,1)') : color) : this.defaultColor)
			.attr('stroke-width', strokeWidth)

		this._updateArrow(arrowType)
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
		    "unknown" : { shape : 'circle', rgba : 'var(--graph-shape-unknown-color)' },
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
		if(isBlue){
			data.color = 'var(--graph-color-a-1)';
			data.highlightColor_before = 'var(--graph-color-a-2)'
			data.highlightColor = 'var(--graph-color-a-3)'
			data.highlightColor_after = 'var(--graph-color-a-4)'
		}
		else{
			data.color = 'var(--graph-color-b-1)';
			data.highlightColor_before = 'var(--graph-color-b-2)'
			data.highlightColor = 'var(--graph-color-b-3)'
			data.highlightColor_after = 'var(--graph-color-b-4)'
		}

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
			strokeWidth : data.isChainBlock ? 5 : 1,
			selected : this.selected
		})

		this.el.setFill(()=>{
			return this.data.color;
		})

		const textColor = data.textColor || 'var(--graph-node-text-color)';

		if(this.textEl)
	        this.textEl.remove();

		if(this.quality != 'low') {
			this.textEl = this.el.append("text")
		    	.attr("class", "node-text")
				.attr("stroke", textColor)
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
				.attr("stroke", textColor)
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

		/*
		this.el
			.style('opacity', 0.5)
			.transition()
			.duration(10)
			.style('opacity', 1);
		*/

		if(this.selected)
			this.highlightLinks(true);
	}
	updateStyle(force){
		const isBlue = !!this.data.acceptingBlockHash;
		const data = this.data;

		if(isBlue)
			data.color = 'var(--graph-color-a-5)';
		else
			data.color = 'var(--graph-color-b-5)';

		if(force || data.shape != this.shape || data.color != this.color || data.size != this.size || this.quality != this.holder.ctx.quality) {
			this.initElements();
	    }

		if(this.holder.ctx)
			this.holder.ctx.nodePosition(this, this.holder, this.holder.nodes);

		this.el
			.style('transform', `translate(${this.x}px, ${this.y}px)`)
		if(this.holder.ctx._arrows == "multi")
			this.updateLinkIndexes();
		this.updateArrowHead();	
		if(this.linkNodes)
			this.linkNodes.forEach(node=>{
				if(this.holder.ctx._arrows == "multi")
					node.target.updateLinkIndexes();
				node.updateStyle()
			});
		this.parentLinks.forEach(link=>link.updateStyle())
	}
	addParentLink(link){
		let index = this.parentLinks.findIndex(l=>l.data.child == link.data.child)
		if(index<0){
			this.parentLinks.push(link);
			this.updateArrowHead();
			this.updateLinkIndexes();
		}else{
			this.parentLinks.splice(index, 1, link);
			this.updateLinkIndexes();
		}
	}
	removeParentLinks(link){
		let index = this.parentLinks.findIndex(l=>l.data.child == link.data.child)
		if(index>-1){
			this.parentLinks.splice(index, 1);
			this.updateArrowHead();
			this.updateLinkIndexes();
		}
	}

	updateLinkIndexes(){
		let links = this.parentLinks;
		this.parentLinksLength = links.length;
		let {isChainBlock} = this.data;
		if(this.holder.ctx.direction.h)
			links = links.sort((a, b)=>{
				return a.source.y-b.source.y;
			})
		else
			links = links.sort((a, b)=>{
				return a.source.x-b.source.x;
			})
		if(this.holder.ctx.chainBlocksCenter == "fixed" && isChainBlock){
			let mid = Math.round(this.parentLinksLength/2);
			if(this.parentLinksLength%2 == 0){
				mid +=1;
				this.parentLinksLength += 1;
			}
			mid -= 1;
			let a = 1;
			links.forEach((link, index)=>{
				if(link.source.data.isChainBlock){
					link.linkIndex = mid;
					//console.log("link.linkIndex", link.linkIndex, link.el.node())
					return
				}
				link.linkIndex = index<mid?index:mid+a++;
			})
		}else{
			links.forEach((link, index)=>{
				link.linkIndex = index;
			})
		}
	}
	updateArrowHead(){
		const {_arrows:arrows, dir} = this.holder.ctx;
		if(!this.parentLinks.length || arrows != 'single')
			return this.removeArrowHead();

		if(!this.el.arrow){
			this.el.arrow = this.el.append('polygon')
				.attr("class", 'arrow-head')
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
		this.highlightConnectedBlocks(true);

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

	highlightConnectedBlocks(highlight){
		(this.linkNodes||[]).forEach(l=>{
			l.target.highlight(highlight, 'before');
		});
		this.parentLinks.forEach(l=>{
			l.source.highlight(highlight, 'after');
		});
		this.highlight(highlight);
	}
	highlight(highlight, type){
		let color = this.data.color;
		if(highlight) {
			const highlightColor = this.data[`highlightColor${type?'_'+type:''}`];
			color = highlightColor || '#f00';

		}
		this.el.blockBox
			.attr('fill', color)
			.transition().duration(500)
			.style("transform", highlight?"scale(1.1)":null)
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
		this.highlightConnectedBlocks(false)

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
		$('#selection').append(this.nodeInfoEl);

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
				border:1px solid var(--node-info-border-color);
				display:none;position:absolute;
				background-color:var(--node-info-bg-color);
				box-shadow:var(--node-info-box-shadow);
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
				border-bottom:1px solid var(--node-info-title-border-color);
			}
			.svg-patterns{position:absolute;top:-300vh}

			.arrow-head{
				stroke:var(--arrow-head-stroke);
				fill:var(--arrow-head-fill);
			}
			marker polygon{
				fill:var(--arrow-head-fill);
			}

			marker[id$="teal"] polygon{
				fill:var(--graph-link-tealing-color);
			}
			marker[id$="selected"] polygon{
				fill:var(--graph-link-selected-color);
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
		<div class="svg-patterns">
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="diagonal-stripe-1" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+PHBhdGggZD0iTTAsMTBMMTAsMCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>		
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="diagonal-stripe-2" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSd3aGl0ZScvPgogIDxwYXRoIGQ9J00tMSwxIGwyLC0yCiAgICAgICAgICAgTTAsMTAgbDEwLC0xMAogICAgICAgICAgIE05LDExIGwyLC0yJyBzdHJva2U9J2JsYWNrJyBzdHJva2Utd2lkdGg9JzInLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>
		<svg height="8" width="8" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="crosshatch" patternUnits="userSpaceOnUse" width="8" height="8"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc4JyBoZWlnaHQ9JzgnPgogIDxyZWN0IHdpZHRoPSc4JyBoZWlnaHQ9JzgnIGZpbGw9JyNmZmYnLz4KICA8cGF0aCBkPSdNMCAwTDggOFpNOCAwTDAgOFonIHN0cm9rZS13aWR0aD0nMC41JyBzdHJva2U9JyNhYWEnLz4KPC9zdmc+Cg==" x="0" y="0" width="8" height="8"> </image> </pattern> </defs> </svg>
		<svg height="6" width="6" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="whitecarbon" patternUnits="userSpaceOnUse" width="6" height="6"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHhtbG5zOnhsaW5rPSdodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rJyB3aWR0aD0nNicgaGVpZ2h0PSc2Jz4KICA8cmVjdCB3aWR0aD0nNicgaGVpZ2h0PSc2JyBmaWxsPScjZWVlZWVlJy8+CiAgPGcgaWQ9J2MnPgogICAgPHJlY3Qgd2lkdGg9JzMnIGhlaWdodD0nMycgZmlsbD0nI2U2ZTZlNicvPgogICAgPHJlY3QgeT0nMScgd2lkdGg9JzMnIGhlaWdodD0nMicgZmlsbD0nI2Q4ZDhkOCcvPgogIDwvZz4KICA8dXNlIHhsaW5rOmhyZWY9JyNjJyB4PSczJyB5PSczJy8+Cjwvc3ZnPg==" x="0" y="0" width="6" height="6"> </image> </pattern> </defs> </svg>
		<svg height="5" width="5" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="smalldot" patternUnits="userSpaceOnUse" width="5" height="5"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgo8cmVjdCB3aWR0aD0nNScgaGVpZ2h0PSc1JyBmaWxsPScjZmZmJy8+CjxyZWN0IHdpZHRoPScxJyBoZWlnaHQ9JzEnIGZpbGw9JyNjY2MnLz4KPC9zdmc+" x="0" y="0" width="5" height="5"> </image> </pattern> </defs> </svg>
		<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="circles-1" patternUnits="userSpaceOnUse" width="10" height="10"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSJ3aGl0ZSIgLz4KICA8Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0iYmxhY2siLz4KPC9zdmc+" x="0" y="0" width="10" height="10"> </image> </pattern> </defs> </svg>						
		<svg height="5" width="5" xmlns="http://www.w3.org/2000/svg" version="1.1"> <defs> <pattern id="lightstripe" patternUnits="userSpaceOnUse" width="5" height="5"> <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc1JyBoZWlnaHQ9JzUnPgogIDxyZWN0IHdpZHRoPSc1JyBoZWlnaHQ9JzUnIGZpbGw9J3doaXRlJy8+CiAgPHBhdGggZD0nTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVonIHN0cm9rZT0nIzg4OCcgc3Ryb2tlLXdpZHRoPScxJy8+Cjwvc3ZnPg==" x="0" y="0" width="5" height="5"> </image> </pattern> </defs> </svg>
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 350 100" fill="#000" id="markers">
			<defs>
				${
				['', '-teal', '-selected'].map(c=>svg`
			    <marker id="endarrow-e${c}" markerWidth="6" markerHeight="6" 
			    	refX="6" refY="3" markerUnits="userSpaceOnUse">
			        <polygon points="6 6, 0 3, 6 0"/>
			    </marker>
			    <marker id="endarrow-w${c}" markerWidth="6" markerHeight="6" 
			    	refX="0" refY="3" markerUnits="userSpaceOnUse">
			        <polygon points="0 0, 6 3, 0 6"/>
			    </marker>
			    <marker id="endarrow-n${c}" markerWidth="6" markerHeight="6" 
			    	refX="3" refY="0" markerUnits="userSpaceOnUse">
			        <polygon points="0 0, 6 0, 3 6"/>
			    </marker>
			    <marker id="endarrow-s${c}" markerWidth="6" markerHeight="6" 
			    	refX="3" refY="6" markerUnits="userSpaceOnUse">
			        <polygon points="3 0, 6 6, 0 6"/>
			    </marker>
			    <marker id="endarrowsm-e${c}" markerWidth="2" markerHeight="2" 
			    	refX="2" refY="1">
			        <polygon points="2 2, 0 1, 2 0"/>
			    </marker>
			    <marker id="endarrowsm-w${c}" markerWidth="2" markerHeight="2" 
			    	refX="0" refY="1">
			        <polygon points="0 0, 2 1, 0 2"/>
			    </marker>
			    <marker id="endarrowsm-n${c}" markerWidth="2" markerHeight="2" 
			    	refX="1" refY="0">
			        <polygon points="0 0, 2 0, 1 2"/>
			    </marker>
			    <marker id="endarrowsm-s${c}" markerWidth="2" markerHeight="2" 
			    	refX="-2" refY="1">
			        <polygon points="1 0, 2 2, 0 2"/>
			    </marker>`
			)}
		  </defs>
		</svg>
		</div>
		`;
	}
	buildStrokeWidth(strokeWidth){
		return strokeWidth;//Math.max(1, strokeWidth/this.paintEl.transform.k)
	}
	setArrowsOrient(orient){
		d3.select(this.renderRoot.getElementById('markers'))
			.selectAll('marker').attr('orient', orient)
	}
	firstUpdated() {
		this.graphHolder = this.renderRoot.getElementById('graph');
		let getBoundingClientRect = this.graphHolder.getBoundingClientRect;
		let graphHolderRect = getBoundingClientRect.call(this.graphHolder);
		this.graphHolder.getBoundingClientRect = ()=>{
			return graphHolderRect;
		}
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
		});
		this.nodeInfoEl.addEventListener('transitionend', (e)=>{
			this.debounce("nodeInfoEl-ts", ()=>{
				this.nodeInfoEl.style.pointerEvents = 'inherit';
			}, 100)
		});
		
		this.graphHolder.addEventListener('click', ()=>{
			
		})
		window.addEventListener("resize", ()=>{
			graphHolderRect = getBoundingClientRect.call(this.graphHolder);
		})
		this.initChart();
	}
	updated(changedProperties) {
		changedProperties.forEach((oldValue, propName) => {
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
    			this.setChartTransform(d3.event.transform)
    			let w = Math.max(0.01, 1/this.paintEl.transform.k)
    			this.nodesEl.attr("stroke-width", w);
    			this.nodesEl.attr("stroke", 'var(--graph-stroke)');
				this.linksEl.attr("stroke-width", w);
			})
			.on('start', (e)=>{
				window.app.enableUndo(false);
				window.app.ctls.track.setValue(false);
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
			//.attr("stroke-opacity", 0.6)
		this.svgLink = this.linksEl.selectAll("line")
		this.nodesEl = this.paintEl.append("g")
			.attr("fill", "#fff")
			.attr("stroke", "#000")
			.attr("stroke-width", 1)
		this.svgNode = this.nodesEl.selectAll("circle")
		this.simulation = d3.forceSimulation();
		this.simulationNodes = []
		this.simulationNodes = this.simulation.nodes();


		this.simulationLinkForce = d3.forceLink([]).id(d=>d.id).distance(200).strength(0.5)
		this.simulationLinks = this.simulationLinkForce.links();

		this.simulation
			.force('collision', d3.forceCollide().radius((d) => {
				return this.ctx.mass ? d.data.size * 2 : 75;
			}))
			.force("charge", d3.forceManyBody().strength(-200))


		this.simulation.on("tick", () => {
			let nodes = this.simulationNodes;
			for(let i=0, l=nodes.length; i<l; ++i){
				nodes[i].updateStyle();
			}

			this._updateNodeInfoPosition();

			this.updateTracking();
		});

		/*
       	this.tipLine2 = this.svg.append('path')
        	.attr('stroke', 'rgba(0,0,0,0.5)')
            .attr('stroke-width', 1)
            .attr('class', 'tip-line')
            .attr('marker-end', 'url(#tipArrow)')
	
		this.tAxis = [];

		for(let i = 0; i < 10; i++) {
			this.tAxis60 = this.paintEl.append('path')
				.attr('stroke', 'rgba(0,0,0,0.1)')
				.attr('stroke-width', 1)
				.attr('class', 'tip-line')
				.attr('d', `M${this.xMargin-(60*i*this.tdist)} -1000 L ${this.xMargin-(60*i*this.tdist)} 1000`)
		}
		*/

		window.addEventListener("resize", this.updateSVGSize.bind(this))
		this.fire("ready", {})
	}
	centerBy(nodeId, options){
		let node  = this.nodes[nodeId];
		if(!node)
			return false;
	
		let t = this.paintEl.transform;

		let pBox = this.getBoundingClientRect();
		let centerX = pBox.left + pBox.width/2;
		if(options && options.offsetX)
			centerX += options.offsetX * pBox.width;
		let centerY = pBox.top + pBox.height/2;
		let box = node.getBoundingClientRect();
		let cX = box.left + box.width/2;
		let cY = box.top + box.height/2;
		cX = centerX-cX;
		cY = centerY-cY;
		const { axis, size, sign } = this.ctx.direction;
		if(options && options.filter) {
			options.filter(t,{ cX, cY });
		} else {
			if(axis == "x"){
				t.x = t.x+sign*cX;// * 0.01;
				t.y += cY;// * 0.01;
			}else{
				t.x += cX;
				t.y = t.y+sign*cY;// * 0.01;
			}
			t.x = +t.x.toFixed(4);
			t.y = +t.y.toFixed(4);
		}
		let pos = -(t[axis] / t.k / this.ctx.unitDist) * sign;
		this.ctx.updateOffset(pos);
		this.setChartTransform(this.paintEl.transform);
	}

	translate(x,y, options) {
		let pBox = this.getBoundingClientRect();
		let centerX = pBox.left + pBox.width/2;
		if(options && options.offsetX)
			centerX += options.offsetX * pBox.width;
		let centerY = pBox.top + pBox.height/2;

		let t = this.paintEl.transform;

		t.x = -(x * t.k);
		t.y = -y;

		this.setChartTransform(this.paintEl.transform);

	}
	setChartTransform(transform, skipUpdates){
		this.paintEl.transform = transform || this.paintEl.transform;
		//this.paintEl.
		// transition().duration(1000)
		// .attr('transform', transform);
		let {axis, sign} = this.ctx.direction;
		let {x, y, k} = this.paintEl.transform;
		//console.log("axis, sign, offset", axis, sign, this.ctx.offset)
		if(axis == 'x'){
			x += -sign * this.ctx.offset * k
		}else{
			y += -sign * this.ctx.offset * k
		}

		this.paintEl.attr('transform', `translate(${x}, ${y}) scale(${k})`);

		if(skipUpdates)
			return;

		if(this._node){//if node info window is active
			this.updateNodeInfoPosition();
		}

		//this.updatePanInfo(this.paintEl.transform);
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

		if(linksUpdated){
			this.updateSimulationLinks();
			//this.simulationLinkForce.links(this.simulationLinks);
			//this.simulation.force('link', d3.forceLink(this.simulationLinks).id(d=>d.id).distance(30).strength(0.1));
		}

		this.restartSimulation();
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
		//if(1) {
			this.simulation.alpha(0.005);
			//this.simulation.alphaDecay(0.08);
			this.simulation.alphaDecay(0.005);
		//} else {
		//	this.simulation.alpha(0.0045);
		//	this.simulation.alphaDecay(0.001);
		//}

		if(!this.ctx.track && (Date.now() - this.simulationTimeoutTS > 10 * 1000)) {
			this.simulation.stop();
		}
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

		if(e.ctrlKey || e.metaKey)
			this.selectNode(node);
		else
			this.ctx.app.openExplorer("block/"+node.data.blockHash);
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
		//this.tipLine2.attr("opacity", 0);
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
		if(!iW)
			return

		iH *= 1.1;
		iW *= 1.1;

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

		// this.tipLine2
        //     .attr('d', `M${f(x2)} ${f(y2)} L${f(x1)} ${f(y1)}` )
        //     .attr('opacity', 1);
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
		let pos = -(transform[axis] / transform.k / this.ctx.unitDist) * sign;
		var box = this.graphHolder.getBoundingClientRect();
		let range = Math.ceil(box[size] / transform.k / this.ctx.unitDist);

		//if(Math.round(this._last_pos/3) != Math.round(pos/3) || this._last_range != range) {
			this._last_pos = pos;
			this._last_range = range;
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

			let offset = `offset${this.ctx.direction.axis.toUpperCase()}`;


			// const pos = this.ctx.lastBlockData.data.blueScore;
			// this.ctx.app.updateRegion({
			// 	noCleanup : true,
			// 	fullFetch : true,
			// 	pos, range : this.ctx.app.range_
			// });
			this.centerBy(this.ctx.lastBlockData.blockHash);
			/*
			this.centerBy(this.ctx.lastBlockData.blockHash, { 
				filter : (t,v) => {
					
					let X_ = Math.abs(v.cX / k / this.ctx.unitDist);
					let Y_ = Math.abs(v.cY / k / this.ctx.unitDist);

					let delta = 0.015;
					if(X_ > 256 || Y_ > 256)
						delta = 0.75;
					else
					if(X_ > 16 || Y_ > 16)
						delta = 0.25;
				
					t.x += v.cX * delta;
					t.y += v.cY * delta;
				}, 
				[offset] : (this.ctx.direction.h ? 0.3 : 0.3) * this.ctx.direction.sign
				// offsetX : this.ctx.direction.h ? 0.1 : 0, 
				// offsetY : this.ctx.direction.v ? 0.1 : 0, 
			});
			*/
		}
		else if(this.focusTargetHash) {

			// this.ctx.disableTracking();

			let { k, x, y } = this.paintEl.transform;
			const node = this.nodes[this.focusTargetHash];

			const pos = node.data.blueScore;
			this.ctx.app.updateRegion({
				noCleanup : true,
				fullFetch : true,
				pos, range : this.ctx.app.range_ ||  20
			});

			this.ctx.app.suspend = true;

			this.centerBy(this.focusTargetHash, { filter : (t,v) => {
				// console.log("focusTarget RUN",t,v);
				let X_ = Math.abs(v.cX / k / this.ctx.unitDist);
				let Y_ = Math.abs(v.cY / k / this.ctx.unitDist);
				if(X_ < 1e-1 && Y_ < 1e-1) {
					node.rebuildLinks();
					// console.log("focusTarget STOP");
					// console.log('coordinates:', x,y,t,v );
					//this.ctx.position = node.data[this.ctx.unit];
					delete this.focusTargetHash;
					/* @Anton this code is creating issue when we navigate by block-info click
					//what was issue behind this code ?
					//now it is not creating issue :(
					*/
					this.ctx.app.suspend = false;
					window.app.enableUndo(true);
					this.setChartTransform();
					// window.app.updatePosition();
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

		let min = l[0].data.timestamp;
		let max = l[0].data.timestamp;
		l.forEach((node) => {
			if(node.data.timestamp < min)
				min = node.data.timestamp;
			if(node.data.timestamp > max)
				max = node.data.timestamp;
		});
		l.forEach((node) => {
			node.lvariance = max > min ? (node.data.timestamp - min) / (max-min) * 2 - 1 : 0;
			if(isNaN(node.lvariance))
				console.log('isNaN failure:',min,max,l.length,node);
		});
		

		l.range = { min, max };

		if(l.length > 2) {
			let t = Math.round(l.length/2-0.5);
			for(let i = 0; i < l.length; i++)
				if(l[i].data.isChainBlock) {
					if(t == i)
						break;
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
		console.log("setFocusTargetHash - targeting:",hash);
		this.focusTargetHash = hash;
		//this.simulation.restart();
		this.restartSimulation();
		window.app.enableUndo(false);
	}
}

// Register the element with the browser
DAGViz.register();