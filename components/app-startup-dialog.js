import {html, css, BaseElement} from './base-element.js';

class AppStartupDialog extends BaseElement{

	static get properties() {
		return {
			heading:{type:String}
		};
	}

	static get styles(){
		return [css`
			:host{z-index:-10;opacity:0}
			:host(.active){opacity:1;z-index:100000}
			:host{
				position:fixed;top:0px;left:0px;width:100%;height:100%;
				background-color:rgba(255, 255, 255, 0.5);
			}
			.container{
				position:absolute;
				top:5%;left:5%;
				width:90%;
				height:90%;
				background-color:#F00;
			}

			@media(max-width:425px){
				.container{

				}
			}
		`];
	}

	constructor() {
		super();
		window.showStartupDialog = (show=true)=>{
			if(show)
				this.show();
			else
				this.hide();
		}

		this.addEventListener("click", ()=>{
			this.hide();
		})
	}


	render(){
		return html`
			<div class="container">
				<h1>${this.heading}</h1>
				<p>AppVersionInfo</p>
			</div>
		`
	}

	show(){
		this.classList.add('active');
	}

	hide(){
		this.classList.remove('active');
	}

	firstUpdated(){

	}
}

AppStartupDialog.register();