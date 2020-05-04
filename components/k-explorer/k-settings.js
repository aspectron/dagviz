import { LitElement, html, css } from 'lit-element/lit-element.js';
import {btnStyle} from "./k-utils.js";

export class KSettings extends LitElement{
	static get properties() {
		return {
			settings:{type:Object}
		}
	}
	static get styles() {
		return [btnStyle, css`
			:host{
				display:block;
				padding:10px;
			}
			:host(.sm-text){
				font-size:1rem;
			}
			.setting{
				display:flex;
			}
			.setting label{
				flex:1;
				width:100px;
				overflow:hidden;
				text-overflow:ellipsis;
			}
			.setting .btn{
				margin-left:4px;
				--k-btn-font-size:0.8rem;
			}
			.setting .btn.active{
				cursor:default;
			}
		`]
	}
	constructor(){
		super();
		this.fetchSettings();
		window.addEventListener("k-settings", e=>{
			//console.log("e.detail.settings", e)
			this.settings = e.detail.settings;
		})
	}
	render(){
		let {theme, themes} = this.settings;
		//console.log("theme", theme)
		return html`
		<div class="items" @click="${this.onClick}">
		<div class="setting">
			<label>Theme:</label>
			${
			themes.map(t=>{
				return html `<a 
				data-action="theme"
				data-value="${t}"
				class="btn ${t==theme?'active disabled':''}">${t.toUpperCase()}</a>`;
			})
			}
		</div>
		</div>
		`
	}

	onClick(e){
		let $target = $(e.target);
		let $el = $target.closest("[data-action]");
		let action = $el.attr("data-action");
		let value = $el.attr("data-value");
		let changed = false;
		switch(action){
			case 'theme':
				this.settings.theme = value;
				changed = true;
			break;
		}

		if(changed){
			this.requestUpdate();
			this.sendSettings();
		}
	}

	sendSettings(){
		let settings = Object.assign({}, this.settings);
		let e = new CustomEvent("k-set-settings", {detail:{settings}});
		window.dispatchEvent(e)
	}

	fetchSettings(){
		let e = new CustomEvent("k-settings", {detail:{}});
		window.dispatchEvent(e)
		this.settings = e.detail.settings;
	}


}

customElements.define('k-settings', KSettings);