import { html, BaseElement, css } from './base-element.js';

class NodePanel extends BaseElement{

	static get properties() {
		return {
			node:{type:String},
			draggable:{type:Boolean},
			data:{type:Object},
			polling:{type:Boolean},
			stats:{type:Array},
			salt:{type:String}
		};
	}
	static get styles(){
		return css `
			:host{
				font-family: "Open Sans";
				font-size: 14px;
				//position:fixed;
				/*width:400px;*/
				max-width:500px;
				min-height: 96px;
				min-width: 150px;
				z-index:-4;
			    /*box-shadow:
			    	0 4px 5px 0 rgba(0,0,0,.14),
			    	0 1px 10px 0 rgba(0,0,0,.12), 
			    	0 2px 4px -1px rgba(0,0,0,.2);*/
			    box-sizing:border-box;
				/*border:1px solid #DDD;*/
				
				background-color:#FFF;
				/*border-radius:5px;*/
				max-height: inherit;
			}

			.content {
				display:flex;
				flex-direction:column;
				padding: 4px 5px;
				max-height: inherit;
    			box-sizing: border-box;

				font-family:Consolas, 'Roboto Mono', 'Open Sans', 'Ubuntu Mono', courier-new, courier, monospace;
				font-size: 12px;
			}
			.content-body{
				flex:1;
				overflow:auto;
			}
			.content .fields{
				display: none;
				flex-wrap: wrap;
				max-width: 500px;
			}

			.field {
				/*min-height:400px;*/
				padding:2px;
				margin-right:4px;
				word-break: keep-all;
				display: flex;
				font-family:Consolas, 'Roboto Mono', 'Open Sans', 'Ubuntu Mono', courier-new, courier, monospace;
				font-size: 12px;
			}

			.label {
				margin-right: 2px;
				color: #666;
			}

			.value {
				color: #02222c;
				white-space: nowrap;
			    overflow: hidden;
			    text-overflow: ellipsis;
			}

			.graphs {
				display:none;
				flex-direction:column;
				/*border:1px solid red;*/
				display:none;
			}
			.content .graphs.active,
			.content .fields.active{display:flex}

			graphite-graph {
				min-width: 500px;
				min-height:150px;
			}
			.title-box{display:flex;}
			.title-box .title{flex:1}
			
			.section-btn,
			.close-btn,
			.pin-btn span,
			.pin-btn .pop i{
				width:20px;height:20px;
				display:inline-block;
				font-style:normal;
				cursor:pointer;
				text-align:center;
				border:1px solid #3181bd;
				user-select:none;
				margin-right:2px;
				box-sizing:border-box;
			}
			.section-btn:hover,
			.close-btn:hover,
			.pin-btn span:hover,
			.pin-btn .pop i:hover{
				background-color:#3181bd;
				color:#FFF;
			}

			.close-btn{
				border:0px;
			}
			.pin-btn{
				font-size:0px;
			}
			.pin-btn span{
				font-size:24px;
				line-height:10px;
				overflow:hidden;
			}
			.pin-btn .pop{
				display:none;
				width:44px;
				
				position:absolute;
				z-index:5;
				background-color:#FFF;
			}
			.pin-btn .pop i{
				font-size:24px;
				line-height:10px;
				margin-top:2px;
				color:#000;
				overflow:hidden;
			}
			.pin-btn .pop i.clear{font-size: 18px;line-height: 18px;}
			.pin-btn:hover .pop{
				display:block;
			}

			td { 
				vertical-align: top;
				white-space: pre;
			}
		`;
	}

	UID(){
		return Math.random()*1e10;
	}

	constructor() {
		super();
		this.data = { }
		this.salt = this.UID();
		//console.log("PANEL CONSTRUCTOR CALLED!".bold,this.seed);
		this.stats = [];

	}

	title(text) {
		const result = (text||'?').replace( /([A-Z])/g, " $1" );
		return result.charAt(0).toUpperCase() + result.slice(1);
	}

	value(k,v) {
		// console.log("k",k,"v",v);
		if(!v)
			return '-';
		if(k == 'ip')
			return v.replace(/^.+:/,'');
		v = v+'';
		if(v.length > 12)
			v = v.substring(0,9)+'...';
		return v || 'N/A';
	}

	render(){

		// return html`
		// 	<div class="content">
		// 		<div>NODE: ${this.node}</div>
		// 	</div>`;

		var position = this.getState("position");
		var size = this.getState("size");
		if(position){
			position = position.split(",");
			this.setPosition(position[0], position[1])
		}
		if(size){
			size = size.split(",");
			this.setSize(size[0], size[1])
		}
		if(!this.node)
			return html``;

		return html`
			<div class="content" @click="${this.handleClick}">
				<div class="title-box">

					<table>
						<tr><td>blockHash</td><td>${this.data.blockHash}</td></tr>
						<tr><td>version</td><td>${this.data.version}</td></tr>
						<tr><td>hashMerkleRoot</td><td>${this.data.hashMerkleRoot}</td></tr>
						<tr><td>acceptedIDMerkleRoot</td><td>${this.data.acceptedIDMerkleRoot}</td></tr>
						<tr><td>utxoCommitment</td><td>${this.data.utxoCommitment}</td></tr>
						<tr><td>timestamp</td><td>${this.data.timestamp} - ${this.getTS(new Date(this.data.timestamp*1000))}</td></tr>
						<tr><td>bits</td><td>${this.data.bits}</td></tr>
						<tr><td>nonce</td><td>${this.data.nonce}</td></tr>
						<tr><td>acceptingBlockHash</td><td>${this.data.acceptingBlockHash}</td></tr>
						<tr><td>parentBlockHashes</td><td>${(this.data.parentBlockHashes || []).join('\n')}</td></tr>
						<tr><td>blueScore</td><td>${this.data.blueScore}</td></tr>
						<tr><td>isChainBlock</td><td>${this.data.isChainBlock}</td></tr>
						<tr><td>mass</td><td>${this.data.mass}</td></tr>
					</table>


				</div>
			</div>`;

		let node = app.identToNode(this.node);
		if(!node)
			return html``;

		const { host } = node;
		// console.log("RENDERING PANEL FOR:",node.type);
		switch(node.type) {
			case 'kaspad': {
				this.stats = [{
					caption : 'Blocks',
					targets : [{
						target : `stats.gauges.hosts.${host}.nodes.kaspa.${node.name}.blocks`
					}]
		 		}, {
					caption : 'Median Time',
					targets : [{
						target : `stats.gauges.hosts.${host}.nodes.kaspa.${node.name}.median_time`
					}]
		 		}, {
					caption : 'Difficulty',
					targets : [{
						target : `stats.gauges.hosts.${host}.nodes.kaspa.${node.name}.difficulty`
					}]
		 		}, {
					caption : 'Storage Size',
					targets : [{
						target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.storage.bytes_used`
					}]
				},{
					caption : 'CPU Usage',
					targets : [{
						target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.proc.cpu`
		 			}]
		 		}];

		 	} break;

		 	case 'simulator': {

			 		this.stats = [{
						caption : 'Blocks Per Second',
						targets : [{
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.blocks_per_sec`
						}, {
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.blocks_per_sec-avg-1m`
						}]
					},{
						caption : 'Virtual Memory Usage',
						targets : [{
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.proc.pmem`
						}]
					},{
						caption : 'Physical Memory Usage',
						targets : [{
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.proc.vmem`
						}]
					},{
						caption : 'CPU Usage',
						targets : [{
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.proc.cpu`
						}]
					}];			 		

		 	} break;

		 	default : {

		 		if(!node.ip) {
		 			this.stats = [];
		 		}
		 		else {

		 			let host = node.host;

			 		this.stats = [{
						caption : 'HOST MACHINE CPU Load',
						targets : [{
							target : `stats.gauges.hosts.${host}.system.loadavg.1m`
						}, {
							target : `stats.gauges.hosts.${host}.system.loadavg.5m`
						// }, {
						// 	target : 'stats.gauges.hosts.${host}.system.loadavg.15m'
						}]
					},{
						caption : 'HOST MACHINE Memory Usage',
						targets : [{
							target : `stats.gauges.hosts.${host}.system.memory.used`
						}]
					},{
						caption : 'Virtual Memory Usage',
						targets : [{
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.proc.pmem`
						}]
					},{
						caption : 'Physical Memory Usage',
						targets : [{
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.proc.vmem`
						}]
					},{
						caption : 'CPU Usage',
						targets : [{
							target : `stats.gauges.hosts.${host}.nodes.${node.type}.${node.name}.proc.cpu`
						}]
					}];		 		
				}
		 	}
						// 	target : 'stats.gauges.hosts.${host}.system.memory.total'
						// }, {
							//target : `stats.gauges.hosts.${host}.system.memory.used`
		 }

		// console.log("TARGETING:",this.node);
		console.log("RTI SCAN:",node.name,app.rti[node.name]);
		let data = app.rti[node.name];
		//console.log("DATA 1:",node.name,data);


		// if(data.bip9SoftForks && data.bip9SoftForks.dummy)
		// 	data.bip9SoftForks = data.bip9SoftForks.dummy;

		let list = ['type','ip','peers','in'];
		// node  = {"host":"broadwell","type":"kaspad","seq":0,"name":"n1","args":["devnet"],"hash":"gMW1irUDbm6rp3hZpmERtBQs5SH","in":["xx1","n2","s1"],"ip":"::ffff:127.0.0.1","id":"n1"};//
		// data = {"version":120000,"protocolVersion":70002,"blocks":3781,"timeOffset":0,"connections":1,"proxy":"","difficulty":2.09446323,"testNet":false,"devNet":true,"relayFee":0.00001,"errors":"","dag":"devnet","headers":3781,"tipHashes":["000009b3d12fb373082328fdf8bcbc5d03cb510ad44c4e3e3d39acf2713fcaf0"],"medianTime":1575312102,"utxoCommitment":"0b47cf650a810a2d85df85a05365795d31fc949b619929487939b9864b8d91bd","pruned":false,"softForks":null,"bip9SoftForks":{"dummy":{"status":"failed","bit":28,"startTime":1199145601,"timeout":1230767999,"since":0}},"size":0,"bytes":0};
		// console.log("NODE:", JSON.stringify(node))
		// console.log("DATA:",data,"ENTRIES:",Object.entries(data.bip9SoftForks));

		let info = {
			type : node.type,
			ip : node.ip,
			peers : (node.peers||[]).concat(node.in||[])
		};



		if(data) {
			data = Object.entries(data).map(([k,v])=>{
				/*if(Array.isArray(v))
					return v.map(([k,v])=>{ return { k, v }; });
				else
				if(v !== null && typeof v == 'object') {
					return Object.entries(v.dummy || v).map(([k,v])=>{
						return { k, v };
					})
				}*/
				return { k, v };
			}).flat();
		}

		console.log("DATA 2:",data);


		// data.map(({k,v}) => {
		// 	//let { k,v } = o;
		// 	console.log("KV:",k,v,"O:");
		// });


		// console.log("STATS:",this.stats);
		let stats = this.stats.slice();

		return html`
			<div class="content" @click="${this.handleClick}">
				<div class="title-box">
					<div class="title">NODE ${node.type}: ${node.name}</div>
<!--					
					<i class="section-btn" data-section="fields">F</i>
					<i class="section-btn" data-section="graphs">G</i>
					<i class="pin-btn">
						<span>&neArr;</span>
						<div class="pop">
							<i class="pin-to" data-pin="nw">&nwArr;</i>
							<i class="pin-to" data-pin="ne">&neArr;</i>
							<i class="pin-to" data-pin="sw">&swArr;</i>
							<i class="pin-to" data-pin="se">&seArr;</i>
							<i class="pin-to clear" data-pin="">&times;</i>
						</div>
					</i>
-->				
					<i class="close-btn">&times;</i>
				</div>
				<div class="content-body">
				<div class="fields active" sxtyle='width:100%;border:4px solid orange;width:300px;'>
				${
					Object.entries(info).map(([k,v]) => {
						return html`<span class='field'><span class='label'>${this.title(k)}:</span><span class='value'>${this.value(k,v)}</span></span>`
					})
				}
				${
					(data||[]).map(({k,v}) => {
						// if(v && typeof(v) == 'object') {
						// 	return html`<span class='field'><span class='label'>${this.title(k)}:</span><span class='value-list'>[${
						// 		 (Array.isArray(v) ? v.map(([t,i])=>[i,t]) : Object.entries(v)).map(([sk,sv]) => {
						// 		 	return html`<span class='row-sub'><span class='label-sub'>${sk}:</span><span class='value-sub'>${sv}</span></span> `;
						// 		 })
						// 	}]</span></span> `;
						// } else {
							return html`<span class='field'><span class='label'>${this.title(k)}:</span><span class='value'>${this.value(k,v)}</span></span> `;
//						}
					})
				}
				</div>
				<div class='graphs active'>
					${
						stats.map((args)=>{ return JSON.stringify(args); }).map((args,i) => {

							return html`<graphite-graph class='graph' salt="${this.salt}" args="${args}"></graphite-graph>`;
						})
					}
				</div>
				</div>
			</div>
		`;
	}
	// ${
	// 	Object.entries(data||{}).map(([k,v]) => {
	// 		if(v && typeof(v) == 'object') {
	// 			return html`<div class='row'><div class='label'>${this.title(k)}</div><div class='value-list'>${
	// 				 (Array.isArray(v) ? v.map(([t,i])=>[i,t]) : Object.entries(v)).map(([sk,sv]) => {
	// 				 	return html`<div class='row-sub'><div class='label-sub'>${2}</div><div class='value-sub'>${3}</div></div>`;
	// 				 })
	// 			}</div></div>`;
	// 		} else {
	// 			return html`<div class='row'><div class='label'>${this.title(k)}</div><div class='value'>${v}</div></div>`;
	// 		}
	// 	})
	// }

	firstUpdated(){
		/*//return;
		this.contentEl = this.renderRoot.querySelector('.content');
		console.log("this.contentEl", this.contentEl)
		this.addEventListener("click", (e)=>{
			let ee = this.renderRoot.querySelector('.content');
			console.log("eeee", ee, this.contentEl)
			console.log("e.target", e.target.nodeName, e)
			//if(e.target.classList.contains("hide-panel"))
			//	return this.hide();
			//if(e.target.classList.contains("show-panel"))
			//	return this.show();
			if(e.target.classList.contains("section-btn"))
				this.toggleSection(e.target.getAttribute('data-section'));
		},{capture:true})
		/*
		this.initDrag();
		*/
		if(window.ResizeObserver){
			this.resizeObserver = new ResizeObserver(e => {
				this.fire('node-panel-resize', {}, {bubbles:true})
			});
			this.resizeObserver.observe(this);
		}

// 		['mousedown','mouseup','mousemove','click'].forEach((event) => {
// 			event.stopEventPropagation();
// //			this.addEventListener(event, (e) => { this.onMouseEvent(event,e); });
// 		})


	}
	initDrag(){
		return;

		let onMouseDown = (e)=>{
			if(!e.target.classList.contains("tools"))
				return
			drag.startX = e.x;
			drag.startY = e.y;
			drag.box = this.getBoundingClientRect();
			if(!drag.started){
				drag.started = true;
				//console.log("mousedown:started")
				document.body.addEventListener("mousemove", onMouseMove);
				document.body.addEventListener("mouseup", onMouseUp)
				//document.body.addEventListener("mouseout", onMouseUp)
			}
		}
		let onMouseMove = (e)=>{
			if(!drag.started)
				return
			drag.endX = e.x;
			drag.endY = e.y;
			var {box, startX, startY, endX, endY} = drag;

			this.setPosition(box.x + endX - startX, box.y + endY - startY)
		}
		let onMouseUp = ()=>{
			drag.started = false;
			document.body.removeEventListener("mousemove", onMouseMove);
			document.body.removeEventListener("mouseup", onMouseUp)
			//document.body.removeEventListener("mouseout", onMouseUp)
		}
		let drag = {
			startX:0,
			startY:0,
			endX:0,
			endY:0
		}

		this.addEventListener("mousedown", onMouseDown)
	}
	handleClick(e){
		console.log('target', e.target)
		if(e.target.classList.contains("pin-to")){
			let pinTo = e.target.getAttribute('data-pin');
			return this.fire("node-panel-pin-to", {pinTo}, {bubbles:true})
		}
		if(e.target.classList.contains("close-btn"))
			return this.fire("node-panel-close", {}, {bubbles:true})
		if(e.target.classList.contains("section-btn"))
			this.toggleSection(e.target.getAttribute('data-section'));
	}
	toggleSection(section){
		let sec = this.renderRoot.querySelector('.'+section);
		if(!sec)
			return
		sec.classList.toggle('active')
	}
	hide(){
		this.classList.add("hide")
	}
	show(){
		this.classList.remove("hide")
	}
	toggle(){
		if(this.classList.contains("hide"))
			this.show();
		else
			this.hide();
	}
	setState(key, value){
		if(this.stateKey && window.localStorage)
			localStorage.setItem(`FloatingPanel:${this.stateKey}:${key}`, value)
	}
	getState(key, defaultValue=null){
		if(this.stateKey && window.localStorage){
			var value = localStorage.getItem(`FloatingPanel:${this.stateKey}:${key}`)
			if(value != undefined)
				return value
		}
		return defaultValue;
	}
	setSize(width, height){
		if(!+width || !+height)
			return
		this.style.width = width+"px";
		this.style.height = height+"px";
	}
	setPosition(x, y){
		//var box = this.getBoundingClientRect();
		//this.setState("position", x+","+y)
		
		this.style.left = x+"px";
		this.style.right = "unset";
		this.style.top = y+"px";
		this.style.bottom = "unset";
	}

	connectedCallback() {
		super.connectedCallback();
		this.setPolling(!!this.node);
	}
	disconnectedCallback() {
		// console.log("Disconnected callback!")
		this.stopPolling();
		//document.removeEventListener('readystatechange', this.handleChange);
		super.disconnectedCallback();
	}

	async updateRTI() {
		// let rti = await app.getRunTimeInfo(this.node);
		// app.rti[this.node] = rti;
		this.requestUpdate();
	}

	poll() {
		this.timer = setTimeout(async () => {
			delete this.timer;
			if(!this.node)
				return;
			try {
				await this.updateRTI();
			} catch(ex) { /* suppress */ };
			this.poll();
		}, 500);
	}

	stopPolling(){
		if(this.timer){
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
	setPolling(active){
		this.stopPolling();
		if(!active)
			return

		this.updateRTI();
		this.poll();
	}
	updated(changedProperties) {
		changedProperties.forEach((oldValue, propName) => {
			//console.log(`${propName} changed. oldValue: ${oldValue}`);
			if(propName == "node")
				this.setPolling(!!this.node);
		});
	}
	onUpdate(){
		console.log("sss")
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

NodePanel.register();