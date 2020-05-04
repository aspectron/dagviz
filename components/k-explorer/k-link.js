import { LitElement, html, css } from 'lit-element/lit-element.js';

export class KLink extends LitElement{
	static get properties() {
		return {
			hash:{type:String}
		}
	}

	createRenderRoot(){
		return this;
	}

	constructor(...args){
		super(...args)

		this.addEventListener("click", (e)=>{
			this.onClick(e);
		})
	}

	onClick(){
		const evt = new CustomEvent("k-link-clicked", {
			detail:{hash:this.hash, el:this}
		});

		window.dispatchEvent(evt);
	}
}

let kLinkStyles = css`
	k-link[disabled],
	.k-link[disabled],
	.k-link.disabled{
		color:var(--k-link-disabled-color, #acacac);
	}
	k-link:not([disabled]),
	.k-link:not([disabled]):not(.disabled){
		cursor:pointer;
		color:var(--k-link-color, #2196f3);
		transition:color 0.2s ease;
	}

	k-link:hover:not([disabled]),
	.k-link:hover:not([disabled]):not(.disabled){
		color:var(--k-link-hover-color, #00bcd4);
	}
`;

export {kLinkStyles}
let style = document.head.querySelector(".k-link-style") || document.createElement("style");
style.innerHTML = kLinkStyles.toString();
if(!style.parentNode)
	document.head.insertBefore(style, document.head.querySelector(":last-child"));

customElements.define('k-link', KLink);

