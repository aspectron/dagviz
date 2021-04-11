import { LitElement, html, css } from 'lit-element/lit-element.js';
import {repeat} from 'lit-html/directives/repeat.js';

import "./k-settings.js";
export * from "./k-themes.js";
import {KPath} from "./k-path.js";
import {KLink, kLinkStyles} from "./k-link.js";
import {KBlock} from "./k-block.js";
import {KBlockCfm} from "./k-block-cfm.js";
import {KAPI} from "./k-api.js";
import {isElementVisible, paginationStyle, scollbarStyle, loadingImgStyle, isString} from "./k-utils.js";
import {buildPagination, getTS, copyToClipboard, renderPagination, btnStyle} from "./k-utils.js";
import {debounce, basePath, KAS} from "./k-utils.js";
import {KLastBlocks} from './k-last-blocks.js';


export {KAPI, KLink, kLinkStyles, KBlock, KBlockCfm, KPath, KLastBlocks};
export {isElementVisible, paginationStyle, scollbarStyle, loadingImgStyle, buildPagination};
export {getTS, copyToClipboard, renderPagination, btnStyle}



export class KExplorer extends LitElement{
	static get properties() {
		return {
			blocks:{type:Array},
			block:{type:Object},
			feeEstimates:{type:Object},
			transactions:{type:Array},
			transaction:{type:Object},
			addressOutputs:{type:Array}
		}
	}
	static get styles() {
		return [
			kLinkStyles, paginationStyle, loadingImgStyle, scollbarStyle,
			btnStyle,
			css`
			:host{
				display:flex;
			    flex-direction:column;
				position:relative;
				border:1px solid var(--k-explorer-border-color, #DDD);
				border-width:var(--k-explorer-border-width, 0px);
				min-width:200px;
				min-height:200px;
				background-color:var(--k-bg-color1, #323232);
				color:var(--k-color1, #c7c7c7);
				font-family:var(--k-font-family, 'Exo 2', Consolas,'Roboto Mono','Open Sans','Ubuntu Mono',courier-new,courier,monospace);
				font-weight:var(--k-font-weight, normal);
			}
			.heading{
				font-size:var(--k-heading-size, 1.2rem);
			    color:var(--k-heading-color, var(--k-color1, #FFF));
			    font-weight:var(--k-heading-weight, 700);
			    padding: 10px 20px 10px 2px;
    			border-bottom:2px solid #2489da;
    			border-color:var(--k-heading-border-color, #2489da);
    			display:flex;
    			align-items:center;
			}
			.heading>span{
				flex:1;
				width:100px;
			}
			.heading .btn{
				margin:0px 2px;
			}
			
			.holder{
				height:200px;
				flex:1;
			    display:flex;
			    flex-direction:column;
			    overflow:hidden;/* <--- fixes issue under Firefox */
			}
			.items{
				height:300px;
				flex:1;
			    box-sizing:border-box;
			    padding:0px 20px 20px;
			    margin-top:20px;
			    overflow:auto;
			}
			.items th:last-child:after{
				content:"";
				position:absolute;
				right:0px;
				top:0px;
				width:10px;
				height:100%;
				background-color:var(--k-bg-color1, #323232);
				margin-right:-7px;
				z-index:1000;
			}
			.pagination-box{
				border-top:1px solid var(--k-border-color1, #555);
				min-height:33px;
				background-color:rgba(255,255,255, 0.05)
			}
			.mask{
				position:absolute;
				left:0px;
				top:0px;
				right:0px;
				bottom:0px;
				width:100%;
				height:100%;
				/*transition:background-color 0.7s ease, z-index 0.3s ease;*/
				opacity:1;
				z-index:1000;
				background-color:rgba(0, 0, 0, 0.7);
				background-color:var(--k-loading-mask-bg-color, rgba(0, 0, 0, 0.7));
				animation: fade-out 1s ease forwards;
			}
			.mask .loading-logo{
				width: 100px;
				height: 100px;
				position: relative;
				left: 50%;
				top: 50%;
				margin: -50px 0 0 -50px;
			}

			:host(.loading) .mask{
				/*z-index:10000;
				opacity:1;*/
				animation-name: fade-in;
			}
			:host(:not(.loading)) .mask .loading-logo .animate{
				fill:#009688;
			}
			@keyframes fade-in{
				0% {z-index:-1; opacity:0}
				1% {z-index:1000; opacity:0}
				100% {z-index:1000; opacity:1}
			}
			@keyframes fade-out{
				0% {z-index:1000; opacity:1}
				99% {z-index:1000; opacity:0}
				100% {z-index:-1; opacity:0}
			}

			table{
				border-collapse:collapse;
    			border-spacing:0px;
    			width:100%;
    			box-sizing:border-box;
			}
			.items>table>td{width:120px}
			th, td{
				border-bottom:1px solid var(--k-border-color1, #555);
				text-align:left;padding:10px 5px;box-sizing:border-box;
			}
			th{border-bottom-width:0px}
			th.blue-score{max-width: 100px;width: 100px;}
			tr:hover td{
				background-color:var(--k-td-hover-color, rgba(255, 255, 255, 0.2));
			}
			td.accepting-block-hash{
				max-width:100px;overflow:hidden;
				text-overflow: ellipsis;
			}
			.transactions td.id,
			.transactions td.hash,
			.transactions td.payload-hash,
			.transactions td.sub-network-id{
				max-width:70px;overflow:hidden;
				text-overflow: ellipsis;
			}
			td.script-sig,
			td.id,
			td.payload{
				max-width:200px;overflow:hidden;
				text-overflow: ellipsis;
			}
			thead th{
				position:sticky;
				top:0px;
				box-shadow:3px 2px 2px 0px rgba(0, 0, 0, 0.4);
				background-color:var(--k-bg-color1, #323232);
				color:var(--k-color1, #c7c7c7);
			}

			.settings-outer{position:relative}
			.settings{
				position:absolute;
				right:0px;
				top: 100%;
			    margin-top: 1px;
			    width: 180px;
				z-index:-1;
				opacity:0;
				transition:all 0.2s ease;
				background-color:var(--k-settings-bg-color, var(--k-bg-color1, #323232));
				color:var(--k-settings-color, var(--k-color1, #c7c7c7));
				box-shadow:var(--k-settings-box-shadow, var(--k-box-shadow));
			}
			.settings-outer:hover .settings{
				z-index:1000;
				opacity:1;
			}

			.highlight{
				animation:var(--k-highlight-animation, k-highlight-ani-1) 2s;
			}

			.block-hashes{display:flex;flex-direction:row;justify-content:space-between;max-width:700px;}

			@keyframes k-highlight-ani-1{
				0%  {background: transparent;}
				50% {background:var(--k-highlight-bg-color, green);color:var(--k-highlight-color, #FFF)}
				100% {background: transparent;}
			}

			@keyframes k-highlight-ani-2{
				0%  {background: transparent;}
				50% {background:rgba(255,0,0,0.5);color:#FFF}
				100% {background: transparent;}
			}

			[class*="mask-icon-"]{
				background-color:var(--k-block-color, #c7c7c7);
				-webkit-mask-size:contain;
				-webkit-mask-repeat: no-repeat;
				-webkit-mask-size: 100%;
			    border: 0px;
			    -webkit-mask-position: center;
			}

			.heading .btn.close-btn{
				position:absolute;
				/*margin-left:10px;*/
				right:18px;
				top:-55px;
				padding:5px;
				width:30px;
				height:30px;
				border:0px;
				background-color:var(--k-close-btn-bg-color, var(--k-bg-color1, #323232));
			}
			.heading .btn .mask-icon-close{
				display:block;
				width:100%;
				height:100%;
				box-sizing:border-box;
				-webkit-mask-image:url("${basePath}resources/mask/close-2.png");
			}

			/* Tooltip container */
			.tooltip {
				position: relative;z-index:1;
			}
			
			/* Tooltip text */
			.tooltip .tooltiptext {
				visibility: hidden;
				display:flex;flex-direction:column;
				width:200px;
				font-size: 0.9rem;
				font-weight:normal;
				background-color: black;
				color: #fff;
				text-align: center;
				padding: 10px ;
				border-radius: 5px;
				/* Position the tooltip text - see examples below! */
				position: absolute;
				z-index:1;
				top:100%;
				left:1%;
			}
			
			/* Show the tooltip text when you mouse over the tooltip container */
			.tooltip:hover .tooltiptext {
				visibility: visible;
			}
			
			.link-tooltip {color:#07b9b9;text-decoration:none;font-weight:bold;}

			[hidden]{display:none}
			@media(max-width:425px){
				.heading{padding:5px 10px}
				th,td{padding:5px}
				.items{padding-left:0px;margin-top:0px;}
				.heading .btn.close-btn{
					right:15px;
					width:20px;
					height:20px;
				}
			}

		`];
	}
	constructor(...args){
		super(...args);
		this.api = new KAPI();
		window.kExplorer = this;
		this.blocksMap = {};
		this.state = {};
		this.highlightHashed = [];
		this.showCloseBtn = true;
		this.settings = {
			theme:'light',
			themes:['dark', 'light']
		}
		this.history = [];

		window.addEventListener("k-link-clicked", (e)=>{
			this.onKLinkClicked(e);
		});
		window.addEventListener("k-set-settings", e=>{
			this.setSettings(e.detail.settings)
		});
		window.addEventListener("k-settings", (e)=>{
			e.detail.settings = Object.assign({}, this.settings);
		});
		window.addEventListener("k-last-blocks-clicked", e=>{
			this.loadBlocksAndHighlight(e.detail.blocks);
		})
		this.debug = false;
		this.applySettingsFromUrl();
		this.setLoading(true);
		this.block = false;
		this.network = 'kaspatest';
	}

	setLoading(loading){
		this.classList.toggle("loading", !!loading)
	}
	updated(...args){
		super.updated(...args);
		this.setLoading(false);
		this.updatedHighlighted();
		/*
		[...this.shadowRoot.querySelectorAll(".sbar")].forEach(el=>{
			el.addEventListener('scroll', debounce(el, 'setScrollState', e=>{
				this.setScrollState(e, el)
			}), { passive: true });

			this.setScrollState(null, el);
		})
		*/
	}
	updatedHighlighted(){
		let highlighted = [...this.renderRoot.querySelectorAll(".highlight")];
		//console.log("highlighted", highlighted)
		let first = highlighted[0];
		let scrollable = first && first.closest(".sbar");
		if(first && scrollable){
			scrollable.scrollTop = first.offsetTop-first.offsetHeight;
		}
		setTimeout(()=>{
			highlighted.forEach(el=>{
				el.classList.remove("highlight")
			})
		}, 2000)
	}
	setScrollState(e, el){
		let clsEl = el.parentNode;
		if(el.scrollHeight > el.clientHeight){
			let scrolled = el.scrollTop * 100/(el.scrollHeight-el.clientHeight);
			//console.log("setScrollData:e", e,  scrolled )
			//clsEl.dataset.scrolled = scrolled;
			clsEl.classList.toggle('scrolled', scrolled>0)
			clsEl.classList.toggle('scrollable', scrolled<100)
		}else{
			clsEl.classList.remove('scrolled')
			clsEl.classList.remove('scrollable')
		}
		
		//document.documentElement.dataset.scroll = window.scrollY;
	}
	setApi(api){
		this.api = api;
	}
	applySettingsFromUrl(url=""){
		let sParams = new URL(url||location.href).searchParams;
		let keys = Object.keys(this.settings);
		let settings = Object.assign({}, this.settings), value;
		keys.forEach(key=>{
			value = sParams.get('k-'+key);
			if(value !== undefined && value !== null){
				settings[key] = value;
			}
		})
		this.setSettings(settings, false);
		this.debug = sParams.get("k-debug")==1;
	}
	setSettings(settings={}, skipUrlUpdate){
		let {theme} = settings;
		theme = theme.toLowerCase();
		if(theme != this.getTheme()){
			this.setTheme(theme);
		}

		this.settings = Object.assign({}, this.settings, settings)

		settings = Object.assign({}, this.settings);
		window.dispatchEvent(new CustomEvent("k-settings", {detail:{settings}}))
		if(!skipUrlUpdate){
			let currentState = history.state
			let url = new URL(location.href);
			let sParams = url.searchParams;
			let keys = Object.keys(settings).filter(k=>k!='themes')
			keys.forEach(k=>{
				sParams.set("k-"+k, settings[k]);
			});
			history.pushState(currentState, document.title, url.pathname+url.search)
		}
	}
	getTheme(){
		let theme = '';
		document.body.classList.forEach(cls=>{
			if(cls.indexOf("k-theme-") === 0)
				theme = cls.substr(8);
		})

		return theme;
	}
	setTheme(theme){
		let currentTheme = this.getTheme();
		if(currentTheme)
			document.body.classList.remove('k-theme-'+currentTheme);
		if(currentTheme != theme)
			document.body.classList.add('k-theme-'+theme)
	}
	ucFirst(str){
		return str[0].toUpperCase()+str.substr(1);
	}
	camelCase(str){
		return str.split("-").map((s, i)=>{
			return (i<1)?s:this.ucFirst(s);
		}).join("");
	}
	render() {
		let loading = this.renderLoading();
		let lastBlock = html`<k-last-blocks></k-last-blocks>`;

		let renderer = this._action?"render"+this.ucFirst(this._action):false;
		let body = html``;
		if(this[renderer]){
			body = this[renderer]();
		}

		return html `${body}${lastBlock}${loading}`;
	}
	renderLoading(){
		return html`<div class="mask">
			<svg class="loading-logo" width="133" height="198" viewBox="0 0 133 198" fill="none" xmlns="http://www.w3.org/2000/svg">
				<defs>
					<linearGradient id="left-to-right">
						<stop offset="0" stop-color="#009688">
							<animate dur="5s" attributeName="offset" fill_="freeze" from="0" to="1" repeatCount="indefinite" />
						</stop>
						<stop offset="0" stop-color="#FFFFFF">
							<animate dur="5s" attributeName="offset" fill_="freeze" from="0.5" to="1" repeatCount="indefinite" />
						</stop>
					</linearGradient>
				</defs>
				<path class="animate" fill-rule="evenodd" clip-rule="evenodd"
					fill="url(#left-to-right)"
					fill_="#009688"
					d="M45.041,92V52.184L8.619,80.639,0,69.607,34.915,42.328,3,17.393,11.619,6.361,45.041,32.472V0h14V92Z" transform="scale(2)"
					xxd="M43.382 0L0 30.5V90.5L89 149.5V179L0 120V180.5L33 157.491L94.5 198L133 172V120L110 104.252L133 89V28L100 6L43.382 45V0ZM33 67.5V22L11 38V82L66.5 119.5L77.5 127L88.5 134L99 141.5L120.5 126L99 112L88.5 104.5L55 82L120.5 36L99 22L33 67.5ZM22 150L11 142.5V157.5L22 150ZM120.5 142.5V165L100 178.76V156L120.5 142.5ZM120.5 82V51.5L77.5 82L99 96L120.5 82Z" 
					/>
			</svg>
		</div>`;
	}
	renderBlock(){
		let data = this.block;
		const isBlue = !!data.acceptingBlockHash || !!data.isChainBlock
		let par_only = data.parentBlockHashes.filter(val => !data.acceptedBlockHashes.includes(val));
		let par_mer = data.parentBlockHashes.filter(val => data.acceptedBlockHashes.includes(val));
		let mer_only = data.acceptedBlockHashes.filter(val => !data.parentBlockHashes.includes(val));
		// console.log("PARENTS AND MERGED", par_mer);
		// console.log("PARENTS ONLY",par_only);
		// console.log("MERGED ONLY",mer_only);
		if(!data)
			return html``;
		return html`
		<div class="holder block" @click="${this.onBlockClick}">
			<div class="heading">
				<span>Block</span>
				${this.showBackBtn ? html`<a part="btn btn-back" class="btn btn-back" data-action="back">BACK</a>`:''}
				${this.showCloseBtn ? html`<a class="btn close-btn" data-action="close"><i class="mask-icon-close"></i></a>`:''}
			</div>
			<div class="sbar-top"></div>
			<div class="items sbar" >
				<!--div style="width:2500px">xxx</div-->
				${this.debug?html`<pre>${this.renderJSON(data)}</pre>`:''}
				<table>
                    <tr>
						<td>Block Hash</td>
                    	<td>
                    		${data.blockHash} 
		                    <i @click="${this.copyHashToClipboard}" class='is-link fal fa-clipboard'></i>
		                    <i @click="${this.openLinkInNewWindow}" class='is-link fal fa-map-marker-alt'></i>
	                    </td>
                    </tr>
                    <tr><td>Version</td><td><strong>${data.version}</strong></td></tr>
                    <tr><td>Bits</td><td><strong>${data.bits}</strong></td></tr>
                    <tr><td>Timestamp</td><td><strong>${getTS(new Date(+data.timestamp))}</strong> (${data.timestamp})</td></tr>
                    <tr><td><flow-reference>Blue Score<div slot="tooltip">
							The blue score of a block is the number of blue blocks in its past. 
							<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#blue-score" 
							target="_blank">Learn more</a></div></flow-reference></td>
					<td><strong>${data.blueScore}</strong></td></tr>
					${isBlue?html`<tr>
                        <td><flow-reference>Confirmations <div slot="tooltip">
							A block's number of confirmations is the difference in blue score between the selected tip and the block's accepting block + 1.
							<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#confirmations" 
							target="_blank">Learn more</a></div></flow-reference></td>
                        <td>
                            <strong>
                                <k-block-cfm
                                    blue-score="${data.blueScore}",
                                    cfm="${data.confirmations}"></k-block-cfm>
                            </strong>
                        </td>
                    </tr>`:''}
                    
                    <tr><td><flow-reference>Is Chain Block<div slot="tooltip">
							A block on the selected parent chain.
							<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#chain-block" 
							target="_blank">Learn more</a></div></flow-reference></td>
							<td><strong>${data.isChainBlock}</strong></td></tr>
                    <tr><td><flow-reference>Mass<div slot="tooltip">
							A measure used to approximate the storage and computational costs of transactions and blocks. 
							<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#mass" 
							target="_blank">Learn more</a></div></flow-reference></td>
							<td><strong>${data.mass}</strong></td></tr>
                    <tr><td>Nonce</td><td>${data.nonce}</td></tr>
                    <tr title="ECMH commitment to the UTXO up to and including this block.">
                    	<td>UTXO Commitment</td>
                    	<td _class="k-link" _data-b-hash="${data.utxoCommitment}">${data.utxoCommitment}</td>
                    </tr>
                    <tr title="Merkle Root of included transaction hashes">
                    	<td>Hash Merkle Root</td>
                    	<td _class="k-link" _data-b-hash="${data.hashMerkleRoot}">${data.hashMerkleRoot}</td>
                    </tr>
                    <tr title="Merkle Root of accepted transaction IDs">
                    	<td>Accepted ID Merkle Root</td>
                    	<td _class="k-link" _data-b-hash="${data.acceptedIDMerkleRoot}">${data.acceptedIDMerkleRoot}</td>
                    </tr>
                    <tr>
                    	<td>Accepting Block Hash</td>
                    	<td class="k-link" data-b-hash="${data.acceptingBlockHash}">${data.acceptingBlockHash}</td>
                    </tr>
                    <!-- <tr>
                    	<td>Parent Block Hashes</td>
                    	<td>
                    		${(data.parentBlockHashes||[]).map(v=>
                    			html`<div class="k-link" data-b-hash="${v}">${v}</div>`
                    		)}
                    	</td>
					</tr> -->
					<tr>
						<td><flow-reference>Block Hashes<div slot="tooltip">
						Block Hashes is the combination of Parent Block Hashes and <a class="link-tooltip" href="https://docs.kas.pa/kaspa/reference/consensus/merged-blocks" 
							target="_blank">Merged Block Hashes</a></div></flow-reference>
						</td>
                    	<td>
                    		${(par_mer||[]).map(v=>
                    			html`<div class="block-hashes k-link"><div class="k-link" data-b-hash="${v}">${v}</div><div>P, M</div></div>`
							)}
							${(par_only||[]).map(v=>
                    			html`<div class="block-hashes k-link"><div class="k-link" data-b-hash="${v}">${v}</div><div>P</div></div>`
							)}
							${(mer_only||[]).map(v=>
                    			html`<div class="block-hashes k-link"><div class="k-link" data-b-hash="${v}">${v}</div><div>M</div></div>`
                    		)}
						</td>
					</tr>
                    <!--tr>
                    	<td>Child Block Hashes</td>
                    	<td>
                    		${(data.childBlockHashes||[]).map(v=>
                    			html`<div class="k-link" data-b-hash="${v}">${v}</div>`
                    		)}
                    	</td>
                    </tr-->
                </table>
            </div>
            <div class="sbar-bottom"></div>
        </div>
        ${this.renderTransactions("Block Transactions", true)}
		`
	}
	renderBlocks(){
		const blocks = this.blocks || [];
		let {highlightHashed} = this;
		let highlight = (blockHash)=>highlightHashed.includes(blockHash);
		let random = ()=>Math.random()*1e20;
		this.highlightHashed = [];
		return html`
		<div class="holder blocks" @click="${this.onBlocksClick}">
			<div class="heading">
				<span>Blocks</span>
				${this.hideSettings?'': html`<div class="settings-outer">
					<a part="setting-icon" class="btn btn-settings" data-action="settings">&#9881;</a>
					<div class="settings"><k-settings class="sm-text"></k-settings></div>
				</div>`}
				${this.showCloseBtn ? html`<a class="btn close-btn" data-action="close"><i class="mask-icon-close"></i></a>`:''}
				<!--a part="btn btn-refresh" class="btn btn-refresh primary" data-action="refresh-blocks">REFRESH</a-->
			</div>
			<div class="items sbar" >
				<table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
					<thead>
						<tr>
							<th class="blue-score">Blue Score</th>
							<th class="name">Hash</th>
							<th class="confirmations">Confirmations</th>
							<th class="mass">Mass</th>
							<th class="is-chain-block">Chain Block</th>
							<th class="timestamp">TS</th>
							<th class="bits">Bits</th>
							<th class="version">Version</th>
							<th class="accepting-block-hash">Accepting Block Hash</th>
						</tr>
					</thead>
					<tbody>
						${repeat(blocks, b=>b.blockHash, (b, index) => html
							`<tr class="block-row ${highlight(b.blockHash)?'highlight x'+random():''}" hash="${b.blockHash}">
								<td class="blue-score k-link" data-action="b-page">${b.blueScore}</td>
								<td class="name k-link" data-action="b-page">${b.name}</td>
								<td class="confirmations"><k-block-cfm blue-score="${b.blueScore}" cfm="${b.confirmations}"></k-block-cfm></td>
								<td class="mass">${b.mass}</td>
								<td class="is-chain-block">${b.isChainBlock?"YES": "NO"}</td>
								<td class="timestamp">${b.timestamp}</td>
								<td class="bits">${b.bits}</td>
								<td class="version">${b.version}</td>
								<td class="accepting-block-hash k-link" data-b-hash="${b.acceptingBlockHash}">${b.acceptingBlockHash}</td>
							</tr>`
						)}
					</tbody>
				</table>
			</div>
			${renderPagination(this.blocksPagination)}
		</div>
		`;
	}
	renderFeeEstimates(){
		let data = this.feeEstimates;
		if(!data)
			return html``;
		return html`
		<div class="holder fee-estimates">
			<div class="heading">
				<span>Fee Estimates</span>
				<a part="btn btn-back" class="btn btn-back" data-action="back">BACK</a>
				${this.showCloseBtn ? html`<a class="btn close-btn" data-action="close"><i class="mask-icon-close"></i></a>`:''}
			</div>
			<div class="items sbar" >
				<table>
                    <tr><td>High Priority</td><td><strong>${data.highPriority}</strong></td></tr>
                    <tr><td>Normal Priority</td><td><strong>${data.normalPriority}</strong></td></tr>
                    <tr><td>Low Priority</td><td><strong>${data.lowPriority}</strong></td></tr>
                </table>
            </div>
        </div>
		`
	}
	renderTransactions(title="Transactions"){
		const items = this.transactions || [];
		//console.log("TRANSACTIONS:",items);
		return html`
		<div class="holder transactions" @click="${this.onTXsClick}">
			<div class="heading">
				<span>${title}</span>
				${this.hideSettings?'':html`
				<div class="settings-outer">
					<a part="setting-icon" class="btn btn-settings" data-action="settings">&#9881;</a>
					<div class="settings"><k-settings class="sm-text"></k-settings></div>
				</div>`}
				${(this.showCloseBtn && this._action=='transactions') ? html`<a class="btn close-btn" data-action="close"><i class="mask-icon-close"></i></a>`:''}
				<!--a part="btn btn-refresh" class="btn btn-refresh primary" data-action="refresh-tx">REFRESH</a-->
			</div>
			<div class="items sbar" >
				${this.debug?html`<pre>${this.renderJSON(items)}</pre>`:''}
				<table cellpadding="0" cellspacing="0" border="0">
					<thead>
						<tr>
							<th class="id"><flow-reference>ID<div slot="tooltip">
								A non-malleable transaction identifier used for referring to transactions everywhere, except in the block hash merkle root.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#transaction-id" 
								target="_blank">Learn more</a></div></flow-reference></th>
							<th class="name"><flow-reference>Hash<div slot="tooltip">
								A transaction identifier used only when building the block hash merkle root.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#transaction-hash"
								target="_blank">Learn more</a></span></span></th>
							<!-- <th class="confirmations">Confirmations</th> -->
							<th class="ins-outs" style="text-align:center;">Inputs / Outputs</th>
							<!-- <th class="mass">Mass</th> -->
							<!-- <th class="payload-hash"><flow-reference>Payload hash<div slot="tooltip">
								The hash of the arbitrary data field, payload, in a transaction.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#payload-hash"
								target="_blank">Learn more</a></div></flow-reference></th>
							<th class="payload" width="10%"><flow-reference>Payload<div slot="tooltip">
								A field inside a transaction, used to store arbitrary data and code (i.e., subnetwork-specific logic).
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#payload"
								target="_blank">Learn more</a></div></flow-reference></th> -->
							<th class="total-value" style="text-align:center;">Output Value (KAS)</th>
							<th class="lock-time">Lock Time</th>
							<!-- <th class="gas"><flow-reference>GAS<div slot="tooltip">
								A measure of computation cost for subnetwork transactions.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#gas"
								target="_blank">Learn more</a></div></flow-reference>
							</th> -->
							<th class="sub-network-id"><flow-reference>Sub-Network id<div slot="tooltip">
								The subnetwork mechanism in Kaspa's consensus layer allows nodes with a common interest to form 
								nested networks with their own rules within the greater Kaspa network.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#subnetwork"
								target="_blank">Learn more</a></div></flow-reference>
							</th>
							<!-- <th class="accepting-block-hash"><flow-reference>Merging Chain Block Hash<div slot="tooltip">
								When a chain block B is added to the DAG, transactions from blue blocks that B merges, 
								which spend outputs available in the UTXO set, are accepted, while transactions which do not are rejected.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#accepted-transactions"
								target="_blank">Learn more</a></div></flow-reference>
							</th> -->
						</tr>
					</thead>
					<tbody>
						${repeat(items, t=>t.hash, (t, index) => html
							`<tr class="tx-row" hash="${t.hash}" data-id="${t.id}">
								<td class="id k-link" data-action="t-page-id">${t.txId}</td>
								<td class="hash k-link" data-action="t-page">${t.hash}</td>
								<td class="ins-outs" style="text-align:center;">${t.inputCount} / ${t.outputCount}</td>
								<td class="total-value" style="text-align:center;">${KAS(t.totalOutputValue)}</td>
								<td class="lock-time">${t.lockTime}</td>
								<td class="sub-network-id">${t.subnetworkId}</td>
							</tr>`
						)}
					</tbody>
				</table>
			</div>
			${renderPagination(this.transactionsPagination)}
		</div>
		`;
	}
	commas(v, precision = 0) {
		var parts = parseFloat(v).toString().split('.');
//		var parts = parseFloat(v).toFixed(parseInt(precision)).toString().split('.');
		parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		   return parts.join('.');
	   }
	renderTransaction(){
		const t = this.transaction;
		if(!t)
			return html``;
		//let data = this.block;
		let amount_outputs = t.outputs.reduce((acc, cur) => acc + parseInt(cur.value),0);
		let amount_inputs = t.inputs.reduce((acc, cur) => acc + parseInt(cur.value||0),0);
		let fees =  amount_inputs - amount_outputs;
		
		if (amount_inputs == 0)
			fees = 0;

		if(t.inputs != t.inputCount) {
			amount_inputs = 'N/A';
			fees = 'N/A';
		}
		else  {
			amount_inputs = KAS(amount_inputs)+' KAS';
			fees = this.commas(fees);
		}
		amount_outputs = KAS(amount_outputs)+' KAS';
// console.log("BLOCK DATA IN TRANSACTION!",this.block)
		return html`
		<div class="holder block" @click="${this.onTXClick}">
			<div class="heading">
				<span>Transaction</span>
				${this.showBackBtn ? html`<a part="btn btn-back" class="btn btn-back" data-action="back">BACK</a>`:''}
				${this.showCloseBtn ? html`<a class="btn close-btn" data-action="close"><i class="mask-icon-close"></i></a>`:''}
			</div>
			<div class="items sbar" >
				${this.debug?html`<pre>${this.renderJSON(t)}</pre>`:''}
				<table>
                    <tr class="id"><td>ID</td><td>${t.txId}</td></tr>
					<tr class="hash"><td>Hash</td><td>${t.hash}</td></tr>
					<tr class="hash"><td>Block Hash</td><td><div class="k-link" data-b-hash="${t.blockHash}">${t.blockHash}</div></td></tr>
					<!-- <tr class="confirmations"><td>Confirmations</td><td>${this.block.confirmations}</td></tr> -->
					<!-- <tr class="mass"><td>Mass</td><td>${t.mass}</td></tr> -->
					<!-- <tr class="payload-hash"><td>Payload Hash</td><td>${t.payloadHash}</td></tr> -->
					<!-- <tr class="payload"><td>Payload</td><td>${t.payload}</td></tr> -->
					<tr class="lock-time"><td>Lock Time</td><td>${t.lockTime}</td></tr>
					<!-- <tr class="gas"><td>GAS</td><td>${t.gas}</td></tr> -->
					<tr class="sub-network-id"><td>Subnetwork Id</td><td>${t.subnetworkId}</td></tr>
					<!-- <tr class="accepting-block-hash">
						<td>Merging Chain Block Hash</td>
						<td class="k-link" data-b-hash="${t.acceptingBlockHash}">${t.acceptingBlockHash}</td>
					</tr> -->
					<tr class="ins-outs">
						<td>Inputs / Outputs</td>
						<td>${t.inputs.length} / ${t.outputs.length}</td>
					</tr>
					<tr class="">
						<td>Input Amount</td>
						<td>${amount_inputs}</td>
					</tr>
					<tr class="">
						<td>Output Amount</td>
						<td>${amount_outputs}</td>
						
					</tr>
					<tr class="">
						<td>Fees</td>
						<td>${fees}</td>
					</tr>
					<!--tr class="accepting-blue-score"><td>Accepting Blue Score</td><td>${t.acceptingBlockBlueScore}</td></tr-->
                </table>
                <div class="heading"><span>Inputs</span></div>
                <table cellpadding="0" cellspacing="0" border="0">
					<thead>
						<tr>
							<th class="id" style="max-width:100px;">Index</th>
							<th class="script-sig" width="49%">Script Sig</th>
							<th class="index" width="1%">Index</th>
							<th class="sequence" width="1%">Sequence</th>
						</tr>
					</thead>
					<tbody>

						${repeat(t.inputs, a=>a.previousTransactionId, (a, index) => html
							`<tr class="input-row" data-id="${a.previousTransactionId}">
								<td class="k-link" style="max-width:100px;" data-t-page-id="${a.previousTransactionId}">${index}</td>
								<td class="script-sig">${a.signatureScript}</td>
								<td class="index">${a.outputIndex}</td>
								<td class="sequence">${a.sequence}</td>
							</tr>`
						)}
					</tbody>
				</table>
				<div class="heading"><span>Outputs</span></div>
                <table cellpadding="0" cellspacing="0" border="0">
					<thead>
						<tr>
							<th class="address" width="49%">Address</th>
							<th class="script-pub-key" width="40%">Script Pub Key</th>
							<th class="value" width="11%">Value</th>
						</tr>
					</thead>
					<tbody>
						${repeat(t.outputs, (a, index) => html
							`<tr class="output-row">
								<td class="address k-link" data-t-address="${a.address}">${this.network}:${a.address}</td>
								<td class="script-pub-key">${a.scriptPubKeyHex}</td>
								<td class="value">${KAS(a.value)}</td>
							</tr>`
						)}
					</tbody>
				</table>
            </div>
        </div>
		`
	}

	renderAddress(){
		console.log("RENDERING address items:",this);
		const items = this.addressOutputs || [];
		console.log("ADDRESS TRANSACTIONS:",items);
		return html`
		<div class="holder address" @click="${this.onAddressClick}">
			<div class="heading">
				<span>ADDRESS: ${this.network}:${this.address}</span>
				${this.hideSettings?'':html`
				<div class="settings-outer">
					<a part="setting-icon" class="btn btn-settings" data-action="settings">&#9881;</a>
					<div class="settings"><k-settings class="sm-text"></k-settings></div>
				</div>`}
				${(this.showCloseBtn && this._action=='address') ? html`<a class="btn close-btn" data-action="close"><i class="mask-icon-close"></i></a>`:''}
			</div>
			<div class="items sbar" >
				${this.debug?html`<pre>${this.renderJSON(items)}</pre>`:''}
				<table cellpadding="0" cellspacing="0" border="0">
					<thead>
						<tr>
							<th class="id"><flow-reference>Transaction ID<div slot="tooltip">
								A non-malleable transaction identifier used for referring to transactions everywhere, except in the block hash merkle root.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#transaction-id" 
								target="_blank">Learn more</a></div></flow-reference></th>
							<th class="name"><flow-reference>Transaction Hash<div slot="tooltip">
								A transaction identifier used only when building the block hash merkle root.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#transaction-hash"
								target="_blank">Learn more</a></span></span></th>
							<th class="ins-outs" style="text-align:center;white-space:nowrap;">Output Index</th>
							<th class="total-value" style="text-align:center;white-space:nowrap;">Output Value / Tx Total (KAS)</th>
							<th class="tx-time">Transaction Time</th>
							<th class="lock-time">Lock Time</th>
							<th class="sub-network-id"><flow-reference>Sub-Network id<div slot="tooltip">
								The subnetwork mechanism in Kaspa's consensus layer allows nodes with a common interest to form 
								nested networks with their own rules within the greater Kaspa network.
								<a class="link-tooltip" href="https://docs.kas.pa/kaspa/glossary#subnetwork"
								target="_blank">Learn more</a></div></flow-reference>
							</th>
						</tr>
					</thead>
					<tbody>
						${repeat(items, t=>t.hash, (t, index) => html
							`<tr class="tx-row" hash="${t.hash}" data-id="${t.id}">
								<td class="id k-link" data-action="t-page-id">${t.txId.substring(0,16)}...</td>
								<td class="hash k-link" data-action="t-page">${t.hash.substring(0,16)}</td>
								<td class="index" >${t.index}</td>
								<td class="total-value" style="text-align:center;">${KAS(t.value)} / ${KAS(t.totalOutputValue)}</td>
								<td>${getTS(new Date(+t.transactionTime))}</td>
								<td class="lock-time">${t.lockTime}</td>
								<td class="sub-network-id">${t.subnetworkId}</td>
							</tr>`
						)}
					</tbody>
				</table>
			</div>
			${renderPagination(this.addressPagination)}
		</div>
		`;
	}
	renderJSON(obj){
		return JSON.stringify(obj, null, "\t")
	}
	callApi(paths, params={}){
		if(isString(paths))
			paths = paths.split("/");
		let method = paths.shift()||"";
		let action = this.camelCase(method);
		if(!this[`${action}Api`])
			return
		if(this._action != action){
			this.history.push({paths:[method, ...paths], params});
			while(this.history.length > 10){
				this.history.shift();
			}
		}
		this._action = action;
		this.state[method] = {paths, params}
		this.fireKEvent({method, paths, params});
		this.setLoading(true);
		this[`${action}Api`](paths, params)
	}

	loadBlocksAndHighlight(hashes){
		if(!hashes.length)
			return
		this.highlightHashed = hashes;
		let {params} = this.getState('blocks', {params:{}});
		params.skip = 0;
		params.order = 'desc';
		this.callApi(["blocks"], params);
	}

	onKLinkClicked(e){
		const {hash} = e.detail;
		//console.log("onKLinkClicked", hash)
		this.showBlock(hash);
	}

	getState(key, defaults={}){
		return this.state[key] || defaults;
	}

	onBlockClick(e){
		this._onElClick(e);
	}

	onTXsClick(e){
		this._onElClick(e);
	}

	onTXClick(e){
		this._onElClick(e);
	}

	onBlocksClick(e){
		this._onElClick(e);
	}

	onAddressClick(e){
		this._onElClick(e);
	}

	_onElClick(e){
		const $target = $(e.target);
		if($target.closest("[data-pagination]").length){
			let $pa = $target.closest("[data-pagination]");
			return this.handlePaginationClick($pa.attr("data-pagination"), $target)
		}

		const $hash = $target.closest("[hash]");
		const $txid = $target.closest("[data-id]");
		const $dataAction = $target.closest("[data-action]");
		const $dataBHash = $target.closest("[data-b-hash]");
		const $dataTPageId = $target.closest("[data-t-page-id]");
		const $dataTPageHash = $target.closest("[data-t-page-hash]");
		const $dataTAddress = $target.closest("[data-t-address]");
		let hash = $hash.attr("hash");
		let txid = $txid.attr("data-id");
		let action = $dataAction.attr("data-action");
		if($dataBHash.length){
			action = 'b-page';
			hash = $dataBHash.attr("data-b-hash");
		}
		if($dataTPageId.length){
			action = 't-page-id';
			hash = $dataTPageId.attr("data-t-page-id");
		}
		if($dataTPageHash.length){
			action = 't-page';
			hash = $dataTPageHash.attr("data-t-page-hash");
		}
		if($dataTAddress.length){
			action = 't-address';
			hash = $dataTAddress.attr("data-t-address");
		}
		switch(action){
			case 'close':
				this.close()
			break;
			case 'back':
				this.openLastPage();
			break;
			case 'refresh-tx':{
				let {params, paths} = this.getState('transactions', {params:{}});
				if(this._action == 'transactions'){
					this.callApi(["transactions", ...paths], params);
				}else{
					this.setLoading(true);
					this.transactionsApi(paths||[], params);
				}
			}
			break;
			case 'refresh-blocks':
				let {params} = this.getState('blocks');
				this.callApi(["blocks"], params);
			break;
			case 'b-page':
				if(!hash){
					let $hashEl  = $target.closest("[hash]");
					hash = hash || $hashEl.attr("hash");
				}
				if(hash)
					this.callApi(['block', hash]);
			break;
			case 't-page':
				this.callApi('transaction/hash/'+hash);
			break;
			case 't-address':
				this.callApi('address/'+hash);
			break;
			case 't-page-id':
				this.callApi('transaction/id/'+ txid);
			break;
			case 'b-panel':
				this.showBlock(hash);
			break;

		}
	}

	openLastPage(){
		this.history.pop();
		let history = this.history.pop();
		if(history){
			return this.callApi(history.paths, history.params);
		}
		if(this.blocks){
			this._action = "blocks";
			this.requestUpdate();
			let {params} = this.getState('blocks');
			this.fireKEvent({method:"blocks", params});
		}else{
			this.callApi(["blocks"], {});
		}
	}

	handlePaginationClick(method, $target, paths_=[]){
		if($target.hasClass("disabled") || $target.hasClass("active"))
			return
		let skip = $target.attr("data-skip");
		let {params, paths} = this.getState(method, {params:{}});
		params.skip = skip;
		//console.log("params", params)
		this.setLoading(true);
		this[`${method}Api`](paths, params);
	}

	async showBlock(hash){
		let box = this.blockHolder.querySelector(`k-block#block${hash}`)
		if(!box){
			box = document.createElement("k-block");
			box.id = `block${hash}`;
			box.hash = hash;
			this.blockHolder.appendChild(box);
		}
		box.highlight();
	}

	firstUpdated(){
		this.blockHolder = document.querySelector(".block-boxes-holder");
		this.lastBlocksEl = this.renderRoot.querySelector("k-last-blocks");
		if(!this.blockHolder){
			this.blockHolder = document.createElement("div")
			this.blockHolder.classList.add(".block-boxes-holder")
			document.body.insertBefore(this.blockHolder, document.body.querySelector(":last-child"));
		}
		/*
		setInterval(()=>{
			this.lastBlocksEl.updateBlocks([
				{blockHash:'000039b9b7bce07a1b034976fe21a21c58bdc946df5debd5dd3ff16832eec116'},
				{blockHash:'0000398f8a9a643499934231e0700e1f84c849329fe5740de8722092855f5a8c'}
			])
		}, 10000)
		this.lastBlocksEl.updateBlocks([
			{blockHash:'000039b9b7bce07a1b034976fe21a21c58bdc946df5debd5dd3ff16832eec116'},
			{blockHash:'0000398f8a9a643499934231e0700e1f84c849329fe5740de8722092855f5a8c'}
		])
		*/
	}

	buildUrlState(){
		if(!isElementVisible(this)){
			//console.log("k-explorer not visible")
			return {};
		}
		let action = this._action;
		switch(action){
			case "block":{
				let {paths} = this.getState('block');
				if(paths[0])
					return {method:"block", paths}
			}
			break;
			case "feeEstimates":{
				return {method:'fee-estimates'}
			}
			case "transactions":{
				let {paths, params} = this.getState('transactions', {params:{}});
				return {method:'transactions', paths, params}
			}
			case "transaction":{
				let {paths, params} = this.getState('transaction', {params:{}});
				return {method:'transaction', paths, params}
			}
			case "address":{
				let {paths, params} = this.getState('address', {params:{}});
				return {method:'address', paths, params}
			}
			break;
		}

		let {params} = this.getState('blocks', {params:{}});
		return {method:"blocks", paths:[], params};
	}

	async blocksApi(paths, params={}){


		let total = await this.api.getBlockCount().req;
		let result = this.api.getBlocks(params);
		let {params:reqParams, req} = result;
		let res = await req;
		let {skip, limit} = reqParams;
		let pagination = buildPagination(total, skip, limit);
		pagination.type = "blocks";
		this.state['blocks'] = {params: reqParams, pagination};

		//console.log("blocksApi:result", res, result);//JSON.stringify(pagination, null, "\t"))
		let blocks = [];
		(res||[]).forEach(b=>{
			b.name = b.blockHash.replace(/^[0]{1,}/g, '').substr(0, 6);
			blocks.push(b)
			this.blocksMap[b.blockHash] = b;
		})
		this.blocks = blocks;
		this.blocksPagination = pagination;
		this.fireKEvent({method:"blocks", params:reqParams});
		return result;
	}

	async blockApi(paths){
		this.state['block'] = {params: {}, paths};
		let result = this.api.getBlock(paths.join("/"));
		let {req} = result;
		let block = await req;
		if(!block)
			return false

		let {items, pagination} = await this.getTransactions(['block', block.blockHash], {});
		this.transactions = items;
		this.transactionsPagination = pagination;
		if(paths && paths.length)
			this.__paths = paths;
		this.block = block;
		console.log("block", block);
		console.log("block pagination~", pagination);
		this.fireKEvent({method:"block", paths:paths, block});
		return result;
	}

	async feeEstimatesApi(paths){
		let hash = paths.shift();
		this.state['fee-estimates'] = {params: {}, paths:[]};
		let result = this.api.getFeeEstimates();
		let {req} = result;
		let feeEstimates = await req;

		this.feeEstimates = feeEstimates;
		console.log("feeEstimates", feeEstimates)
		this.fireKEvent({method:"fee-estimates", paths:[]});
		return result;
	}

	async transactionsApi(paths, params={}){
		let result = await this.getTransactions(paths, params);
		let {reqParams, pagination, items} = result;
		this.state['transactions'] = {params: reqParams, pagination, paths};

		console.log("transactionsApi:items", items);
		this.transactions = items;
		this.transactionsPagination = pagination;
		if(paths && paths.length)
			this.__paths = paths;
		this.fireKEvent({method:"transactions", paths, params:reqParams});
		return result;
	}

	async addressApi(paths, params={}){
		let result = await this.getTransactionsForAddress(paths, params);
		console.log("RESULT API API API API ::::", result);
		let {reqParams, pagination, items} = result;
		this.state['address'] = {params: reqParams, pagination, paths};

		console.log("addressApi:items", items);
		this.addressOutputs = items;
		this.address = paths[0] || ':-/';
		this.addressPagination = pagination;
		if(paths && paths.length)
			this.__paths = paths;
		this.fireKEvent({method:"address", paths, params:reqParams});
		return result;
	}
		
	getTransactionsForAddress(paths, params){
		console.log("ALOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO", paths, params);
		return new Promise(async(resolve, reject)=>{
			let items = [];
			let total = 0;
			paths = paths && paths.length ? paths : (this.__paths || []);
			console.log("paths paths paths paths paths paths ",paths);
			try{
				total = await this.api.getTransactionsForAddressCount(paths[0]).req;
				let result = await this.api.getTransactionsForAddress(paths[0], params);
				let {params:reqParams, req} = result;
				let items = await req;
				let {skip, limit} = reqParams;
				let pagination = buildPagination(total, skip, limit);
				pagination.type = "address";
				resolve({items, pagination, reqParams})
			}catch(ex){
				console.log(ex);
			}
		})
	}

	async transactionApi(paths, params={}){
		let result = this.api.getTransaction(paths, params);
		let {req} = result;
		let transaction = await req;
		this.state['transaction'] = {params, paths};
		console.log("transactionApi", transaction);
		this.transaction = transaction;
		this.fireKEvent({method:"transaction", paths, params});
		return result;
	}

	getTransactions(paths, params){
		return new Promise(async(resolve, reject)=>{
			let total = 0;

			paths = paths && paths.length ? paths : (this.__paths || []);
		try {
			
				let result = this.api.getTransactions(paths, params);
				let {params:reqParams, req} = result;
				let res = await req;
				let {skip, limit} = reqParams;
				
				let pagination = buildPagination(total, skip, limit);
				pagination.type = "transactions";
				
				console.log("getTransactions:result", res, result);//JSON.stringify(pagination, null, "\t"))
				let items = [];
				let txs = res.transactions || (res.forEach ? res:[])
				txs.forEach(tx=>{
					tx.name = tx.hash.replace(/^[0]{1,}/g, '').substr(0, 6);
					items.push(tx)
					//this.transactionsMap[b.blockHash] = b;
				})
				resolve({items, pagination, reqParams})

			} catch(ex) {
				console.log(ex);
			}
			
		})
	}

	close(){
		let ce = new CustomEvent('k-explorer-close', {detail:this})
		window.dispatchEvent(ce);
	}

	fireKEvent(data){
		let ce = new CustomEvent('k-explorer-state-changed', {detail:data})
		window.dispatchEvent(ce);
	}

}

customElements.define('k-explorer', KExplorer);