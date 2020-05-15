import {html, css, BaseElement} from './base-element.js';
import {flowPagesStyle} from '/node_modules/@aspectron/flow-ux/flow-ux.js';

class AppTutorial extends BaseElement{

	static get properties() {
		return {
			slideTitle:{type:String}
		};
	}
	static get styles(){
		return [flowPagesStyle, css`
			:host{z-index:-10;opacity:0}
			:host(.active){opacity:1;z-index:100000}
			:host{
				position:fixed;top:0px;left:0px;width:100%;height:100%;
				background-color:rgba(255, 255, 255, 0.5);
			}
			[slot="title"]{font-size:1.5rem;padding:10px;}
			flow-pages{
				position:absolute;left:10%;top:10%;width:80%;height:80%;
				border:2px solid var(--flow-primary-color);
				background-color:var(--bg-color, #FFF);box-sizing:border-box;
			}
			flow-pages .buttons flow-btn{
				display:flex;align-items:center;
			}
			@media(max-width:425px){
				flow-pages{left:0px;right:0px;top:0px;width:100%;height:100%;}
				flow-pages .buttons flow-btn{font-size:0.6rem}
			}
			flow-page{
				overflow:auto;
				padding:10px;box-sizing:border-box;display:flex;flex-direction:column;
				padding-bottom:35px;background-color:var(--bg-color, #FFF);
			}
			flow-page img{
				display:block;max-width:90%;max-height:90%;margin:auto;flex:1;
				margin-bottom:10px;object-fit:contain;height:100px;
			}

			.dagviz-slide{
				flex-direction:row;flex-wrap:wrap;overflow:auto;
				justify-content:space-around;padding-top:0px;
			}
			.dagviz-slide>img{margin:20px auto;height:auto;max-width:300px;}
			table{border-collapse:collapse;border-spacing:0px;width:100%;}
			th{
				background-color:#FFF;
				position:sticky;top:0px;box-shadow:3px 2px 2px 0px rgba(0, 0, 0, 0.4);
				color:var(--flow-primary-color);
			}
			td,th{border-bottom:1px solid #DDD;padding:5px;box-sizing:border-box;}
			th{border-bottom:0px;}
			tr:nth-child(2n) td{background-color:rgba(200,200,200, 0.3)}
			th:last-child:after{
				content:"";
				position:absolute;
				right:0px;
				top:0px;
				width:10px;
				height:100%;
				background-color:#FFF;
				margin-right:-7px;
				z-index:1000;
			}
			tr:last-child td{border-bottom:0px;}
			.shadow{box-shadow:2px 2px 4px 0px rgba(0, 0, 0, 0.3);}
			td img{border:1px solid rgba(0, 0, 0, 0.1);height:auto;}
			div.items{margin-bottom:20px;}
			flow-page p{margin-bottom:10px;}
		`];
	}

	constructor() {
		super();
		window.tutorial = (index)=>{
			this.startTutorial(index);
		}
	}
	render(){
		return html`
		<flow-pages class="has-dots" @change="${this.onSlideChange}">
			<div slot="title">${this.slideTitle||'Kaspa Tutorial'}</div>
			<flow-page class="active">
				<img src="/resources/images/tutorial/slide-1.jpg" />
				<p>Kaspa is a PoW-based ledger organized in a DAG of blocks -- a blockDAG.</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-2.jpg" />
				<p>A new block gets added to the blockDAG every second. Many blocks are 
				created in parallel</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-1.jpg" />
				<p>Unlike a blockchain, blocks are not orphaned. Kaspa integrates all 
				blocks into one blockDAG, by allowing them to reference multiple parents</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-2.jpg" />
				<p>Rather than agreeing which blocks should be discarded, the consensus 
				decides on the order of blocks created in parallel. The ordering is 
				governed by the PHANTOM consensus protocol, which is a generalization 
				of Nakamoto Consensus.</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-1.jpg" />
				<p>PHANTOM favours blocks that mined up-to-date blocks, and propagated 
				them sufficiently fast, “blue blocks”, over those withheld or propagated 
				over too slow communication channels, “red blocks”.</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-2.jpg" />
				<p>The “blue score” of a block is a generalization of the block height 
				in a chain; it represents the number of blue blocks in the block’s 
				past. The iterative process of selecting the parent with the highest 
				blue score, “the selected parent”, results in the identification of 
				a chain within the blockDAG, “the selected parent chain”.</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-1.jpg" />
				<p>Each new block inherits the colouring of its past from its selected 
				parent, and adds blocks created in parallel to the selected parent, 
				following a colouring procedure defined by the protocol.</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-2.jpg" />
				<p>Confirmations in PHANTOM are a generalization of confirmations 
				in a chain, and are defined by the blue score of the chain blocks 
				atop the transaction. The fast block rate enables fast confirmation 
				of transactions.</p>
			</flow-page>
			<flow-page>
				<img src="/resources/images/tutorial/slide-1.jpg" />
				<p>Blocks contain transactions in the UTXO-model format.</p>
			</flow-page>
			<flow-page class="dagviz-slide" data-title='Dagviz Tutorial'>
				<div class="items">
					<table cellpadding="0" cellspacing="0" border="0">
						<thead>
						<tr><th width="30%">Keys / UI</th><th class="fn">Function</th></tr>
						</thead>
						<tbody>
						<tr><td>← →<br>Drag mouse</td><td>Pan the blockDAG</td></tr>
						<tr><td>Home</td><td>Go to Genesis</td></tr>
						<tr><td>End</td><td>Track live blocks</td></tr>
						<tr><td>Ctrl + <b>+/-</b>  or Mouse wheel</td><td>Zoom in/out</td></tr>
						<tr>
							<td><b>/</b></td><td>Focus search box</td>
						</tr>
						<tr>
							<td><img _class="shadow" src="/resources/images/tutorial/blue-score-navigator.png" /></td>
							<td>Blue Score navigator</td>
						</tr>
						<tr>
							<td><img _class="shadow" src="/resources/images/tutorial/switch-to-explorer.png" /></td>
							<td>Switch to explorer</td>
						</tr>
						</tbody>
					</table>
				</div>
				<img src="/resources/images/tutorial/legend.png" />
			</flow-page>

			<div slot="buttons" class="buttons">
				<flow-btn @click="${this.skipTutorial}"><span>Skip</span></flow-btn>
				<div class="flex"></div>
				<flow-btn data-btn="prev">
					<svg><use href="/resources/fonts/fontawesome/sprites/light.svg#arrow-alt-left"></use></svg>
					<span>Previous</span>
				</flow-btn>

				<flow-btn data-btn="next">
					<span>Next</span>
					<svg><use href="/resources/fonts/fontawesome/sprites/light.svg#arrow-alt-right"></use></svg>
				</flow-btn>
			</div>
		</flow-pages>
		`
	}

	onSlideChange(e){
		let {index} = e.detail;
		let activePage = this.renderRoot.querySelector('flow-page.active');
		let title = activePage && activePage.getAttribute('data-title');

		this.slideTitle = title||'Kaspa Tutorial';
	}

	startTutorial(index=0){
		this.renderRoot.querySelector('flow-pages').setActive(index);
		this.classList.add('active');
	}

	skipTutorial(){
		this.classList.remove('active');
	}
}

AppTutorial.register();