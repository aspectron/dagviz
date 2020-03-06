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
		return 11*this.scale;
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

		['mousedown','mouseup','mousemove','click'].forEach((event) => {
			this.addEventListener(event, (e) => { this.onMouseEvent(event,e); });
		})

		this.addEventListener('navigator-resize', (e)=>{
			this.debounce("navigator-resize", this._onResize.bind(this), 100);
		})

		this.canvas = this.renderRoot.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');
		this.updateCanvas();
	}

	_onResize() {
		this.updateCanvas();
		console.log('resize:', this.getBoundingClientRect());
	}

	onMouseEvent(event, e) {
		switch(event) {
			case 'mousedown': {
				this.drag = true;
			} break;
			
			case 'mouseup': {
				this.drag = false;
				this.handleMouse(e);

			} break;

			case 'mousemove': {
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

		const { axis } = window.app.ctx.direction;
		const horizontal = (axis == 'x');

		const fontSize = this.getFontSize();

		const box = this.getBoundingClientRect();
		const thumbWidth = 128;
		let absolute = 
			horizontal ? 		
				(e.clientX-thumbWidth/2) / (box.width-thumbWidth) : 
				(e.clientY-fontSize/2) / (box.height-fontSize);
		//console.log(absolute, e.clientX, box.width, thumbWidth);
		if(absolute < 0)
			absolute = 0;
		if(absolute > 1)
			absolute = 1;
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

	// redraw() {
	// 	if(this.vertical)
	// 		return this.redrawV();
	// 	this.redrawH();
	// }

	// redrawV(){
	// 	const { ctx } = this;
	// 	if(!this.app || !this.app.ctx.max)
	// 		return
	// 	let parentBox = this.getBoundingClientRect();
	// 	let canvasBox = this.canvas.getBoundingClientRect();
	// 	let { width, height } = canvasBox;
	// 	width *= this.scale;
	// 	height *= this.scale;
		
	// 	ctx.clearRect(0, 0, width, height);
	// 	ctx.lineWidth = 1;
	// 	let absolute = this.app.ctx.position / this.app.ctx.max;
	// 	const thumbHeight = (54/2)*this.scale;
	// 	ctx.lineWidth = 1;
	// 	ctx.fillStyle = 'rgba(0,0,0,1.0)';
	// 	ctx.strokeStyle = 'rgba(0,0,0,1.0)';
	// 	ctx.font = `${Math.round(36/2*this.scale)}px "Exo 2"`;
	// 	ctx.textBaseline = "top";
	// 	let text = Math.round(this.app.ctx.position)+'';
	// 	let textMetrics = ctx.measureText(text);
	// 	const textWidth = textMetrics.width;
	// 	const textHeight = 36/2*this.scale;
	// 	let thumbWidth = textWidth+32;
	// 	if(thumbWidth < 128*this.scale)
	// 		thumbWidth = 128*this.scale;

	// 	let x = (width-thumbWidth) * absolute + thumbWidth/2;

	// 	ctx.beginPath();
	// 	ctx.fillStyle = 'rgba(255,255,255,1)';
	// 	ctx.fillRect(x-thumbWidth/2, height/2-thumbHeight/2, thumbWidth, thumbHeight);
	// 	ctx.stroke();
		
	// 	ctx.strokeStyle = `rgba(0,0,0,0.75)`;
	// 	ctx.lineWidth = 1;
	// 	ctx.beginPath();
	// 	ctx.moveTo(x, 0);
	// 	ctx.lineTo(x, height/2-thumbWidth/2);
	// 	ctx.stroke();
		
	// 	ctx.beginPath();
	// 	ctx.moveTo(x, height);
	// 	ctx.lineTo(x, height/2+thumbWidth/2);
	// 	ctx.stroke();
		
		
	// 	/////////////////////
		
	// 	let offset = 0.5;

	// 	ctx.fillStyle = `rgba(0,0,0,1.0)`;
	// 	ctx.fillText(text, x-textWidth/2+offset, height/2-textHeight/2+offset);

	// 	ctx.strokeStyle = `rgba(0,0,0,0.25)`;
	// 	ctx.fillStyle = `rgba(0,0,0,0.325)`;
	// 	ctx.fillText('0', 4, height/2-textHeight/2+offset);
	// 	let max_text = this.app.ctx.max+'';
	// 	let maxMetrics = ctx.measureText(max_text);
	// 	ctx.fillText(max_text, width-4-maxMetrics.width, height/2-textHeight/2+offset);
	// }
	redraw(){
		const { ctx } = this;

		//const { direction } = ctx;
		const { axis, layoutAxis, size, sizePerp } = window.app.ctx.direction;
		const horizontal = (axis == 'x');
		// console.log('horizontal:',horizontal,ctx.direction,ctx,this);

		const fontSize = this.getFontSize();

		if(!this.app || !this.app.ctx.max)
			return
		let parentBox = this.getBoundingClientRect();
		let canvasBox = this.canvas.getBoundingClientRect();
		console.log('parentBox:',parentBox);
		console.log('canvasBox:',canvasBox);
		let { width, height } = canvasBox;
		width *= this.scale;
		height *= this.scale;
		const ctl = { width, height };
		console.log('ctl:',ctl);
		let absolute = this.app.ctx.position / this.app.ctx.max;
		ctx.clearRect(0, 0, width, height);
		ctx.lineWidth = 1;
		ctx.lineWidth = 1;
		ctx.fillStyle = `rgba(0,0,0,1.0)`;
		ctx.strokeStyle = `rgba(0,0,0,1.0)`;
//		const fontSize = Math.round(36/2*this.scale);
		ctx.font = `${fontSize}px "Exo 2"`;
		ctx.textBaseline = "top";
		const content = Math.round(this.app.ctx.position)+'';
		let textMetrics = ctx.measureText(content);
		const text = {
			content,
			width : textMetrics.width,
			height : fontSize,
		}

		const thumb = { 
			height : (54/2)*this.scale,
			width : text.width+8
		};
		// thumeight = (54/2)*this.scale;
		// let thumbWidth = textWidth+32;
		if(thumb.width < 128*this.scale)
			thumb.width = 128*this.scale;

		//let pos = (width-thumbWidth) * absolute + thumbWidth/2;



		const pos = (ctl[size]-thumb[size]) * absolute + thumb[size]/2;

		// let x = (width-thumbWidth) * absolute + thumbWidth/2;


		
		let offset = 0.5;

		ctx.strokeStyle = `rgba(0,0,0,0.25)`;
		ctx.fillStyle = `rgba(0,0,0,0.325)`;
		ctx.fillText('0', ...(horizontal ? 
			[4, height/2-text.height/2] :
			[width/2-text.width/2, 4]));
		let max_text = this.app.ctx.max+'';
		let maxMetrics = ctx.measureText(max_text);
		ctx.fillText(max_text, 
			...(horizontal ?
				[width-4-maxMetrics.width, height/2-text.height/2] :
				[width/2-text.width/2, height-4-fontSize]));

		console.log('rect:',max_text,maxMetrics,width/2-text.width/2, height-4-fontSize);
		// ------------------




		ctx.strokeStyle = `rgba(0,0,0,0.75)`;
		ctx.fillStyle = `rgba(255,255,255,1)`;
		ctx.beginPath();
		thumb.rect = horizontal ? 
			[pos-thumb.width/2, height/2-thumb.height/2, thumb.width, thumb.height] :
			[width/2-thumb.width/2, pos-thumb.height/2, thumb.width, thumb.height];
		console.log('thumb rect:',thumb.rect);
		ctx.fillRect(...thumb.rect);
		ctx.rect(...thumb.rect);
		ctx.stroke();

		ctx.fillStyle = `rgba(0,0,0,1.0)`;
		ctx.fillText(text.content, ...(horizontal ? 
			[pos-text.width/2, height/2-text.height/2] :
			[width/2-text.width/2, pos-text.height/2]));
	

		// ctx.fillStyle = `rgba(0,0,0,1)`;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(...(horizontal ? [pos, 0] : [0, pos]));
		ctx.lineTo(...(horizontal ? [pos, height/2-thumb.height/2] : [width/2-thumb.width/2, pos]));
		ctx.moveTo(...(horizontal ? [pos, height] : [width,pos]));
		ctx.lineTo(...(horizontal ? [pos, height/2+thumb.height/2] : [width/2+thumb.width/2, pos]));
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
}

AxisNavigator.register();