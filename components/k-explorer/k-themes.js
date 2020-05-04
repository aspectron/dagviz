import {css} from 'lit-element/lit-element.js';

let kThemeLight = css`
	body{
		--k-box-shadow:0 2px 2px 0 rgba(10,10,10,.14),
			0 3px 1px -2px rgba(10,10,10,.2),
			0 1px 5px 0 rgba(10,10,10,.12);
		--k-block-shadow:var(--k-box-shadow);
		--k-heading-border-color:#2489da;
		--k-highlight-bg-color:#009688;
		--k-highlight-color:#FFF;
		--k1-highlight-animation:k-highlight-ani-1;

	}

	.k-theme-light{
		--k-bg-color1:#FFF;
		--k-color1:#212529;
		--k-border-color1:#e5e5e5;
		--k-btn-border-color:#cccccc;
		--k-btn-hover-bg-color:rgba(0,0,0, 0.2);
		--k-btn-hover-border-color:#cccccc;
		--k-btn-primary-color:#FFF;
		--k-btn-primary-hover-color:#FFF;
		--k-loading-mask-bg-color:rgba(255, 255, 255, 0.7);
		--k-box-shadow:0 2px 2px 0 rgba(0,0,0,.14),
			0 3px 1px -2px rgba(0,0,0,.2),
			0 1px 5px 0 rgba(0,0,0,.12);

		/* block panel */
		--k-block-bg-color:var(--k-bg-color1);
		--k-block-color:var(--k-color1);
		--k-block-shadow:var(--k-box-shadow);
	}
`;

export {kThemeLight};

let style = document.head.querySelector(".k-themes") || document.createElement("style");
style.innerHTML = kThemeLight.toString();
if(!style.parentNode)
	document.head.insertBefore(style, document.head.querySelector(":last-child"));