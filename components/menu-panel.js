import { html, BaseElement, css, render} from './base-element.js';
const menuPanelStyle = document.createElement('style');
menuPanelStyle.innerHTML = `
    menu-panel{
        position: absolute;
        width:314px;
        /*height: 240px;*/
        padding: 12px;
        /*border: 1px solid #333;*/
        display: none;
        font-family: 'Exo 2', 'Consolas', 'Roboto Mono', 'Open Sans', 'Ubuntu Mono', courier-new, courier, monospace;
        font-size: 17px;
        background-color:#eee;
        box-shadow: 1px 1px 2px rgba(10,10,10,0.1);
        box-shadow: 0 2px 2px 0 rgba(0,0,0,.14),
            0 3px 1px -2px rgba(0,0,0,.2),
            0 1px 5px 0 rgba(0,0,0,.12);
        transition: all 0.3s;
        opacity:0;
        z-index: 10003;
        flex-direction:column;
        max-height: calc(100% - 16px);
        box-sizing:border-box;
    }
    .items{
        min-height:100px;
        flex:1;
        overflow:auto;
    }
    menu-panel .menu-items{
        margin:-12px -12px 0px;width:initial;justify-content:flex-end
    }
    body.orient-v menu-panel .menu-items{width:initial}
    menu-panel .menu-items .menu-item{background-color:transparent}
    menu-panel .close-menu {
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
        return html`
        <div class="menu-items">
            <div class="menu-item"><i class="toggle-theme fal fa-eclipse-alt"></i></div>
            <div class="menu-item"><i class="close-menu fal fa-times"></i></div>
        </div>
        <div class="items"></div>
        <a class="toggle tutorial-link" title="Open Tutorial" @click="${this.openTutorial}">TUTORIAL</a>
        `;
	}

    openTutorial(){
        this.toggle();
        window.tutorial(0);
    }

    toggle() {
        this.hidden_ = !this.hidden_;
        let width;
        //$(this).css('display', this.hidden_ ? 'none' : 'block');
        if(this.hidden_) {
            width = this.getBoundingClientRect().width;
            $(this).css('opacity', 0);
            dpc(300, () => {
                $(this).css('display', 'none');
            })
        } else {
            $(this).css('opacity', 0);
            $(this).css('display', 'flex');
            width = this.getBoundingClientRect().width;
            $(this).css('opacity', 1);
        }
        let bounds = this.anchorEl.getBoundingClientRect();
        let align = this.anchorEl.getAttribute("data-menu-align") || 'left';
        let { left : x, bottom : y } = bounds;
        if(align == 'right')
            x = bounds.right-width;
        y += +(this.anchorEl.getAttribute("data-menu-v-offset") || 0);
        $(this).css({
            left : `${x}px`,
            top : `${y}px`
        });
    }
    
	firstUpdated() {

        this.anchorEl = document.getElementById('menu-anchor');
        $(this.anchorEl).on('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        $('.close-menu',this).on('click', ()=>{
            this.toggle();
        });

        $('.toggle-theme', this).on('click', ()=>{
            window.app.ctls['k-theme'].toggle();
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