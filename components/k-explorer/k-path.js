export class KPath{

	static getUrl(url){
		url =  url || location.href;
		if(_.isString(url))
			url = new URL(url);

		return url;
	}

	static parse(url){
		url = this.getUrl(url);

		let pathname = url.pathname;
		let _params = Object.fromEntries(url.searchParams.entries());

		pathname = pathname.replace(/^\/+|\/+$/g, '')
		const [method, ...paths] =  pathname.split("/");
		if(!method)
			return {};
		let params = {};
		if(this[`${method}_params`])
			params = this[`${method}_params`](_params);
		return {method, paths, params}
	}

	static buildUrl(expParams, url){
		url = this.getUrl(url);
		let {method, paths, params:_params} = expParams || {};
		if(!method){
			url.pathname = "";
			return url;
		}
		if(!paths)
			paths = [];
		if(!_params)
			_params = {};
		let pathParts = [method];
		if(this[`${method}_url`]){
			let {paths:_paths, params} = this[`${method}_url`](paths, _params);
			if(params){
				Object.entries(params).forEach(([k, v])=>{
					url.searchParams.set(k, v);
				})
			}
			if(_paths && _paths.length){
				pathParts = pathParts.concat(_paths)
			}
		}
		
		url.pathname = pathParts.join("/");

		return url;
	}

	static blocks_params(params){
		return _.pick(params, ['limit', 'skip', 'order']);
	}
	static blocks_url(paths, params){
		return {params:this.blocks_params(params)}
	}
	static block_url(paths, params){
		return {paths}
	}
	static transaction_url(paths, params){
		return {paths}
	}
	static transactions_url(paths, params){
		return {paths, params}
	}

}