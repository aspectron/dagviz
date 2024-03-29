import { html, BaseElement, css } from './base-element.js';

class BlockInfo extends BaseElement{

	static get properties() {
		return {
			hash:{type:String},
		};
	}
	static get styles(){
		return css `
			:host{
				font-family: "Exo 2";
				font-size: 14px;
                z-index:4;
                display:flex;
                flex-direction:column;
                margin: 8px;
                padding: 0px;
                background-color: var(--block-info-bg-color, rgba(255,255,255,0.9));
                color: var(--block-info-color, inherit)
                max-height: 80vh;
            }
            :host(.hidden){display:none}
            .panel {
                background-color: white;
                border: 1px solid #ccc;
                box-shadow: var(--block-box-shadow, 1px 1px 2px rgba(10,10,10,0.1));
                padding: 8px;   
            }
            .toolbar {
                display: flex;
                flex-direction: row;
            }
            .toolbar .button {
                display: block;
                width: 20px;
                height: 20px;
                opacity: 0.8;
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
            /*
            .red { background-color: rgba(255,194,194,0.49); }
            .blue { background-color: rgba(194,244,255,0.49); }
            .red:hover, .focus .red { background-color: rgba(255,194,194,0.79); }
            .blue:hover, .focus .blue  { background-color: rgba(194,244,255,0.79); }
            */
            
            .red {
                background-color:var(--block-bg-color-1, rgba(255,194,194,0.49));
                color:var(--block-color-1, var(--block-info-color, inherit));
            }
            .blue {
                background-color:var(--block-bg-color-2, rgba(194,244,255,0.49));
                color:var(--block-color-2, var(--block-info-color, inherit));
            }
            .red:hover, .focus .red {
                background-color:var(--block-hover-bg-color-1, rgba(255,194,194,0.79));
                color:var(--block-hover-color-1, var(--block-info-color, inherit));
            }
            .blue:hover, .focus .blue  {
                background-color:var(--block-hover-bg-color-2, rgba(194,244,255,0.79));
                color:var(--block-hover-color-2, var(--block-info-color, inherit));
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
            .red td{
                color: var(--block-td-color-1, var(--block-td-color, #333));
            }
            .blue td{
                color: var(--block-td-color-2, var(--block-td-color, #333));
            }
            .red strong{
                color: var(--block-strong-color-1, var(--block-strong-color, #000));
            }
            .blue strong{
                color: var(--block-strong-color-2, var(--block-strong-color, #000));
            }
            .button{
                filter:var(--block-button-filter, none);
            }
            .is-chain-block {
                border: 4px solid rgba(0,0,0,0.5);
            }

            .is-regular-block {
                border: 4px solid rgba(0,0,0,0);
            }
            .is-link{cursor:pointer}

            .red .cfm {display:none;}
		`;
	}

	constructor() {
        super();
        this.graph = window.app.graph;
    }

    getBlock() {
        return window.app.graph.nodes[this.hash];
    }

	render(){

        const block = this.getBlock();
        const { data } = block;
console.log("BLOCk:",block);
        let ident = data.blockHash.replace(/^0+/,'').substring(0,10);

		const isBlue = !!data.acceptingBlockHash || !!data.isChainBlock


        return html`
                <link rel="stylesheet" type="text/css" href="/resources/fonts/fontawesome/css/all.min.css" />
                <link rel="stylesheet" type="text/css" href="/resources/fonts/fontawesome/css/light.min.css" />
                <link rel="stylesheet" type="text/css" href="/resources/fonts/fontawesome/css/regular.min.css" />
                <div id="info-panel" class="panel ${this.cls()}" xstyle="border:1px solid red;" @click="${this.panelClick}">
                    <div class='toolbar' style=''>
                        <!--
                        <div  class="button" style="background-image:url(/resources/images/icons/filled-box.png);transform:scale(1.5);margin-right:8px;" x-tooltip="Navigate to"></div>
                        <div style="flex:1;max-width:12px;"></div>
                    -->
                    <div @click="${this.details}" class="button" style="background-image:url(/resources/images/icons/info.png);transform:scale(1.1); opacity:0.75;" tooltip="fal fa-info-circle:Open detailed block information"></div>
                    <!--
                    <div @click="${this.focusClick}" class="button" style="background-image:url(/resources/images/icons/geo-fence.png);transform:scale(1.1); opacity:0.75;" tooltip="fal fa-map-marker-alt:Go to block ${data.blockHash.substring(0,18)+'...'}"></div>
                    -->
                    <div @click="${this.copyHashToClipboard}" class="button" style="background-image:url(/resources/images/icons/copy-hash-2.png);transform:scale(1.1);opacity:0.75;" tooltip="fa-clipboard:Copy block hash ${data.blockHash.substring(0,18)+'...'} to clipboard"></div>
                    <div @click="${this.copyLinkToClipboard}" class="button" style="background-image:url(/resources/images/icons/copy-link-2.png);transform:scale(1.1);opacity:0.75;" tooltip="fa-link:Copy link to clipboard (for block ${data.blockHash.substring(0,18)+'...'} only)"></div>
                    <div style="flex:1;min-width:16px;"></div>
                    <div class="button close-btn" x-tooltip="Close" 
                    style="background-image:url(/resources/images/icons/cross.png);position:relative;transform:scale(0.85) translate(14px,-8px);"></div>
                </div>
                <div class='info-basic'>
                    <span class='blockHash'>${ident}</span>
                        &Delta;${data.blueScore} ${isBlue?html`(<k-block-cfm blue-score="${data.blueScore}"></k-block-cfm>)`:''} <br/>
                        ${this.getTS(new Date(data.timestamp*1000))} 
                </div>
                <div class='info-advanced'>
                    <table>
                        <tr><td>Block Hash</td><td>${data.blockHash} <i @click="${this.copyHashToClipboard}" class='is-link fal fa-clipboard'></i> <i @click="${this.openLinkInNewWindow}" class='is-link fal fa-map-marker-alt'></i></td></tr>
                        <tr><td>Version</td><td><strong>${data.version}</strong></td></tr>
                        <tr><td>Bits</td><td><strong>${data.bits}</strong></td></tr>
                        <tr><td>Timestamp</td><td><strong>${this.getTS(new Date(+data.timestamp))}</strong> (${data.timestamp})</td></tr>
                        <tr><td>Blue Score</td><td><strong>${data.blueScore} (<block-cfm blue-score="${data.blueScore}"></block-cfm>)</strong></td></tr>
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
                <span id="url">${this.getUrl()}</span>
            </div>
            `;
	}

    details(e) {
        e.stopPropagation();
        /*
        $(this.el).toggleClass('advanced');
        if($(this.el).hasClass('advanced')) {
            $("block-info").toggleClass('hidden', true);
            $(this).toggleClass('hidden', false);
        } else {
            $("block-info").toggleClass('hidden', false);
        }
        */
        window.app.openExplorer("block/"+this.hash);
    }

    focusOnBlock_(hash) {
        return (e) => {
            window.app.focusOnBlock(hash);
        }
    }

    cls() {
        const cls = [];
        const { data } = this.getBlock();
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
        this.graph.setFocusTargetHash(this.hash);
        //this.graph.centerBy(this.hash);
    }

    focusClick(e) {
        e.preventDefault();
        console.log("BI is calling focus...");
        this.graph.centerBy(this.hash);
    }

    getUrl() {
        return window.location.toString();
    }
    openLinkInNewWindow(){
        window.open(this.buildBlockUrl().toString())
    }
    buildBlockUrl(){
        const { data } = this.getBlock();
        let url = new URL(window.location.href);
        url.searchParams.set('select','lseqx'+parseInt(data.lseq).toString(16));
        return url;
    }
    copyLinkToClipboard(e) {
        e.stopPropagation();
        let url = this.buildBlockUrl();
        // let el = this.shadowRoot.getElementById('url');
        // el.innerText = url.toString();
        // console.log('copied...');
        this.copyToClipboard(url.toString());

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
        const { data } = this.getBlock();
        this.copyToClipboard(data.blockHash);

        $.notify({
            //title : 'DAGViz',
            text : 'Block Hash Copied to Clipboard!',
            className : 'yellow',
            autoHide : true,
            autoHideDelay : 1200
        });

    }

    copyToClipboard(text) {
        let el = this.shadowRoot.getElementById('url');
        el.innerText = text;
        $(el).show();
        window.app.selectText(el);
        document.execCommand('copy');
        $(el).hide();
    }

    copyToClipboard_(text, caption) {
        return () => {
            this.copyToClipboard(text);
            $.notify({
                //title : 'DAGViz',
                text : caption+'copied to Clipboard!',
                className : 'yellow',
                autoHide : true,
                autoHideDelay : 1200
            });
            }
    }

    close() {
        if($(this.el).hasClass('advanced')) {
            $(this.el).toggleClass('advanced');
            $("block-info").toggleClass('hidden', false);
        }
        else
            this.getBlock().select(false);
    }
    
	firstUpdated() {
        this.el = this.shadowRoot.getElementById('info-panel');
        window.app.generateTooltips(this.el);

        // $(window).on('keydown', (e) => {
        //     console.log(e);
        // });

		// if(window.ResizeObserver){
		// 	this.resizeObserver = new ResizeObserver(e => {
		// 		this.fire('navigator-resize', {}, {bubbles:true})
		// 	});
		// 	this.resizeObserver.observe(this);
		// }
		// this.addEventListener('click', this.handleClick);
		// ['mousedown','mouseup','mousemove'].forEach((event) => {
		// 	this.addEventListener(event, (e) => { this.onMouseEvent(event,e); });
		// })
	}

	getTS(src_date) {
		var a = src_date || (new Date());
		var year = a.getFullYear();
		var month = a.getMonth()+1; month = month < 10 ? '0' + month : month;
		var date = a.getDate(); date = date < 10 ? '0' + date : date;
		var hour = a.getHours(); hour = hour < 10 ? '0' + hour : hour;
		var min = a.getMinutes(); min = min < 10 ? '0' + min : min;
		var sec = a.getSeconds(); sec = sec < 10 ? '0' + sec : sec;
		//var time = year + '-' + month + '-' + date + ' ' + hour + ':' + min + ':' + sec;
		return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
	}
}

BlockInfo.register();