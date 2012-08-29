function Keyboard(white, black) {

	// Inherit from panel
	Panel.call(this);

	// Center along x axes
	white.translate(-white.box().width / 2, 0);
	black.translate(-black.box().width / 2, 0);

	var keyWidth = white.box().width * 1.05;

	var currentKey = null,
		currentOctave = null;

	var wholeNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
		halfNames = ['C#', 'D#', null, 'F#', 'G#', 'A#'];

	// For event callbacks
	var keys = this;


	var mouseDown = false;
	$(window).on('mousedown', function() {
		mouseDown = true;
	});

	$(window).on('mouseup', function() {
		mouseDown = false;
	});

	for(var octave = 2; octave < 8; octave++) {

		currentOctave = new Panel();
		currentOctave.translate((octave - 2) * (keyWidth * 7), 0);

		// Bottom row of keys
		for(var bottom = 0; bottom < 7; bottom++) {

			currentKey = white.clone();
			currentKey.svg.attr('pitch', wholeNames[bottom] + octave);
			
			currentKey.translate(keyWidth * bottom, 0);
			currentKey.svg.on('mouseenter', function(e) {
				color(this, '#bde8ff');

				if(mouseDown) {
					play($(this).attr('pitch'));
				}

			});
			currentKey.svg.on('mouseleave', function() {
				color(this, '#ffffff');
			});

			currentKey.svg.on('mousedown', function() {
				play($(this).attr('pitch'));
			});

			currentOctave.svg.append(currentKey.svg);
		}

		// Top row of keys
		for(var top = 0; top < 6; top++) {
			if(top === 2) {
				continue;
			}

			currentKey = black.clone();
			currentKey.svg.attr('pitch',  halfNames[top] + octave);

			currentKey.translate(keyWidth * (top + 0.6), 0);
			currentKey.svg.on('mouseenter', function() {

				color(this, '#bde8ff');

				if(mouseDown) {
					play($(this).attr('pitch'));
				}
			});
			currentKey.svg.on('mouseleave', function() {
				color(this, '#171717');
			});
			currentKey.svg.on('mousedown', function() {
				play($(this).attr('pitch'));
			});

			currentOctave.svg.append(currentKey.svg);
		}

		this.svg.append(currentOctave.svg);
	}

	function play(pitch) {
		var pitch = new Pitch(pitch);
		var note = new Note(pitch, 1000, [
			Clip()
		]);
		keys.instrument.play(note);
	}

	function color(element, color) {
		var path = $(element).find('path').first();
		var style = path.attr('style');
		style = style.replace(/fill:[^;]+/g, 'fill:'+color+';')
		path.attr('style', style);
	}
}

Keyboard.prototype = Object.create(Panel.prototype);

Keyboard.prototype.highlight = function(pitch, color) {
	color = color || 'bde8ff';
	var fill = /fill:([^;]+)/g;

	var key = this.svg.find('[pitch=' + pitch + ']');

	var path = key.find('path').first(),
		style = path.attr('style');

	var original = fill.exec(style)[1];

	style = style.replace(fill, 'fill:' + color + ';');
	path.attr('style', style);

	// Call this to return the key back to normal
	return function() {
		style = style.replace(fill, 'fill:' + original + ';');
		path.attr('style', style);
	};
};