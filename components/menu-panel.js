import { html, BaseElement, css, render} from './base-element.js';
const menuPanelStyle = document.createElement('style');
menuPanelStyle.innerHTML = `
    menu-panel{
        position: absolute;
        width: 280px;
        /*height: 240px;*/
        padding: 12px;
        /*border: 1px solid #333;*/
        display: none;
        font-family: 'Exo 2', 'Consolas', 'Roboto Mono', 'Open Sans', 'Ubuntu Mono', courier-new, courier, monospace;
        font-size: 17px;
        background-color: rgba(255,255,255,0.9);
        box-shadow: 1px 1px 2px rgba(10,10,10,0.1);
        box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),
            0 3px 1px -2px rgba(0,0,0,.2),
            0 1px 5px 0 rgba(0,0,0,.12);
        transition: all 0.3s;
        opacity:0;
        z-index: 10003;
    }
    menu-panel .close-menu {
        position: absolute;
        top : 4px;
        right : 4px;
        /*border: 1px solid pink;*/
        display: block;
        width: 17px;
        cursor:pointer;
    }
`;

document.head.appendChild(menuPanelStyle);

class MenuPanel extends BaseElement{

	static get properties() {
		return {
			hash:{type:String}
		};
	}
	static get styles(){
		return css ``;
	}

	constructor() {
        super();
        // this.graph = window.app.graph;
        this.hidden_ = true;
    }

    getBlock() {
        return window.app.graph.nodes[this.hash];
    }

    createRenderRoot() {
        return this;
    }

	render(){
        return html`<i class="close-menu fal fa-times"></i>`;
	}

    toggle() {
        this.hidden_ = !this.hidden_;
        $(this).css('display', this.hidden_ ? 'none' : 'block');
        if(this.hidden_) {
            $(this).css('opacity', 0);
            dpc(300, () => {
                $(this).css('display', 'none');
            })
        } else {
            $(this).css('opacity', 0);
            $(this).css('display', 'block');
            $(this).css('opacity', 1);
        }
        let bounds = this.anchorEl.getBoundingClientRect();
        let { left : x, bottom : y } = bounds;
        y += 30;
        $(this).css({
            left : `${x}px`,
            top : `${y}px`,
        });
    }
    
	firstUpdated() {

        /*
        $(window).on('click',(e) => {
            console.log(e);

            let nodes = [ ];
            let node = e.target;
            while(node) {
                nodes.push(node);
                node = node.parentNode;
            }
            console.log('chain:', nodes);

            nodes = nodes.filter(n=>this.contains(n));
console.log('nodes:', nodes);
            if(nodes.length)
                return;
            //    return;

            // if(this.contains(e.target) || this.contains(e.target.parentNode) || (e.target.parentNode && this.contains(e.target.parentNode.parentNode)))
            //     return;

            var target = e.target; //target div recorded


console.log('target is:', $(target).is('#menu-panel'));

            if(!this.hidden_) { // && !$(target).is('#menu-panel')) {
                    //$(this).fadeOut(); //if the click element is not the above id will hide
                    console.log('execute toggle...');
                    this.toggle();
            }
    
        });
*/

        this.anchorEl = document.getElementById('menu-anchor');
        $(this.anchorEl).on('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        $('.close-menu',this).on('click', ()=>{
            this.toggle();
        });



        //this.el = this.shadowRoot.getElementById('info-panel');
        // window.app.generateTooltips(this.el);

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

}

MenuPanel.register();