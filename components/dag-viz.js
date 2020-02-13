import { BaseElement, html } from './base-element.js';

class DAGViz extends BaseElement {
	static get is(){
		return 'dag-viz';
	}
	static get properties() {
		return { 
			nodes: { type: Array, value:[] }
		};
	}

	render(){
		
		return html`
			<p>hello</p>
		`;
	}
}
DAGViz.register();