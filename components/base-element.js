import { LitElement, html, css } from '/node_modules/lit-element/lit-element.js';
import {render} from '/node_modules/lit-html/lit-html.js';

class BaseElement extends LitElement {
	static register(){
		var elName = this.is || this.getElementName();
		//console.log("elName:"+elName)
		customElements.define(elName, this);
	}
	static getElementName(){
		let name = this.name.replace(/([A-Z]{1,})/g, "-$1").toLowerCase()
		if(name[0] == "-")
			return name.substr(1);
		return name;
	}
	fire(name, detail={}){
		let event = new CustomEvent(name, {
			detail
		});
		this.dispatchEvent(event);
	}
	/*
	createRenderRoot() {
		return this;
	}
	*/
}

export {LitElement, html, BaseElement, css, render};