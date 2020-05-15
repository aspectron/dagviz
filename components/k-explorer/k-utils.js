import {html, css, unsafeCSS} from 'lit-element/lit-element.js';
import {repeat} from 'lit-html/directives/repeat.js';

let _toString = obj=>Object.prototype.toString.call(obj);
let isString = obj=>_toString(obj) == '[object String]';
let isNumber = obj=>_toString(obj) == '[object Number]';
let {debug, baseUrl} = window.kConfig || {}

if(!baseUrl){
    baseUrl = (new URL("./", import.meta.url)).href;
    debug && console.log("KExplorer: baseUrl", baseUrl)
}
let basePath = unsafeCSS(baseUrl);
export {baseUrl, basePath, debug};

let getTS = src_date=>{
    if(src_date && isNumber(src_date))
        src_date = new Date(src_date)
    let a = src_date || (new Date());
    let year = a.getFullYear();
    let month = a.getMonth()+1; month = month < 10 ? '0' + month : month;
    let date = a.getDate(); date = date < 10 ? '0' + date : date;
    let hour = a.getHours(); hour = hour < 10 ? '0' + hour : hour;
    let min = a.getMinutes(); min = min < 10 ? '0' + min : min;
    let sec = a.getSeconds(); sec = sec < 10 ? '0' + sec : sec;
    //var time = year+'-'+month+'-'+date+' '+hour+':'+min+':'+sec;
    return `${year}-${month}-${date} ${hour}:${min}:${sec}`;
}


let selectText = node=>{
    if (document.body.createTextRange) {
        const range = document.body.createTextRange();
        range.moveToElementText(node);
        range.select();
    } else if (window.getSelection) {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
    } else {
        console.warn("Could not select text in node: Unsupported browser.");
    }
}

let copyToClipboard = text=>{
    let el = document.createElement("div");
    el.innerText = text;
    document.body.appendChild(el);
    selectText(el);
    document.execCommand('copy');
    el.remove();
}

let loadingImgStyle = css`
	.loading-logo .animate {
		stroke-dasharray: 1000;
		stroke-dashoffset: 1000;
		animation: loading-logo-animation 2s linear infinite;
	}

	@keyframes loading-logo-animation {
		from {
			stroke-dashoffset: 1000;
		}
		to {
			stroke-dashoffset: 1;
		}
	}
`;

let scollbarStyle = css `
    .sbar{
        scrollbar-color:#888 #F5F5F5;
        scrollbar-width:16px;
    }
	.sbar::-webkit-scrollbar-track{
	    -webkit-box-shadow:inset 0 0 6px rgba(0,0,0,0.3);background-color:#F5F5F5;
	}
	.sbar::-webkit-scrollbar{width:16px;background-color:#F5F5F5;}
	.sbar::-webkit-scrollbar-thumb{
	    -webkit-box-shadow:inset 0 0 6px rgba(0,0,0,.3);
	    background-color:#888;
	}
    /*.sbar-top{height:3px;box-shadow:0px 3px 3px #F5F5F5}*/
`;

let paginationStyle = css`
	.pagination-box{text-align:center;padding:10px 5px;}
	.pagination{display: inline-block;}
	.pagination a{
		color: var(--k-pagination-color);
		float: left;
		padding: 8px 16px;
		text-decoration: none;
		transition: background-color .3s;
		border: 1px solid #555;
		border-color:var(--k-pagination-border-color, var(--k-btn-border-color, #555));
		margin:2px 4px;
        cursor:pointer;
        user-select:none;
	}
	@media (max-width:768px){
		.pagination a{
			padding:8px 6px;
			margin: 0px 2px;
			font-size:0.8rem;
		}
	}
	.pagination a.disabled{
		opacity:0.5;
	}
	.pagination a.hidden{display:none}
	.pagination a.active{
		background:var(--k-pagination-active-bg, #2489da);
		color:var(--k-pagination-active-color, #FFF);
		border:1px solid #2489da;
		border-color:var(--k-pagination-active-border-color, #2489da);
	}
	.pagination a.active,
	.pagination a.disabled{
		cursor:default;
	}
	.pagination a:hover:not(.active):not(.disabled){
        border-color:var(--k-pagination-hover-border-color, var(--k-btn-hover-border-color, #777 ));
		background-color:var(--k-pagination-hover-bg-color, var(--k-btn-hover-bg-color, rgba(255,255,255, 0.2) ));
		color:var(--k-pagination-hover-color, var(--k-btn-hover-color, inherit));
	}
`;

let btnStyle = css`
    .btn{
        border:1px solid #555;
        border-color:var(--k-btn-border-color, #555);
        padding: 2px 5px;
        font-size: var(--k-btn-font-size, 1rem);
        transition: background-color .3s;
    }
    .btn.primary{
        border-color:var(--k-btn-primary-border-color, #2489da);
        background-color:var(--k-btn-primary-bg-color, #2489da);
        color:var(--k-btn-primary-color, #FFF);
    }
    .btn.active{
        border-color:var(--k-btn-active-border-color, #2489da);
        background-color:var(--k-btn-active-bg-color, #2489da);
        color:var(--k-btn-active-color, #FFF);
    }
    .btn:not(.disabled){
        cursor:pointer;
    }
    .btn:not(.disabled):hover{
        border-color:var(--k-btn-hover-border-color, #555);
        background-color:var(--k-btn-hover-bg-color, rgba(255,255,255, 0.2));
        color:var(--k-btn-hover-color, inherit);
    }
    .btn.primary:not(.disabled):hover{
        border-color:var(--k-btn-primary-hover-border-color, #2489da);
        background-color:var(--k-btn-primary-hover-bg-color, #055ea5);
        color:var(--k-btn-primary-hover-color, #FFF);
    }
    .btn.active:not(.disabled):hover{
        border-color:var(--k-btn-active-hover-border-color, #2489da);
        background-color:var(--k-btn-active-hover-bg-color, #055ea5);
        color:var(--k-btn-active-hover-color, #FFF);
    }
`;

let isElementVisible = (elem)=>{
    if (!(elem instanceof Element))
    	throw Error('DomUtil: elem is not an element.');
    const style = getComputedStyle(elem);
    if (style.display === 'none') return false;
    if (style.visibility !== 'visible') return false;
    if (style.opacity === 0) return false;
    let rect = elem.getBoundingClientRect();
    if (elem.offsetWidth+elem.offsetHeight+rect.height+rect.width === 0) {
        return false;
    }

    let cWidth = document.documentElement.clientWidth || window.innerWidth;
    let cHeight = document.documentElement.clientHeight || window.innerHeight;

    let {left, top, bottom, right} = rect;
    if(left > cWidth || top>cHeight || right<0 || bottom<0)
    	return false;

    let result = false;
    [{ //center
        x: left + elem.offsetWidth / 2,
        y: top + elem.offsetHeight / 2
    },{ //top-left
        x: left+10,
        y: top+10
    },{ //top-right
        x: right-15,
        y: top+10
    },{ //bottom-left
        x: left+10,
        y: bottom-10
    },{ //bottom-right
        x: right-15,
        y: bottom-10
    }].find(({x, y})=>{
    	
        let pointContainer = document.elementFromPoint(x, y);
        //console.log("x, y", x, y, pointContainer)
        while(pointContainer) {
            if (pointContainer === elem){
            	result = true;
            	return true;
            }
            pointContainer = pointContainer.parentNode;
        }
    })
    return result;
}

let buildPagination = (total, skip=0, limit=25)=>{
    skip = +skip;
    limit = +limit;
    total = +total;

    let totalPages = Math.ceil(total/limit);
    let activePage = Math.min(Math.ceil((skip+1)/limit), totalPages);
    let maxPages = Math.min(10, totalPages);
    let half = Math.floor(maxPages/2);
    let prev = Math.max(activePage-1, 1);
    let next = Math.min(activePage+1, totalPages)
    let p = 1;
    if(activePage-half > 1)
        p = activePage-maxPages+Math.min(totalPages-activePage, half)+1;

    let pages = [];
    for(let i=0; i<maxPages; i++){
        pages.push({
            p,
            skip:(p-1)*limit,
            active:activePage==p,
        })
        p++;
    }
    return {
        totalPages,
        activePage,
        isLast:activePage==totalPages,
        isFirst:activePage==1,
        prev,
        next,
        last:totalPages,
        lastSkip:(totalPages-1)*limit,
        prevSkip:(prev-1) * limit,
        nextSkip:(next-1) * limit,
        total,
        skip,
        limit,
        pages,
        maxPages,
        half
    }
}

let renderPagination = pagination=>{
    if(!pagination)
        pagination = {pages:[], isFirst:true, isLast:true, totalPages:0, type};
    let {pages, isFirst, isLast, prevSkip, nextSkip, totalPages, lastSkip, type} = pagination;

    let hideNextPrev = pages.length ==0?' hidden':'';

    return html`
    <div class="pagination-box" ?disabled="${!pages.length}">
        <div class="pagination" data-pagination="${type}">
            <a class="first ${(isFirst?'disabled':'')+hideNextPrev}" data-skip="0">FIRST</a>
            <a class="prev ${(isFirst?'disabled':'')+hideNextPrev}" data-skip="${prevSkip}">&lt;</a>
            ${repeat(pages, p=>p.p, p=>html`
                <a class="${p.active?'active':''}" data-skip="${p.skip}">${p.p}</a>
            `)}
            <a class="next ${(isLast?'disabled':'')+hideNextPrev}"  data-skip="${nextSkip}">&gt;</a>
            <a class="first ${(isLast?'disabled':'')+hideNextPrev}" data-skip="${lastSkip}">LAST</a>
        </div>
    </div>`;
}

export class ClearableWeakMap {
    constructor(init) {
        this._wm = new WeakMap(init);
    }
    clear() {
        this._wm = new WeakMap();
    }
    delete(k) {
        return this._wm.delete(k);
    }
    get(k) {
        return this._wm.get(k);
    }
    has(k) {
        return this._wm.has(k);
    }
    set(k, v) {
        this._wm.set(k, v);
        return this;
    }
}

const debounceFrameMap = new ClearableWeakMap();
const debounce = (obj, key, fn) => {
    return (...args) => {
        let frameInfo = debounceFrameMap.get(obj);
        if(!frameInfo)
            frameInfo = {};
        if (frameInfo[key]) 
            cancelAnimationFrame(frameInfo[key]);

        frameInfo[key] = requestAnimationFrame(() => {
            fn(...args);
        });

        debounceFrameMap.set(obj, frameInfo);
    } 
};

const pick = (obj, keys)=>{
    let result = {}, v;
    keys.forEach(k=>{
        v = obj[k];
        if(v!== undefined)
            result[k] = v
    });
    return result;
}

export {debounceFrameMap, debounce, pick}
export {isElementVisible, paginationStyle, scollbarStyle, loadingImgStyle, selectText};
export {copyToClipboard, getTS, buildPagination, renderPagination, btnStyle, isString, isNumber};
