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
	}


	render(){
		let box = this.getBoundingClientRect();
		// console.log("box",box);
		return html`
		<canvas id="canvas" style="height:48px;min-height:48px;/*border:1px solid red;*/width:100%;" width="${box.width*this.scale}" height="${box.height*this.scale}">Your browser does not support the HTML5 canvas tag</canvas>
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
		const box = this.getBoundingClientRect();
		const thumbWidth = 128;
		let absolute = (e.clientX-thumbWidth/2) / (box.width-thumbWidth)
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

		let canvasBox = this.canvas.getBoundingClientRect();
		let { width, height } = canvasBox;
		this.PIXEL_RATIO = this.getPixelRatio();
		this.setHiDPICanvas(width*this.scale,height*this.scale,this.PIXEL_RATIO);
		this.redraw();
	}

	_onResize() {
		this.updateCanvas();
	}

	redraw() {
		const { ctx } = this;
		if(!this.app || !this.app.ctx.max)
			return

		let parentBox = this.getBoundingClientRect();
		let canvasBox = this.canvas.getBoundingClientRect();
		let { width, height } = canvasBox;
		width *= this.scale;
		height *= this.scale;
		
		ctx.clearRect(0, 0, width, height);
		ctx.lineWidth = 1;
		let absolute = this.app.ctx.position / this.app.ctx.max;
		const thumbHeight = (54/2)*this.scale;
		ctx.lineWidth = 1;
		ctx.fillStyle = `rgba(0,0,0,1.0)`;
		ctx.strokeStyle = `rgba(0,0,0,1.0)`;
		ctx.font = `${Math.round(36/2*this.scale)}px "Exo 2"`;
		ctx.textBaseline = "top";
		let text = Math.round(this.app.ctx.position)+'';
		let textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;
		const textHeight = 36/2*this.scale; // textMetrics.height;
		let thumbWidth = textWidth+32;
		if(thumbWidth < 128*this.scale)
			thumbWidth = 128*this.scale;


		let x = (width-thumbWidth) * absolute + thumbWidth/2;

		ctx.beginPath();
		ctx.fillStyle = `rgba(255,255,255,1)`;
		ctx.fillRect(x-thumbWidth/2,height/2-thumbHeight/2,thumbWidth,thumbHeight);
		ctx.stroke();
		
		ctx.strokeStyle = `rgba(0,0,0,0.75)`;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(x, 0);
		ctx.lineTo(x, height/2-thumbHeight/2);
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(x, height);
		ctx.lineTo(x, height/2+thumbHeight/2);
		ctx.stroke();
		
		
		/////////////////////
		
		let offset = 0.5;

		ctx.fillStyle = `rgba(0,0,0,1.0)`;
		ctx.fillText(text, x-textWidth/2+offset, height/2-textHeight/2+offset);

		ctx.strokeStyle = `rgba(0,0,0,0.25)`;
		ctx.fillStyle = `rgba(0,0,0,0.325)`;
		ctx.fillText('0', 4, height/2-textHeight/2+offset);
		let max_text = this.app.ctx.max+'';
		let maxMetrics = ctx.measureText(max_text);
		ctx.fillText(max_text, width-4-maxMetrics.width, height/2-textHeight/2+offset);


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