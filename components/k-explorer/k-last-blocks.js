import { LitElement, html, css } from 'lit-element/lit-element.js';

export class KLastBlocks extends LitElement{

	static get properties() {
		return {
			count:{type:Number}
		};
	}
	static get styles(){
		return css `
			:host{
				position: absolute;
				font-size:1rem;
				z-index:-1;
				display:block;
				min-width:160px;
				top: 100px;
				right: 32px;
				transition: opacity 750ms;
				opacity: 0;
				background-color: rgba(0, 150, 136, 1);
				border: 1px solid var(--last-block-widget-border-color, #ccc);
				border-radius: 10px;
				text-align: center;
				color: white;
				transform: translate3d(0,0,0);
				perspective: 1000px;				
				cursor: pointer;
			}
			:host(.visible){opacity:1;z-index:4}
			div{padding:6px}
			@keyframes shake {
				10%, 90% { transform: translate3d(-1px, 0, 0); }
				20%, 80% { transform: translate3d(2px, 0, 0); }
				30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
				40%, 60% { transform: translate3d(4px, 0, 0); }
			}
			:host(.shake){
				animation:shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
			}			
		`;
	}

	constructor() {
		super();
		this.count = 0;
		this.blocks = {};
		this.active = false;
		window.addEventListener("k-last-blocks", e=>{
			this.updateBlocks(e.detail.blocks)
		})
	}

	render(){
		if(this.count<1)
			return html ``;
		let msg = `${this.count} new block${this.count>1?'s':''}`;
		return html`<div @click=${this.onClick}>${msg}</div>`;
	}

	updateBlocks(blocks) {
		let count = blocks.length;

		blocks.map(b=>{
			this.blocks[b.blockHash] = 1
		});

		this.post(count);
	}

	onClick(){
		let detail = {blocks:Object.keys(this.blocks)}
		let ce = new CustomEvent('k-last-blocks-clicked', {detail})
		window.dispatchEvent(ce);
		this.halt();
	}

	halt() {
		if(this.active) {
			this.active = false;
			this.blocks = {};
			this.classList.remove('shake');
			this.classList.remove('visible');
		}
	}

	post(count) {
		if(!this.active){
			this.count = 0;
			this.classList.add('visible');
		}
		this.classList.remove('shake');

		setTimeout(()=>{
			this.classList.add('shake');
		}, 100)

		this.active = true;
		this.count += count;
	}
}

customElements.define('k-last-blocks', KLastBlocks);
