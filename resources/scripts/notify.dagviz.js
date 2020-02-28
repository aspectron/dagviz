$.notify.addStyle('dagviz', {
	html:
		"<div>" +
		"<div class='image'></div>" +
		"<div class='close'></div>" +
		"<div class='text-wrapper'>" +
		"<div class='title' data-notify-html='title'/>" +
		"<div class='text' data-notify-html='text'/>" +
		"</div>" +
		"</div>",
	classes: {
		yellow: {
			"color": "#000 !important",
			"background-color": "rgba(255,255,230,0.975)",
			"border": "1px solid #666",
			"font-family": "Exo 2",
			"font-weight": "bold"
		},
		blue: {
			"color": "#fafafa !important",
			"background-color": "rgba(12,33,88,0.9)",
			"border": "1px solid #000",
			"font-family": "Open Sans"
		},
		red: {
			"color": "#fafafa !important",
			"background-color": "rgba(201,0,13,0.9)",
			"border": "1px solid #000",
			"font-family": "Open Sans"
		},
		multisig: {
			"color": "#fafafa !important",
			"background-color": "rgba(160,0,0,0.9)",
			"border": "1px solid #100",
			"font-family": "Open Sans"
		}
	}
});		

$.notify.defaults({ globalPosition : 'top right', className : 'yellow', style : 'dagviz', autoHide : true })
