window.onload = function() {
	var items = [
		[load.all, [
			[load.sample, 'assets/samples/Ensoniq-C2.wav'],
			[load.sample, 'assets/samples/Ensoniq-C4.wav'],
			[load.sample, 'assets/samples/Ensoniq-C7.wav']
		]],
		
		[load.all, [
			[load.SVG, 'assets/svg/whiteKey.svg'],
			[load.SVG, 'assets/svg/blackKey.svg'],

			[load.SVG, 'assets/svg/treble.svg'],
			[load.SVG, 'assets/svg/bass.svg'],
			[load.SVG, 'assets/svg/lines.svg']
		]],
		
		[load.JSON, 'music.json']
	];

	load.all(items, function(loaded) {
		// Remove spinner & file indicator
		spin.remove();
		currentFile.remove();

		var samples = loaded[0],
			images = loaded[1],
			music = loaded[2];

		/////////////////////////////////////

		var c2 = samples[0],
			c4 = samples[1],
			c7 = samples[2];

		c2.pitch = new Pitch('C2');
		c4.pitch = new Pitch('C4');
		c7.pitch = new Pitch('C7');

		var piano = new Instrument([c2, c4, c7]);

		///////////////////////////////////////

		var keys = new Keyboard(images[0], images[1]);
		keys.instrument = piano;

		$(svg).append(keys.svg);

		function stretch() {
			// Stretch to fill window
			var box = keys.box(),
				scale = window.innerWidth / box.width;

			keys.translate(0, window.innerHeight - (box.height * scale) - 10);
			keys.scale(scale);
		}
		stretch();
		window.onresize = stretch;
		////////////////////////////////////

		var treble = images[2],
			bass = images[3],
			lines = images[4];

		var title = new Panel(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
		title.svg.text(music.meta.title);

		title.svg.css({
			'font-family': 'Source Sans Pro',
			'font-weight': 400
		});

		var box = title.box();

		title.translate(-box.x, -box.y);
		title.scale(3);

		title.wrap();
		title.translate(30, 100);

		$(svg).append(title.svg);

		var composer = new Panel(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
		composer.svg.text(music.meta.composer);

		composer.svg.css({
			'font-family': 'Source Sans Pro',
			'font-weight': 200
		});

		var box = composer.box();

		composer.translate(-box.x, -box.y);
		composer.scale(1.5);

		composer.wrap();
		composer.translate(30, 130);

		$(svg).append(composer.svg);


		////////////////////////////////////

		var channel;
		for(var i = 0; i < music.channels.length; i++) {
			channel = music.channels[i];

			var player = new Player({
				tempo: 120,
				timesig: [4, 4],
				keyboard: keys
			}, piano, channel.events, {});
			
			player.process();
		}
	});

	// Loading spinner
	var options = {
		lines: 13,
		length: 8,
		width: 2,
		radius: 24
	};
	var target = $('body')[0];
	var spin = $(new Spinner(options).spin(target).el);
	spin.removeAttr('style'); // EVIL!

	var currentFile = $('<span></span>');
	currentFile.attr('id', 'currentFile');
	$(target).append(currentFile);
};