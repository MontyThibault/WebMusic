var tick = false;
window.log = function() {
	if(!tick) {
		console.log.apply(console, arguments);
		tick = true;
		setTimeout(function() { tick = true; }, 1000);
	}
};

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

		var white = images[0],
			black = images[1];

		// Center along x axes
		white.translate(-white.box().width / 2, 0);
		black.translate(-black.box().width / 2, 0);

		var keyboard = new Panel(),
			keyWidth = white.box().width * 1.05;

		var currentKey = null,
			currentOctave = null;

		for(var octave = 0; octave < 4; octave++) {

			currentOctave = new Panel();
			currentOctave.translate(octave * (keyWidth * 7), 0);

			// Bottom row of keys
			for(var bottom = 0; bottom < 7; bottom++) {

				currentKey = white.clone();
				
				currentKey.translate(keyWidth * bottom, 0);
				currentKey.svg.on('mouseenter', function() {

					// The main white area of the key
					var path = $(this).find('path').first();
					var style = path.attr('style');
					style = style.replace(/fill:[^;]+/g, 'fill:#bde8ff;')
					path.attr('style', style);

					// $(this).attr('style', 'fill:rgb(255, 0, 0);');
				});
				currentKey.svg.on('mouseleave', function() {
					var path = $(this).find('path').first();
					var style = path.attr('style');
					style = style.replace(/fill:[^;]+/g, 'fill:#ffffff;')
					path.attr('style', style);
				});


				currentOctave.svg.append(currentKey.svg);

			}

			// Top row of keys
			for(var top = 0; top < 7; top++) {
				if(top === 2 || top === 6) {
					continue;
				}

				currentKey = black.clone();

				currentKey.translate(keyWidth * (top + 0.6), 0);
				currentKey.svg.on('mouseenter', function() {

					// The main white area of the key
					var path = $(this).find('path').first();
					var style = path.attr('style');
					style = style.replace(/fill:[^;]+/g, 'fill:#bde8ff;')
					path.attr('style', style);

					// $(this).attr('style', 'fill:rgb(255, 0, 0);');
				});
				currentKey.svg.on('mouseleave', function() {
					var path = $(this).find('path').first();
					var style = path.attr('style');
					style = style.replace(/fill:[^;]+/g, 'fill:#171717;')
					path.attr('style', style);
				});

				currentOctave.svg.append(currentKey.svg);

			}

			keyboard.svg.append(currentOctave.svg);
		}

		keyboard.scale(5, 5);

		$(svg).append(keyboard.svg);

		window.keyboard = keyboard;

		// white = arguments[3];
		//$(svg).append(white.svg[0]);

		// var pitch = new Pitch('C5'),
		// 	note = new Note(pitch, 1000, [
		// 		Dynamic('mp'),
		// 		Staccato()
		// 	]);

		// piano.play(note);
	});
};