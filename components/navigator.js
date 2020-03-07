import { html, BaseElement, css } from './base-element.js';

class AxisNavigator extends BaseElement{

	static get properties() {
		return {
			v:{type:Number},
			vertical:{type:Boolean, value:false}
		};
	}
	static get styles(){
		return css `
			:host{
				font-family: "Open Sans";
				font-size: 14px;
				z-index:4;
			    box-sizing:border-box;
				background-color:#FFF;
			}
		`;
	}

	constructor() {
		super();
		this.data = { }
		this.margin = 32;
		this.scale = 0.75;

		// this.fontSize = 
		// return Math.round(36/2*this.scale);

	}

	getFontSize() {
		if(window.app.ctx.direction.axis == 'x')
			return Math.round(36/2*this.scale);
		return 14*this.scale;
	}

	render(){
		let box = this.getBoundingClientRect();
		// console.log("box",box);
		return html`
		<canvas id="canvas" style="height:100%;min-height:48px;/*border:1px solid red;*/width:100%;" width="${box.width*this.scale}" height="${box.height*this.scale}">Your browser does not support the HTML5 canvas tag</canvas>
		`;
	}

	getPixelRatio(){
    	const ctx = this.canvas.getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    	return dpr / bsr * 2;
	}

	setHiDPICanvas(w, h, ratio) {
		const can = this.canvas;
		let w_ = w;
		let h_ = h;
		can.width = w_ * ratio;
		can.height = h_ * ratio;
		// can.style.width = w_ + "px";
		// can.style.height = h_ + "px";
		can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
	}

	firstUpdated(){
		if(window.ResizeObserver){
			this.resizeObserver = new ResizeObserver(e => {
				this.fire('navigator-resize', {}, {bubbles:true})
			});
			this.resizeObserver.observe(this);
		}

		['mousedown','mouseup','mousemove','click', 'pointerdown', 'pointerup', 'pointermove'].forEach((event) => {
			this.addEventListener(event, (e) => { this.onMouseEvent(event,e); });
		})

		this.addEventListener('navigator-resize', (e)=>{
			this.debounce("navigator-resize", this._onResize.bind(this), 100);
		})

		this.canvas = this.renderRoot.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.ctx.globalAlpha = 0;
		this.updateCanvas();
	}

	_onResize() {
		this.updateCanvas();
		console.log('resize:', this.getBoundingClientRect());
	}

	onMouseEvent(event, e) {
		switch(event) {
			case 'pointerdown': {
				this.drag = true;
				this.setPointerCapture(e.pointerId);

			} break;
			
			case 'pointerup': {
				this.drag = false;
				this.releasePointerCapture(e.pointerId);
				this.handleMouse(e);

			} break;

			case 'pointermove': {
				if(!this.drag)
					return;
				this.handleMouse(e, true);
				this.redraw();

					// this.handleClick(e);
			} break;

			case 'click': {
				this.handleMouse(e);
			} break;
		}
	}

	handleMouse(e, skipUpdates) {

		const { axis, sign } = window.app.ctx.direction;
		const horizontal = (axis == 'x');

		const fontSize = this.getFontSize();

		const box = this.canvasBox; //this.getBoundingClientRect();
		//const thumbWidth = 128;
		const _scale = 1/this.scale;

		let absolute = 
			horizontal ? 		
				(e.clientX-this.thumb.width/2*_scale) / (box.width-this.thumb.width*_scale) : 
				(e.clientY-fontSize/2*_scale) / (box.height-fontSize/2*_scale);

		console.log('e:', e);
		//console.log(absolute, e.clientX, box.width, thumbWidth);
		if(absolute < 0)
			absolute = 0;
		if(absolute > 1)
			absolute = 1;

		if(sign < 0)
			absolute = 1 - absolute;

		this.app.ctx.reposition(absolute, skipUpdates);
	}

	updateCanvas() {
		if(!this.canvas)
			return;

		let parentBox = this.getBoundingClientRect();
		let canvasBox = this.canvas.getBoundingClientRect();
		//let { width, height } = parentBox;
		let { width, height } = canvasBox;
		this.PIXEL_RATIO = this.getPixelRatio();
		this.setHiDPICanvas(width*this.scale,height*this.scale,this.PIXEL_RATIO);
		this.redraw();
	}

	// _onResize() {
	// 	this.updateCanvas();
	// }


	adapt(args) {
		args = args.slice();
		if(this.direction.sign > 0)
			return args;
		const horizontal = !!this.direction.h;
		const x = args[0];
		const y = args[1];
		if(horizontal) 
			args[0] = this.size.width - args[0];
		else
			args[1] = this.size.height - args[1];

		return args;
	}

	redraw(){
		if(!window.app || !window.app.ctx)
			return;

		
		this.direction = window.app.ctx.direction;
		
		const { ctx } = this;
		//const { direction } = ctx;
		const { axis, layoutAxis, size, sizePerp, sign } = window.app.ctx.direction;
		const horizontal = (axis == 'x');
		const inverse = (sign < 0);
		// console.log('horizontal:',horizontal,ctx.direction,ctx,this);

		const fontSize = this.getFontSize();

		if(!this.app || !this.app.ctx.max)
			return
		let parentBox = this.getBoundingClientRect();
		let canvasBox = this.canvas.getBoundingClientRect();
		console.log('parentBox:',parentBox);
		console.log('canvasBox:',canvasBox);
		this.canvasBox = canvasBox;
		let { width, height } = canvasBox;
		width *= this.scale;
		height *= this.scale;
		//const ctl = 
		this.size = { width, height };
		//console.log('ctl:',ctl);
		let absolute = this.app.ctx.position / this.app.ctx.max;
		ctx.clearRect(0, 0, width, height);
		ctx.lineWidth = 1;
		ctx.lineWidth = 1;
		ctx.fillStyle = `rgba(0,0,0,1.0)`;
		ctx.strokeStyle = `rgba(0,0,0,1.0)`;
//		const fontSize = Math.round(36/2*this.scale);
		ctx.font = `${fontSize}px "Exo 2"`;
		ctx.textBaseline = "top";
		const content = Math.round(this.app.ctx.position).toScaleAbbrev();
		let textMetrics = ctx.measureText(content);
		const text = {
			content,
			width : textMetrics.width,
			height : fontSize,
		}
console.log('scale:',this.scale);
		const thumb = { 
			height : fontSize*this.scale,
			width : text.width+8
		};

		// thumeight = (54/2)*this.scale;
		// let thumbWidth = textWidth+32;
		if(horizontal) {
			if(thumb.width < 128*this.scale)
				thumb.width = 128*this.scale;
			if(thumb.height < 54/2*this.scale)
				thumb.height = 54/2*this.scale;
		}
		else
		if(!horizontal) {
			thumb.width = width-8;
			if(thumb.height < 54/2*this.scale)
				thumb.height = 18*this.scale;
		}



		this.thumb = thumb;
		//this.thumb = thumb;
		//let pos = (width-thumbWidth) * absolute + thumbWidth/2;



		let pos_ = (this.size[size]-thumb[size]) * absolute + thumb[size]/2;
		// if(inverse)
		//  	pos_ = this.size[size] - pos_;
		const pos = pos_;
		console.log('pos:', pos);

		// let x = (width-thumbWidth) * absolute + thumbWidth/2;

		
		let offset = 0.5;

		ctx.strokeStyle = `rgba(0,0,0,0.25)`;
		ctx.fillStyle = `rgba(0,0,0,0.325)`;
		let minMetrics = ctx.measureText('0');
		minMetrics.height = fontSize;
		console.log('min metrics:',minMetrics);
		ctx.fillText('0', ...this.adapt(horizontal ? 
			[4+minMetrics.width*(sign>0?0:1), height/2-minMetrics.height/2] :
			[width/2-minMetrics.width/2, (4+fontSize)*(sign<0?1:0)]));

		let max_text = this.app.ctx.max+'';
		let maxMetrics = ctx.measureText(max_text);
		maxMetrics.height = fontSize;
		ctx.fillText(max_text, 
			...this.adapt(horizontal ?
				[width-4-(maxMetrics.width)*(sign>0?1:0), height/2-maxMetrics.height/2] :
				[width/2-maxMetrics.width/2, height-4-(fontSize)*(sign>0?1:0)]));

		console.log('rect:',max_text,maxMetrics,width/2-text.width/2, height-4-fontSize);
		// ------------------




		ctx.strokeStyle = `rgba(0,0,0,0.75)`;
		ctx.fillStyle = `rgba(255,255,255,1)`;
//		if(horizontal) {
			ctx.beginPath();
			thumb.rect = horizontal ? 
				[pos-thumb.width/2*sign, height/2-thumb.height/2, thumb.width, thumb.height] :
				[width/2-thumb.width/2, pos-(thumb.height/2)*sign, thumb.width, thumb.height];
			console.log('thumb rect:',thumb.rect);
			ctx.fillRect(...this.adapt(thumb.rect));
				ctx.rect(...this.adapt(thumb.rect));
			ctx.stroke();
		// } else {

		// }

		ctx.fillStyle = `rgba(0,0,0,1.0)`;
		ctx.fillText(text.content, ...this.adapt(horizontal ? 
			[pos-text.width/2*sign, height/2-text.height/2] :
			[width/2-text.width/2, pos-text.height/2*sign]));
	

		// ctx.fillStyle = `rgba(0,0,0,1)`;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(...this.adapt(horizontal ? [pos, 0] : [0, pos]));
		ctx.lineTo(...this.adapt(horizontal ? [pos, height/2-thumb.height/2] : [4, pos]));
		ctx.moveTo(...this.adapt(horizontal ? [pos, height] : [width,pos]));
		ctx.lineTo(...this.adapt(horizontal ? [pos, height/2+thumb.height/2] : [width-4, pos]));
		ctx.stroke();
		

		let dist = this.size[size]/3;// / 3;
		let begin = pos - dist;
		let end = pos + dist;
		let invert = sign > 0;
		const grad = ctx.createLinearGradient(...(horizontal ? 
			[!invert ? width - begin : begin,0,!invert ? width - end : end,0] : 
			[0,!invert ? height - begin : begin,0,!invert ? height - end : end]));
		grad.addColorStop(0.0,`rgba(0,0,0,0)`);
		grad.addColorStop(0.35,`rgba(0,0,0,0.75)`);
		grad.addColorStop(0.65,`rgba(0,0,0,0.75)`);
		grad.addColorStop(1.0,`rgba(0,0,0,0)`);
		ctx.strokeStyle = grad;
		ctx.beginPath();
		ctx.moveTo(...this.adapt(horizontal ? [begin, 0] : [0, begin]));
		ctx.lineTo(...this.adapt(horizontal ? [end, 0] : [0, end]));
		ctx.stroke();

		// this.app.ctx.position 
		let d = (this.app.ctx.max - this.app.ctx.min) / 15;
		d = Math.pow(10, Math.floor(Math.log(d)/Math.log(10))) * 10;
		
		let range = (this.size[size]-thumb[size]);
		for(let v = 0; v < this.app.ctx.max; v+=d) {
			let p = range * v / this.app.ctx.max + thumb[size] / 2;

			ctx.moveTo(...this.adapt(horizontal ? [p, 0] : [0, p]));
			ctx.lineTo(...this.adapt(horizontal ? [p, 3] : [3, p]));
		}

		ctx.stroke();

		/////////////////////
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

	_C(f, p, tz) {
		var precision = p || 0;
		if(f === null || f === undefined )
			return '?';
		if(typeof(f) != 'number')
			return f;
	
		f = (f).toFixed(precision).split('.');
	
		f[0] = f[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		let t = f.join('.');
		
		if(!tz || !~t.indexOf('.'))
			return t;
	
		while(t.length > 2 && t[t.length-1] == 0 && t[t.length-2] != '.')
			t = t.substring(0, t.length-1);
		return t;
	}



	
	
}

if(!Number.prototype.toScaleAbbrev) {
	Object.defineProperty(Number.prototype, 'toScaleAbbrev', {
		value: function(a, asNumber) {
			var b,c,d;
			var r = (
				a=a?[1e3,'k','']:[1024,'K',''],
				b=Math,
				c=b.log,
				d=c(this)/c(a[0])|0,this/b.pow(a[0],d)
			).toFixed(this > 999 ? 2 : 0)

			if(!asNumber) {
				r += ' '+(d?(a[1]+'MGTPEZY')[--d]+a[2]:'');
			}
			return r;
		},
		writable:false,
		enumerable:false
	});
}

AxisNavigator.register();