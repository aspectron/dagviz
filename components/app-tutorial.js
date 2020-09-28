import {html, css, BaseElement} from './base-element.js';
import {flowPagesStyle} from '/node_modules/@aspectron/flow-ux/flow-ux.js';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
				position:absolute;left:25%;top:15%;bottom:15%;width:50%;height:70%;
				border:2px solid var(--flow-primary-color);
				background-color:var(--bg-color, #FFF);box-sizing:border-box;
			}


			flow-pages .buttons flow-btn{
				display:flex;align-items:center;
			}
	




			flow-page{
				overflow:auto;
				padding:10px;
				box-sizing:border-box;
				padding-bottom:32px;
				background-color:var(--bg-color, #FFF);
			}

			flow-page > div.intro {
				object-fit: contain;
				min-width: 180px;
				text-align: justify;
				padding: 32px;
			}

			flow-page div img{
				max-width:95%;
				max-height:100%;	
			}

			/*.dagviz-slide{
				flex-direction:row;
				flex-wrap:wrap;0
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

			tr td {
				text-align: center;
			}

			tr:last-child td{border-bottom:0px;}
			.shadow{box-shadow:2px 2px 4px 0px rgba(0, 0, 0, 0.3);}
			td img{border:1px solid rgba(0, 0, 0, 0.1);height:auto;}
			div.items{margin-bottom:20px;}*/
			/*flow-page p{margin-bottom:10px;}*/

			[mobile] { display: none; }
			[desktop] { display: block; }

			@media(max-width:425px){
				[mobile] { display: block; }
				[desktop] { display: none; }
				flow-page{
					flex-direction:column;
					justify-content: flex-start; 
				}

				flow-page > div.intro {
					object-fit: contain;
					width: 99%;
					/*max-height: 70%;*/
					text-align: center;
					/*padding: 32px;*/
				}
				.dagviz-slide{
					flex-wrap:nowrap;
					flex-direction:column;
					justify-content:flex-start;
				}
			}

			flow-link {
				--flow-link-font-size: 20px;
				--flow-link-font-family: "Open Sans";
			}

			.text {
				display:block;
				font-size:20px;
				font-style:normal;
				font-family: "Open Sans";
				width:95%;
				margin:10px 0px;
				
			}

			img {
				margin-top: 10px;
			}


			.section {
				display:flex;
				flex-direction:column; 
				justify-content: space-evenly; 
				align-items: center;
				/*padding: 20px;*/
				margin:20px 5px;
			}

			
			[light] {
				display: var(--light-display);
			}
			[dark] {
				display: var(--dark-display);
			}

			.title {
				text-align:center;
				font-size:1.4em;
			}

			@media(max-width:425px){
				flow-pages{left:0px;right:0px;top:0px;width:100%;height:100%;}
				flow-pages .buttons flow-btn{font-size:0.6rem}

				.text {
					width: 100%;
					margin: 0px 0px;
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
		
		<flow-pages id="pages" class_="has-dots" @change="${this.onSlideChange}" dotoffset="${isMobile?0:40}">
		
  
					<flow-page class="active">
						<div class="section">
							<div class="text title">
								Welcome to DAGViz - DAG Visualizer and Explorer for the Kaspa Network
							</div>
						</div>
						
						<div class="section">
							<div class="text">
								Kaspa is a <flow-link href="https://en.bitcoin.it/wiki/Proof_of_work" target="_blank">PoW</flow-link>-based 
								ledger organized in a DAG (Directed Acyclic Graph) of blocks -- a 
								<flow-link href="https://docs.kas.pa/kaspa/reference/blockdag" target="_blank"> blockDAG.</flow-link>
								A new block gets added to the blockDAG every second and
								many blocks are created in parallel.</div>
							<img src="/resources/images/tutorial/light/frame1.png" light />
							<img src="/resources/images/tutorial/dark/frame1-dark.png" dark />
						</div>



						<div class="section">
							<div class="text">Unlike a blockchain, blocks are not 
								<flow-link href="https://en.bitcoin.it/wiki/Orphan_Block" target="_blank">orphaned</flow-link>.
								 Kaspa merges all blocks into one blockDAG by allowing them to reference multiple parents.
							</div>
						</div>
					


						<div class="section">
							<div class="text">
								Rather than deciding on which conflicting blocks to discard, 
								the consensus protocol governing the blockDAG, known as 
								<flow-link href="https://eprint.iacr.org/2018/104.pdf" target="_blank">PHANTOM</flow-link>, 
								orders blocks created in parallel. PHANTOM is a generalization 
								of Bitcoin’s Nakamoto Consensus.</div>
							<img src="/resources/images/tutorial/light/frame3.gif" light />
							<img src="/resources/images/tutorial/dark/frame3-dark.gif" dark />
						</div>


						<div class="section">
							<div class="text">
								PHANTOM favors blocks that are mined on top of up-to-date blocks and 
								that are propagated sufficiently quickly (i.e. 
								“<flow-link href="https://docs.kas.pa/kaspa/reference/consensus/blue-set" target="_blank">blue blocks</flow-link>”) 
								over those withheld or propagated over slow communication channels (i.e.
								“<flow-link href="https://docs.kas.pa/kaspa/reference/consensus/red-set" target="_blank">red blocks</flow-link>”).</div>
							<img src="/resources/images/tutorial/light/frame4.png" light />
							<img src="/resources/images/tutorial/dark/frame4-dark.png" dark />
						</div>
					


						<div class="section">
							<div class="text">
								The “<flow-link href="https://docs.kas.pa/kaspa/reference/consensus/blue-score" target="_blank">blue score</flow-link>”
								of a block is a generalization of the block height in a chain; 
								it represents the number of blue blocks in the block’s past.</div>
							<img src="/resources/images/tutorial/light/frame5.png" light />
							<img src="/resources/images/tutorial/dark/frame5-dark.png" dark />
						</div>
					

						<div class="section">
							<div class="text">
								The recursive process of selecting the parent with the highest blue score, 
								“<flow-link href="https://docs.kas.pa/kaspa/reference/consensus/selected-parent" target="_blank">the selected parent</flow-link>”,
								results in the identification of a chain within the blockDAG,
								“<flow-link href="https://docs.kas.pa/kaspa/reference/consensus/selected-parent-chain" target="_blank">the selected parent chain</flow-link>”.</div>
							<img src="/resources/images/tutorial/light/frame6.png" light />
							<img src="/resources/images/tutorial/dark/frame6-dark.png" dark />
						</div>



						<div class="section">
							<div class="text">
							Each new block inherits the colouring and thus the order of its past from its 
							selected parent, and merges blocks created in parallel to its selected parent, 
							following a <flow-link href="https://docs.kas.pa/kaspa/archive/archive/phantom-ghostdag#phantom" target="_blank">colouring and ordering</flow-link>
							procedure defined by the protocol.</div>
							<img src="/resources/images/tutorial/light/frame7.png" light />
							<img src="/resources/images/tutorial/dark/frame7.png" dark />
						</div>



						<div class="section">
							<div class="text">
							<flow-link href="https://docs.kas.pa/kaspa/reference/consensus/confirmations" target="_blank">Confirmations</flow-link>
							in PHANTOM are a generalization of confirmations in a chain,
							and are defined by the blue score of the chain blocks atop the transaction. 
							The fast block rate enables fast confirmation of transactions.</div>
							<img src="/resources/images/tutorial/light/frame8.gif" light />
							<img src="/resources/images/tutorial/dark/frame8.gif" dark />
						</div>
						
						<div class="section">
							<div class="text"><flow-link href="https://docs.kas.pa/kaspa/reference/blocks" target="_blank">Blocks</flow-link>
							contain <flow-link href="https://docs.kas.pa/kaspa/reference/transactions" target="_blank">transactions</flow-link>
							in the <flow-link href="https://docs.kas.pa/kaspa/reference/txo/utxo" target="_blank">UTXO</flow-link>-model format.</div>
							<img src="/resources/images/tutorial/light/frame9.png" light />
							<img src="/resources/images/tutorial/dark/frame9-dark.png" dark />
						</div>



						<div class="section">
							<div class="text">I. R. LEGEND</div>
							<img src="/resources/images/tutorial/light/legend1.png" light />
							<img src="/resources/images/tutorial/dark/legend-dark.png" dark />
						</div>


						<div class="section">
							<div class="text">Controls and keyboard shortcuts</div>
							<img src="/resources/images/tutorial/light/desktop-keys.png" light/>
							<img src="/resources/images/tutorial/dark/desktop-keys-dark.png" dark />
						</div>


					</flow-page>
					
					
				
			}

			<div slot="buttons" class="buttons">
				<!--flow-btn data-btn="skip" @click="${this.skipTutorial}">
					<svg><use href="/resources/fonts/fontawesome/sprites/light.svg#times"></use></svg>
					<span>SKIP</span>
				</flow-btn-->
				<div class="flex" style="align-items:center";le></div>
				<!--flow-btn data-btn="prev">
					<svg><use href="/resources/fonts/fontawesome/sprites/light.svg#arrow-alt-left"></use></svg>
					<span>PREVIOUS</span>
				</flow-btn-->

				<flow-btn data-btn="close" @click="${this.skipTutorial}">
					<span>CLOSE</span>
					<svg><use href="/resources/fonts/fontawesome/sprites/light.svg#times"></use></svg>
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

	firstUpdated(){

		dpc(1000, ()=>{

			let pages = this.shadowRoot.getElementById("pages");
			let wrapper = pages.shadowRoot.querySelector(".wrapper");
			// $(wrapper).touchwipe({
			// 	wipeLeft: function() { pages.showNext(); },
			// 	wipeRight: function() {pages.showPrevious(); },
			// 	wipeUp: function() {  },
			// 	wipeDown: function() { },
			// 	min_move_x: 20,
			// 	min_move_y: 20,
			// 	preventDefaultEvents: true
			// });

			pages.addEventListener("close-pages", ()=>{
				this.skipTutorial();
			})
		})

	}
}

AppTutorial.register();