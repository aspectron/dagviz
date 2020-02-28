import { html, BaseElement, css } from './base-element.js';

class AxisNavigator extends BaseElement{

	static get properties() {
		return {
			v:{type:Number},
		};
	}
	static get styles(){
		return css `
			:host{
				font-family: "Open Sans";
				font-size: 14px;
				/*position:fixed;*/
				/*width:400px;*/
				/*max-width:500px;
				min-height: 96px;
				min-width: 150px;*/
				z-index:4;
			    /*box-shadow:
			    	0 4px 5px 0 rgba(0,0,0,.14),
			    	0 1px 10px 0 rgba(0,0,0,.12), 
			    	0 2px 4px -1px rgba(0,0,0,.2);*/
			    box-sizing:border-box;
				/*border:1px solid #DDD;*/
				
				background-color:#FFF;
				/*border-radius:5px;*/
				/*max-height: inherit;*/
			}

		`;
	}

	constructor() {
		super();
		this.data = { }
		this.margin = 32;
	}


	render(){
		let box = this.getBoundingClientRect();
		return html`
		<canvas id="canvas" style="height:48px;min-height:48px;/*border:1px solid red;*/width:100%;" width="${box.width*2}" height="${box.height*2}">Your browser does not support the HTML5 canvas tag</canvas>
		`;
	}

	// ready() {
	// 	super.ready();
	// 	window.addEventListener("resize", ()=>{
	// 		this.PIXEL_RATIO = this.getPixelRatio();
	// 		this.updateCanvas();
	// 	})
	// 	setTimeout(()=>{
	// 		this.PIXEL_RATIO = this.getPixelRatio();
	// 		this.updateCanvas();
	// 	}, 100);

	// }

	// update(min,max,pos) {

	// }


	getPixelRatio(){
    	var ctx = this.$.canvas.getContext("2d"),
        dpr = window.devicePixelRatio || 1,
        bsr = ctx.webkitBackingStorePixelRatio ||
              ctx.mozBackingStorePixelRatio ||
              ctx.msBackingStorePixelRatio ||
              ctx.oBackingStorePixelRatio ||
              ctx.backingStorePixelRatio || 1;

    	return dpr / bsr;
	}
	setHiDPICanvas(w, h, ratio) {
		var can = this.$.canvas;
		can.width = w * ratio;
		can.height = h * ratio;
		can.style.width = w + "px";
		can.style.height = h + "px";
		can.getContext("2d").setTransform(ratio, 0, 0, ratio, 0, 0);
	}


	// getHeight(data, minheight = 0) {

	// 	return 48;

	// 	let height = (((data.length + 1) * 24)+minheight);
	// 	//console.log("height:",height);
	// 	if(height < 24)
	// 		height = 24;
	// 	return height;
	// }



	firstUpdated(){
		if(window.ResizeObserver){
			this.resizeObserver = new ResizeObserver(e => {
				this.fire('navigator-resize', {}, {bubbles:true})
			});
			this.resizeObserver.observe(this);
		}


		this.addEventListener('click', this.handleClick);
		['mousedown','mouseup','mousemove'].forEach((event) => {
			this.addEventListener(event, (e) => { this.onMouseEvent(event,e); });
		})

		//let ctx = document.querySelector(); //this.$.canvas.getContext("2d");

		this.canvas = this.renderRoot.getElementById('canvas');
		this.ctx = this.canvas.getContext('2d');

		this.addEventListener('navigator-resize', (e)=>{
			this.debounce("navigator-resize", this._onResize, 100)
		})

		this.redraw();

	}

	onMouseEvent(event, e) {
		switch(event) {
			case 'mousedown': {
				this.drag = true;
				this.handleClick(e);
			} break;

			case 'mouseup': {
				this.drag = false;

			} break;

			case 'mousemove': {
				if(!this.drag)
					return;
				this.handleClick(e);
			} break;
		}
	}

	handleClick(e) {
		// console.log(e);

		const box = this.getBoundingClientRect();
		const thumbWidth = 128;
		//let absolute = (e.clientX+thumbWidth/2) / (box.width-thumbWidth/2);// - thumbWidth*2);
//console.log(e);
		let absolute = (e.clientX-thumbWidth/2) / (box.width-thumbWidth)
		console.log(absolute, e.clientX, box.width, thumbWidth);
		if(absolute < 0)
			absolute = 0;
		if(absolute > 1)
			absolute = 1;
		// console.log('absolute:', absolute);
		this.app.ctx.reposition(absolute);
	}

	onResize() {
		let canvasBox = this.canvas.getBoundingClientRect();
		let { width, height } = canvasBox;
		this.canvas.width = width;
		this.canvas.height = height;
		
	}

	redraw() {
		const { ctx } = this;
		if(!this.app || !this.app.ctx.max)
			return

		let parentBox = this.getBoundingClientRect();
		let canvasBox = this.canvas.getBoundingClientRect();
		let { width, height } = canvasBox;
		width *= 2;
		height *= 2;
		// let {width} = parentBox;
		
		
		
		ctx.clearRect(0, 0, width, height);
		ctx.lineWidth = 1;
		
		let absolute = this.app.ctx.position / this.app.ctx.max;


		const thumbHeight = 54;
		ctx.lineWidth = 1;
		ctx.strokeStyle = `rgba(0,0,0,1.0)`;
		ctx.font = '36px "Exo 2"';
		ctx.textBaseline = "top";
		let text = Math.round(this.app.ctx.position)+'';
		let textMetrics = ctx.measureText(text);
		const textWidth = textMetrics.width;
		const textHeight = 36; // textMetrics.height;
		let thumbWidth = textWidth+32;
		if(thumbWidth < 256)
			thumbWidth = 256;

			let x = (width-thumbWidth) * absolute + thumbWidth/2;
		
			//console.log("clearRect:",width,height, 'position:',this.app.ctx.position,'max:',this.app.ctx.max,'absolute:',absolute, 'x:', x);
	

		// console.log('text:',text, x-textWidth/2, height/2-textHeight/2);

		ctx.fillText(text, x-textWidth/2+0.25, height/2-textHeight/2+0.25);

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

		ctx.beginPath();
		ctx.rect(x-thumbWidth/2,height/2-thumbHeight/2,thumbWidth,thumbHeight);
		ctx.stroke();


		// ctx.beginPath();
		// ctx.moveTo(x-textWidth/2-8, height-18);
		// ctx.lineTo(x+textWidth/2+8, height-18);
		// ctx.stroke();

	}


	// updated(changedProperties) {
	// 	changedProperties.forEach((oldValue, propName) => {
	// 		//console.log(`${propName} changed. oldValue: ${oldValue}`);
	// 		if(propName == "node")
	// 			this.setPolling(!!this.node);
	// 	});
	// }
	// onUpdate(){
	// 	console.log("sss")
	// }	


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