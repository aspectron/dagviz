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
				position:absolute;left:25%;top:25%;width:50%;height:50%;
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
				padding:10px;
				box-sizing:border-box;
				display:flex;
				flex-direction:row; 
				justify-content: space-evenly; 
				 /*align-items: center;*/
				padding-bottom:32px;
				background-color:var(--bg-color, #FFF);
			}

			flow-page > div:nth-child(1){
				object-fit: contain;
				width: 40%;
				text-align: justify;
				padding: 32px;
			}

			flow-page > div:nth-child(2){
				padding: 32px;
				flex: 1;
				/*text-align: justify;*/
			}

			flow-page div img{
				max-width:100%;
				max-height:100%;	
			}

			.dagviz-slide{
				flex-direction:row;
				flex-wrap:wrap;
				overflow:auto;
				justify-content:space-around;
				padding-top:0px;
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


			@media(max-width:425px){
				flow-page{
					flex-direction:column;
					justify-content: flex-start; 
				}

				flow-page > div:nth-child(1){
					object-fit: contain;
					width: 80%;
					max-height: 70%;
					text-align: center;
					padding: 32px;
					/*border-style : solid; border-width : 1px; border-color : blue;*/
				}

				flow-page > div:nth-child(2){
					padding: 0px;
					width: 100%;
					max-height: 5%;
					flex: 1;
					/*border-style : solid; border-width : 1px; border-color : yellow;*/
				}

				flow-page > div:nth-child(3){
					padding: 0px;
					width: 100%;
					max-height: 20%;
					flex: 1;
					/*border-style : solid; border-width : 1px; border-color : red;*/
				}

				.dagviz-slide{
					flex-wrap:nowrap;
					flex-direction:column;
					justify-content:flex-start;
					
				}

	
			}
			
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
		
		<flow-pages id="pages" class="has-dots" @change="${this.onSlideChange}">
		
			<div slot="title">${this.slideTitle||'Kaspa Tutorial'}</div>
  
			<flow-page class="active">
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div>Kaspa is a PoW-based ledger organized in a DAG of blocks -- a blockDAG. 
				A new block gets added to the blockDAG every second.
				Many blocks are created in parallel.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/legend.png" /></div>
				<div></div>
				<div>Unlike a blockchain, blocks are not orphaned.
				Kaspa integrates all blocks into one blockDAG,by allowing them 
				to reference multiple parents.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div>Rather than agreeing which blocks should be discarded, the consensus 
				decides on the order of blocks created in parallel.The ordering is 
				governed by the PHANTOM consensus protocol, which is a generalization 
				of Nakamoto Consensus.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div>PHANTOM favours blocks that mined up-to-date blocks, <br> and propagated 
				them sufficiently fast, “blue blocks”, <br> over those withheld or propagated 
				over too slow <br> communication channels, “red blocks”.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div>The “blue score” of a block is a generalization of the block height 
				in a chain; it represents the number of blue blocks in the block’s 
				past.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div>The iterative process of selecting the parent with the highest 
				blue score, “the selected parent”, results in the identification of
				a chain within the blockDAG, “the selected parent chain”.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div>Each new block inherits the colouring of its past from its selected 
				parent, and adds blocks created in parallel to the selected parent,
				following a colouring procedure defined by the protocol.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div>Confirmations in PHANTOM are a generalization of confirmations
				in a chain, and are defined by the blue score of the chain blocks 
				atop the transaction. The fast block rate enables fast confirmation
				of transactions.</div>
			</flow-page>
			<flow-page>
				<div><img src="/resources/images/tutorial/blue-red-blocks.png" /></div>
				<div></div>
				<div></div>
				<div>Blocks contain transactions in the UTXO-model format.</div>
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
				<div></div>
				<div><img src="/resources/images/tutorial/legend.png" /></div>
			</flow-page>

			<div slot="buttons" class="buttons">
				<flow-btn data-btn="skip" @click="${this.skipTutorial}"><span>SKIP</span></flow-btn>
				<div class="flex"></div>
				<flow-btn data-btn="prev">
					<svg><use href="/resources/fonts/fontawesome/sprites/light.svg#arrow-alt-left"></use></svg>
					<span>PREVIOUS</span>
				</flow-btn>

				<flow-btn data-btn="next">
					<span>NEXT</span>
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
// span.innerText = 'fin';
// nextBtn.querySelector("span")
	skipTutorial(){
		this.classList.remove('active');
	}

	firstUpdated(){

		dpc(1000, ()=>{

			let pages = this.shadowRoot.getElementById("pages");
			console.log("Pages1", pages);
			let wrapper = pages.shadowRoot.querySelector(".wrapper");
			console.log("Pages2", wrapper);
			$(wrapper).touchwipe({
				wipeLeft: function() { pages.showNext(); },
				wipeRight: function() {pages.showPrevious(); },
				wipeUp: function() {  },
				wipeDown: function() { },
				min_move_x: 20,
				min_move_y: 20,
				preventDefaultEvents: true
			});
			pages.addEventListener("close-pages", ()=>{
				console.log("close-pages received");
				this.skipTutorial();
			})
				
		})



	}
}

AppTutorial.register();