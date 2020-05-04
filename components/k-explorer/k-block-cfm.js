import {LitElement, html, css} from 'lit-element/lit-element.js';

export class KBlockCfm extends LitElement{

	static get properties() {
		return {
			'blue-score': {type:Number},
			cfm:{type:Number}
		};
	}
	static get styles(){
		return css`
			:host(.hl){
				animation:highlight 1.5s;
			}
			.no-cfm{opacity:0}
			@keyframes highlight-bg{
				0%  {background: transparent;}
				50% {background: green;color:red}
				100% {background: transparent;}
			}
			@keyframes highlight{
				0%  {}
				50% {color:red}
				100% {}
			}
		`
	}

	constructor() {
		super();
		if(this.cfm == undefined)
			this.cfm = -1;
		document.body.addEventListener("max-blue-score", e=>{
			this.setMaxBlueScore(e.detail.maxBlueScore)
		});

		this.getMaxScore((maxBlueScore)=>{
			this.setMaxBlueScore(maxBlueScore);
		})

		this.addEventListener("animationend", ()=>{
			this.classList.remove("hl")
		});
		this.setAttribute("part", 'k-block-cfm');
	}

	/*createRenderRoot(){
		return this;
	}*/

	render(){
		this.classList.toggle("no-cfm", this.cfm<0)
		let noCfm = this.cfm<0? 'no-cfm':'';
		return html`<span class="value ${noCfm}">${this.cfm}</span>`;
	}

	setMaxBlueScore(maxBlueScore){
		if(this['blue-score'] != undefined){
			let oldCfm = this.cfm;
			this.cfm = maxBlueScore-this['blue-score'];
			if(oldCfm!=-1 && oldCfm!=this.cfm)
				this.classList.add("hl")
			/*
			setTimeout(()=>{
				this.classList.remove("highlight")
			}, 1600)
			*/
		}
	}

	getMaxScore(callback) {
		let ce = new CustomEvent('get-max-blue-score', {detail:{}})
		document.body.dispatchEvent(ce);
		if(ce.detail && ce.detail.maxBlueScore)
			callback(ce.detail.maxBlueScore);
	}
}

customElements.define('k-block-cfm', KBlockCfm);