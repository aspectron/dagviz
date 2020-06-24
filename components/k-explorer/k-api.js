class KAPI {
	constructor(options={}){
		this.options = Object.assign({
			origin: "http://localhost:1234/"
		}, options)
		this.init();
	}

	init(){

	}

	getBlocks(params={}){
		params = Object.assign({
			order:"desc", //asc
			skip:0,
			limit:25
		}, params)
		return {params, req:this.get("blocks", params)}
	}
	getBlockCount(){
		return {req:this.get(`blocks/count`)}
	}

	getTransactionsCount(addr){
		return {req:this.get(`transactions/address/${addr}/count` )}
	}

	getBlock(hash){
		return {hash, req:this.get(`block/${hash}`)}
	}
	getTransaction(paths){
		return {req:this.get(['transaction', ...paths].join("/"))}
	}

	getFeeEstimates(){
		return {req:this.get(`fee-estimates`)}
	}

	getTransactions(paths, params={}){
		params = Object.assign({
			order:"asc", //desc
			skip:0,
			limit:25
		}, params)
		return {params, req:this.get(["transactions", ...paths].join("/"), params)}
	}

	get(path, data={}){
		return new Promise((resolve, reject)=>{
			$.ajax(this.options.origin+path, {
				data,
				dataType: 'json',
				// timeout: 500,// timeout milliseconds
				success: (data, status, xhr) => {
					resolve(data);
				},
				error: (jqXhr, textStatus, errorMessage) => {
					console.log('get:error:', this.options.origin+path, textStatus, errorMessage, jqXhr);
					window.xxxxx = jqXhr.responseText
					if(jqXhr.responseJSON && jqXhr.responseJSON.error)
						reject(jqXhr.responseJSON.error);
					else
						reject(errorMessage);
				}
			})
		})
	}
}
/*if(typeof module != 'undefined' && typeof module.exports != 'undefined'){
	module.exports.KAPI = KAPI
}else{*/
	export {KAPI};
/*}*/
