function load_share ( date ) {
	
	var url ='includes/share.php';
	
	return $.ajax({
		type: 'GET',
		url: url,
		data: { 
			component: component, 
			share_pt_text: share_pt_text, 
			share_fb_text: share_fb_text, 
			share_fb_href: share_fb_href,
			share_tw_text: share_tw_text,
			share_em_text: share_em_text,
			share_url: share_url, 
			share_image: share_image
		},
		cache: true,
		success: function ( data ) {
			$('#share-this').append(data);
			
			ZeroClipboard.setMoviePath('./js/zeroclipboard/ZeroClipboard.swf');
			var clip = new ZeroClipboard.Client();
			clip.addEventListener('mousedown',function() {
				// Date for pop_on_date and pyramid
				var dateString = '';
				if ( typeof date !== 'undefined' ) {
					dateString = '&date=' + date;
				}
				// Generate a random number for SiteCatalyst
				var popclkString = '&popclk=' + ( Math.floor(Math.random() * 900000) + 100000 ); 
				
				clip.setText('<iframe src="' + _URL_ + 'embed.php?component=' + component + dateString + popclkString + '" width="389" height="' + ($('#main-wrapper').outerHeight() + 16) + '" frameBorder="0" allowtransparency="true"></iframe>');
			});
	
			var $notice = $('div#copy-notice');
			clip.addEventListener('complete',function(client,textObj) {
				$notice.css({ opacity: 1.0 });
				$notice.animate({ opacity: 0.0 }, 1000);
			});
			//glue it to the button
			clip.glue('embed-this');
		}
	});
}

function download_csv ( json, component ) {
	
	// Create a hidden div containing a form which submits to an iframe
	$('<div style="display:none"><form action="share/jsontocsv.php" method="post" target="_blank"><input name="json" /><input name="component" /></form></div>')
		// Attach to DOM
		.appendTo('body')
		// Fill in form values
		.find('input[name="json"]').val(JSON.stringify(json)).end() // Stringify because we want the object as a string (supported in IE8+)
		.find('input[name="component"]').val(component).end()
		// Submit the form (triggering the download)
		.find('form').submit().end()
		// Remove itself
		.remove();
}

function image_url ( name ) {
	
	return _URL_ +'share/images/' + image_name(name);
}

function image_name ( name ) {
	
	return name + '.png';
}

function find_image ( name ) {
	
	var url = image_url(name);
	
	return $.ajax({
		type: 'GET',
		url: url,
		cache: false
	});
}

function create_image ( svg, name ) {
	
	var url = 'share/svgtoimage.php';
	
	return $.ajax({
		type: 'POST',
		url: url,
		data: { svg: svg, name: image_name(name) }
	});
}