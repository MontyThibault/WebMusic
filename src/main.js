window.onload = function() {
	var items = [
		[load.all, [
			[load.sample, 'assets/samples/Ensoniq-C2.wav'],
			[load.sample, 'assets/samples/Ensoniq-C4.wav'],
			[load.sample, 'assets/samples/Ensoniq-C7.wav']
		]],
		
		[load.all, [
			[load.SVG, 'assets/svg/whiteKey.svg'],
			[load.SVG, 'assets/svg/blackKey.svg']
		]],
		
		[load.JSON, 'music.json']
	];

	load.all(items, function(loaded) {
		// Remove spinner
		spin.remove();

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
		top: window.innerHeight / 3,
		left: window.innerWidth / 2,
		lines: 13,
		length: 8,
		width: 4,
		radius: 24
	};
	var target = $('body')[0];
	var spin = $(new Spinner(options).spin(target).el);
	spin.css('position', 'absolute');
};