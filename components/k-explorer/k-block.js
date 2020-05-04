import { LitElement, html, css, unsafeCSS } from 'lit-element/lit-element.js';
import {KPath} from './k-path.js';
import {copyToClipboard, getTS, basePath} from "./k-utils.js";
import {KBlockCfm} from "./k-block-cfm.js";

export class KBlock extends LitElement{
	static get properties() {
		return {
			hash:{type:String},
		};
	}
	static get styles(){
		return css `
			:host{
				font-size: 14px;
                z-index:4;
                display:flex;
                flex-direction:column;
                margin: 8px;
                padding: 0px;
                background-color:var(--k-block-bg-color, #323232);
				color:var(--k-block-color, #c7c7c7);
				font-family:var(--k-block-font-family, 'Exo 2', Consolas,'Roboto Mono','Open Sans','Ubuntu Mono',courier-new,courier,monospace);
				font-weight:var(--k-block-font-weight, normal);
                max-height: 80vh;
                position:relative;
            }
            :host(.hidden){display:none}
            .panel {
                border: 1px solid #ccc;
                padding: 8px;
                box-shadow:var(--k-block-shadow);
            }
            .toolbar {
                display: flex;
                flex-direction: row;
            }
            .toolbar .button {
                display: block;
                width: 20px;
                height: 20px;
                margin: 2px 6px 6px 6px;
                background-position: center center;
                background-size: cover;
                background-repeat: no-repeat;
                transition: all 0.15s;
                cursor: pointer;
            }
            .toolbar .button:hover {
                opacity: 1;
                transform: scale(1.15);
            }
            .red {
            	background-color:var(--k-block-bg-color-1, transparent);
            	color:var(--k-block-color-1, inherit);
            }
            .blue {
            	background-color:var(--k-block-bg-color-2, transparent);
            	color:var(--k-block-color-2, inherit);
            }
            .red:hover, .focus .red {
            	background-color:var(--k-block-hover-bg-color-1, rgba(255, 255, 255, 0.15));
            	color:var(--k-block-hover-color-1, inherit);
            }
            .blue:hover, .focus .blue  {
            	background-color:var(--k-block-hover-bg-color-2, rgba(255, 255, 255, 0.15));
            	color:var(--k-block-hover-color-2, inherit);
            }
            .info {
                cursor: pointer;
            }
            #url { display: none; }
            .panel {
                transition:all 0.2s;
                cursor:pointer;
                display:flex;
                flex-direction:column;
                flex:1;
                overflow:hidden;
            }
            .panel:hover .blockHash {
                border-bottom: 1px dashed #000;
                font-weight: bold;
            }
            .info-basic {
                display: block;
                cusror: pointer;
                user-select: none;
            }
            .info-advanced {
                display: none;
                margin-top: 16px;
                cusror: text;
                overflow-y:auto;
                cursor: text;
                flex:1;
            }
            .advanced .info-basic {
                display: none;
            }
            .advanced .info-advanced {
                display: flex;
                flex-direction:column;
            }
            td {
                vertical-align: top;
            }
            strong {
                font-weight: normal;
            }
            .is-chain-block {border: 4px solid rgba(0,0,0,0.5);}
            .is-regular-block{border: 4px solid rgba(0,0,0,0);}
            .is-link{cursor:pointer}
            :host:after{
				position:absolute;
				content:"";
				z-index:-1;
				opacity:0;
				background:rgba(255,0,0, 0.5);
				left:0px;
				top:0px;
				width:100%;
				height:100%;
				transition:opacity 0.2s ease;
			}
			:host(.highlight):after{
				z-index:10;
				opacity:1;
			}

			[class*="mask-icon-"]{
				background-color:var(--k-block-color, #c7c7c7);
				-webkit-mask-size:contain;
				-webkit-mask-repeat: no-repeat;
				-webkit-mask-repeat:contain;
			}
			.mask-icon-info{
				-webkit-mask-image:url("${basePath}resources/mask/info.png");
			}
			.mask-icon-copy-hash{
				-webkit-mask-image:url("${basePath}resources/mask/copy-hash.png");
			}
			.mask-icon-copy-link{
				-webkit-mask-image:url("${basePath}resources/mask/copy-link.png");
			}
			.mask-icon-close{
				-webkit-mask-image:url("${basePath}resources/mask/close.png");
			}
		`;
	}

	constructor() {
        super();
        this.kExplorer = window.kExplorer;
        
    }

    getData() {
        return  this.kExplorer.blocksMap[this.hash];
    }

	render(){

        const data = this.getData();

        let ident = data.blockHash.replace(/^0+/,'').substring(0,10);
        let hash = data.blockHash.substring(0,18)+'...';

        return html`
        <link rel="stylesheet" type="text/css" href="/resources/fonts/fontawesome-pro-5.12.1-web/css/all.min.css" />
        <link rel="stylesheet" type="text/css" href="/resources/fonts/fontawesome-pro-5.12.1-web/css/light.min.css" />
        <link rel="stylesheet" type="text/css" href="/resources/fonts/fontawesome-pro-5.12.1-web/css/regular.min.css" />
        <div id="info-panel" class="panel ${this.cls()}" xstyle="border:1px solid red;" @click="${this.panelClick}">
            <div class='toolbar'>
                <div @click="${this.details}" class="button mask-icon-info" title="Open detailed block information"></div>
                <div @click="${this.copyHashToClipboard}" 
                	class="button mask-icon-copy-hash"
                	title="Copy block hash ${hash} to clipboard"></div>
                <div @click="${this.copyLinkToClipboard}"
                	class="button mask-icon-copy-link"
                	title="Copy link to clipboard (for block ${hash} only)"></div>
                <div style="flex:1;min-width:16px;"></div>
                <div class="button close-btn mask-icon-close" title="Close" 
                	style="position:relative;transform:scale(0.85) translate(14px,-8px);"></div>
            </div>
            <div class='info-basic'>
                <span class='blockHash'>${ident}</span>
                &Delta;${data.blueScore} <br/>
                ${getTS(new Date(data.timestamp*1000))} 
            </div>
            <div class='info-advanced'>
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
                    <tr><td>Timestamp</td><td><strong>${getTS(new Date(data.timestamp*1000))}</strong> (${data.timestamp})</td></tr>
                    <tr><td>Blue Score</td><td><strong>${data.blueScore}</strong></td></tr>
                    <tr>
                        <td>Confirmations</td>
                        <td>
                            <strong>
                                <k-block-cfm
                                    blue-score="${data.blueScore}",
                                    cfm="${data.confirmations}"></k-block-cfm>
                            </strong>
                        </td>
                    </tr>
                    <tr><td>Is Chain Block</td><td><strong>${data.isChainBlock}</strong></td></tr>
                    <tr><td>Mass</td><td><strong>${data.mass}</strong></td></tr>
                    <tr><td>Nonce</td><td>${data.nonce}</td></tr>
                    <tr><td>UTXO Commitment</td><td>${data.utxoCommitment}</td></tr>
                    <tr><td>Merkle Root Hash</td><td>${data.hashMerkleRoot}</td></tr>
                    <tr><td>Merkle Root Accepted ID</td><td>${data.acceptedIDMerkleRoot}</td></tr>
                    <tr><td>Accepting Block Hash</td><td>${data.acceptingBlockHash}</td></tr>
                    <tr><td>Parent Block Hashes</td><td>${(data.parentBlockHashes || []).map(v=>html`${v}<br/>`)}</td></tr>
                    <tr><td>Child Block Hashes</td><td>${(data.childBlockHashes || []).map(v=>html`${v}<br/>`)}</td></tr>
                </table>
            </div>
        </div>`;
	}

    details(e) {
        e.stopPropagation();
        $(this.el).toggleClass('advanced');
        if($(this.el).hasClass('advanced')) {
            $("k-block").toggleClass('hidden', true);
            $(this).toggleClass('hidden', false);
        } else {
            $("k-block").toggleClass('hidden', false);
        }
    }

    focusOnBlock_(hash) {
        return (e) => {
            //window.app.focusOnBlock(hash);
        }
    }

    cls() {
        const cls = [];
        const data = this.getData();
        if(data.isChainBlock)
            cls.push('is-chain-block');
        else
            cls.push('is-regular-block');
        if(!data.acceptingBlockHash)
            cls.push('red');
        else
            cls.push('blue');
        // return `blue ${cls}`;

        return cls.join(' ');

    }

    click(e) {
        console.log('click!',e);
    }
    panelClick(e) {
        if(e.target.classList.contains('close-btn'))
            return this.close();

        if($(this.el).hasClass('advanced')) {
            // $(this.el).toggleClass('advanced');
            //$("block-info").toggleClass('hidden', false);
            return;
        }
        else {
            this.navigateTo();
        }
    }
    navigateTo(...args) {
        console.log('navigateTo:',args);
        // e.preventDefault();
        console.log("BI is calling navigateTo...");
        //this.graph.setFocusTargetHash(this.hash);
        //this.graph.centerBy(this.hash);
    }

    focusClick(e) {
        e.preventDefault();
        console.log("BI is calling focus...");
        //this.graph.centerBy(this.hash);
    }
    openLinkInNewWindow(){
        window.open(this.buildBlockUrl().toString())
    }
    buildBlockUrl(){
        const data = this.getData();
        let expParams = {method:"block", paths:[data.blockHash]};
        return KPath.buildUrl(expParams);
    }
    copyLinkToClipboard(e) {
        e.stopPropagation();
        let url = this.buildBlockUrl();
        copyToClipboard(url.toString());

        $.notify({
            //title : 'DAGViz',
            text : 'Link Copied to Clipboard!',
            className : 'yellow',
            autoHide : true,
            autoHideDelay : 1200
        });

    }

    copyHashToClipboard(e) {
        e.stopPropagation();
        const data = this.getData();
        copyToClipboard(data.blockHash);

        $.notify({
            //title : 'DAGViz',
            text : 'Block Hash Copied to Clipboard!',
            className : 'yellow',
            autoHide : true,
            autoHideDelay : 1200
        });
    }

    close() {
        if($(this.el).hasClass('advanced')) {
            $(this.el).toggleClass('advanced');
            $("k-block").toggleClass('hidden', false);
        }else{
        	this.remove();
        }
        	
    }
    
	firstUpdated() {
        this.el = this.shadowRoot.getElementById('info-panel');
        //let advancedIsOpen = false;
        $("k-block").each((index, box)=>{
        	if(box.el.classList.contains("advanced")){
        		box.el.classList.remove("advanced")
        		//advancedIsOpen = true;
        	}

        	box.classList.remove("hidden")
        })
	}



	highlight(){
		this.classList.add("highlight")
		setTimeout(()=>{
			this.classList.remove("highlight")
		}, 210)
	}
}

customElements.define('k-block', KBlock);

