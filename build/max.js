/*!
I love source code!
*/

///////////////////////////////////////
//File: src/misc/context.js


var context = new webkitAudioContext();


///////////////////////////////////////
//File: src/misc/loaders.js


// Interface for all loaders should be (url, callback) in order for the load.all
// function to work properly

var load = {};

load.XML = function(url, callback) {

	var parser = new DOMParser();
	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onload = function() {
		var xml = parser.parseFromString(request.response, 'text/xml');
		callback(xml.documentElement);
	};

	request.send();
};

load.SVG = function(url, callback) {

	// This will match the ending filename of any given directory
	var filename = /([^\/]+)\./g.exec(url)[1];

	load.XML(url, function(x) {

		// Create a panel object for convenience
		var contents = $(x).contents();
		var panel = new Panel(contents);

		panel.svg.attr('class', filename);

		return callback(panel);
	});
}

load.sample = function(url, callback) {

	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	request.onload = function() {
		context.decodeAudioData(request.response, function(a) {
			callback(a);
		});
	};
	request.send();
};

load.JSON = $.getJSON;

// Loads all items in the given array. Array structure is like this:
// [[function, url], [function, url]]
// The script loads each item sequentially, stopping once all of the items have
// been loaded. 
load.all = function(items, callback, outputs) {
	var next = items.shift();

	if(typeof next[1] === 'string') {
		load.updateScreen(next[1]);
	}

	// Load the next item
	next[0](next[1], function(x) {

		outputs = outputs || [];
		outputs.push(x);

		// If there are still more items
		if(items.length) {
			load.all(items, callback, outputs);

		// If all items are done
		} else {
			callback.call(this, outputs);
		}
	});
};

// Updates the file name in the loading screen
load.updateScreen = function(url) {
	$('#currentFile').text(url);
};


///////////////////////////////////////
//File: src/misc/falloff.js


function getFalloff(data, value) {
	// Lower limit (assuming the list is sorted)
	if(value <= data[0][0]) {
	   return data[0][1];   
	}
	
	// Upper limit (assuming the list is sorted)
	if(value >= data[data.length - 1][0]) {
	   return data[data.length - 1][1];   
	}
	
	var i;
	for(i = 0; i < data.length; i++) {
		if(data[i][0] === value) {
		   return data[i][1]; 
		}
		
		if(data[i][0] > value) {
		   break;   
		}
	}
  
	var before = data[i - 1];
	var after = data[i];

	var between = (after[0] - value) / (after[0] - before[0]);
	
	// Limit range from 0 to 1
	between = Math.max(0, Math.min(between, 1));

	return (before[1] * between) + (after[1] * (1 - between));
}


///////////////////////////////////////
//File: src/core/pitch.js


function Pitch(pitch) {
	if(typeof pitch === 'string') {
		this.setName(pitch);
	} else {
		this.step = pitch;
	}
}

Pitch.prototype.toStep = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11};
Pitch.prototype.toNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

Pitch.prototype.getName = function() {
	var octave = Math.floor(this.step / 12),
		note = this.toNote[this.step % 12];

	return note + octave;
};

Pitch.prototype.setName = function(pitch) {
	// Matches the note and octave in scientific pitch notation
	// Examples: ['G', '4'], ['C#', '0'], ['A#', '140']
	var matchPitch = /^([A-G]#?)([0-9]+)$/,
		matches = pitch.match(matchPitch);

	var octave = parseInt(matches[2]),
		note = this.toStep[matches[1]];

	this.step = (octave * 12) + note;
};


///////////////////////////////////////
//File: src/core/note.js


function Note(pitch, duration, modifiers) {
	this.pitch = pitch;
	this.duration = duration;
	this.modifiers = modifiers;
	
	// Set when the note starts playing
	this.start = null;
}


///////////////////////////////////////
//File: src/core/instrument.js


function Instrument(samples) {
	this.samples = samples;
}

// Multiply any frequency by this number to raise the note by a half step
var HALFSTEP_INTERVAL = Math.pow(2, 1 / 12);

Instrument.prototype.play = function(note) {

	// Get sample closest to target pitch
	var closestSample,
		closestDiff;

	for(var i = 0, l = this.samples.length; i < l; i++) {
		var diff = Math.abs(this.samples[i].pitch.step - note.pitch.step);

		if(!closestSample || diff < closestDiff) {
			closestSample = this.samples[i];
			closestDiff = diff;
		}
	}

	// This is used by modifiers to check how long a note has been playing so
	// that falloff can be applied accurately. 
	note.start = new Date().getTime();

	var source = context.createBufferSource();
	source.buffer = closestSample;

	// Connect all of the modifiers in a chain
	var currentModifier = source;
	for(var i = 0; i < note.modifiers.length; i++) {

		note.modifiers[i].note = note;

		currentModifier.connect(note.modifiers[i]);
		currentModifier = note.modifiers[i];

		// Some modifiers define a constructor function
		currentModifier.start && currentModifier.start(note);
	}
	currentModifier.connect(context.destination);

	var diff = note.pitch.step - closestSample.pitch.step;
	source.playbackRate.value = Math.pow(HALFSTEP_INTERVAL, diff);

	source.noteOn(0);

	return source.noteOff;
};


///////////////////////////////////////
//File: src/core/player.js


function Player(initial, instrument, events) {
	this.state = initial;
	this.instrument = instrument;
	this.events = events;

	this.active = true;
}

Player.prototype.process = function(evt) {
	if(!this.active)
		return false;

	evt = evt || this.events.shift();

	// Done the sequence
	if(!evt)
		return false;

	var wait = this.callbacks[evt.type].call(this, evt) || 0;

	if(wait < 5) {
		this.process();
	} else {
		var player = this;
		setTimeout(function() {
			player.process();
		}, wait);
	}
};

// These methods corrispond to the JSON event types
// They return the millisecond delay until the next process
Player.prototype.callbacks = {
	letRing: function(evt) {
		this.state.letRing = evt.value;
	},
	dynamic: function(evt) {
		this.state.dynamic = evt.value;
	},
	staccato: function(evt) {
		this.state.staccato = evt.value;
	},
	tempo: function(evt) {
		this.state.tempo = evt.tempo;
	},
	timesig: function(evt) {
		this.state.timesig = evt.timesig;
	},
	note: function(evt) {

		var pitch = new Pitch(evt.pitch),
			beats = evt.duration / 4,
			minute = 1000 * 60,
			duration = minute / this.state.tempo / beats;

		var modifiers = [];

		(evt.staccato || this.state.staccato) && modifiers.push(Staccato());
		(evt.dynamic || this.state.dynamic) && modifiers.push(Dynamic(evt.dynamic));
		!(evt.letRing || this.state.letRing) && modifiers.push(Clip());

		var note = new Note(
			new Pitch(evt.pitch),
			duration,
			modifiers
		);
		this.instrument.play(note);

		var off = this.state.keyboard.highlight(evt.pitch);
		setTimeout(function() {
			off();
		}, duration);

		return duration;
	},
	rest: function(evt) {
		var beats = evt.duration / 4,
			minute = 1000 * 60,
			duration = minute / this.state.tempo / beats;

		return duration;
	}
}


///////////////////////////////////////
//File: src/display/svg.js


// The master svg object to hold elements
var svg = $('svg')[0];


///////////////////////////////////////
//File: src/display/point.js


// http://stackoverflow.com/questions/4850821/svg-coordinates-with-transform-matrix
function createPoint(x, y) {
	var pt = svg.createSVGPoint();
	pt.x = x || 0;
	pt.y = y || 0;

	return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function localSpace(pt, object) {
	var globalToLocal = object.getTransformToElement(svg).inverse();
	return pt.matrixTransform(globalToLocal);
}

function globalSpace(pt, object) {
	var localToGlobal = object.getTransformToElement(svg);
	return pt.matrixTransform(localToGlobal);
}


///////////////////////////////////////
//File: src/display/panel.js


// SVG utility class
function Panel(element) {

	// Create an empty group if no element is passed in
	if(!element) {
		var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.svg = $(g);

	// If a set of elements are passed in, add them to a group
	} else if(element.length > 1) {
		var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.svg = $(g).append(element);

	// Add the element just as it is
	} else {
		this.svg = $(element);
	}
}

Panel.prototype.clone = function() {
	return new Panel(this.svg.clone());
};

// Returns the bounding box of this element
Panel.prototype.box = function() {

	// If this element is in the document markup
	if($(svg).find(this.svg).length) {
		return this.svg[0].getBBox();
	}

	// Must be added to the markup for getBBox() to work
	$(svg).append(this.svg);

	var box =  this.svg[0].getBBox();
	
	this.svg.remove();

	return box;
};

// Returns a point representing the center of this element
Panel.prototype.center = function() {
	var box = this.svg[0].getBBox(),
		pt = svg.createSVGPoint();
	pt.x = box.x + (box.width / 2);
	pt.y = box.y + (box.height / 2);

	return pt;
};

// Wraps this panel in a group tag; useful for doing multiple transformations
Panel.prototype.wrap = function() {
	var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	this.svg.wrap(g);
	this.svg = this.svg.parent();
};

// Sets a new translation for this panel
Panel.prototype.translate = function(x, y) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current translation, if any
	transform = transform.replace(/translate\(.*\)/g, '');
	transform += ' translate('+ x +', '+ y +')';

	this.svg.attr('transform', transform);
};

Panel.prototype.scale = function(x, y) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current scale, if any
	transform = transform.replace(/scale\(.*\)/g, '');
	transform += ' scale('+x+', '+(x || y)+')';

	this.svg.attr('transform', transform);
};

Panel.prototype.rotate = function(r) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current rotation, if any
	transform = transform.replace(/rotate\(.*\)/g, '');
	transform += ' rotate('+r+')';

	this.svg.attr('transform', transform);
}


///////////////////////////////////////
//File: src/modifiers/dynamic.js


var Dynamic = (function() {
	// Each sequential increase of dynamics is this many times as load as the last one
	// Increase this value to get more dramatic changes
	var increase = 3;

	var levels = {
		'ff': Math.pow(increase, 2),
		'f': Math.pow(increase, 1),
		'mf': Math.pow(increase, 0),
		'mp':Math.pow(increase, -1),
		'p': Math.pow(increase, -2),
		'pp': Math.pow(increase, -3)
	};

	function Dynamic(level) {
		var modifier = context.createGainNode();
		modifier.gain.value = levels[level];

		return modifier;
	}

	return Dynamic;
})();


///////////////////////////////////////
//File: src/modifiers/staccato.js


var Staccato = (function() {

	var falloff = [
		[0, 1], // 0ms = full volume
		[100, 1], // 50ms = full volume
		[200, 0] // 100ms = silent
	];

	var process = function(e) {
		if(!this.note) {
			return false;
		}

		var sinceStart = new Date().getTime() - this.note.start,
			volume = getFalloff(falloff, sinceStart);

		var output = e.outputBuffer.getChannelData(0),
			input = e.inputBuffer.getChannelData(0);
		for(var i = 0, l = input.length; i < l; i++) {

			output[i] = input[i] * volume;

		}
	};

	function Staccato() {
		var modifier = context.createJavaScriptNode(1024, 1, 1);
		modifier.onaudioprocess = process;

		return modifier;
	}

	return Staccato;

})();


///////////////////////////////////////
//File: src/modifiers/clip.js


// Does not play the note past the set duration
var Clip = (function() {
	
	var timer = function(note) {
		var gain = this.gain;

		setTimeout(function() {
			gain.value = 0;
		}, note.duration);
	};

	function Clip() {
		var modifier = context.createGainNode();
		modifier.start = timer;

		return modifier;
	}

	return Clip;
})();


///////////////////////////////////////
//File: src/display/keyboard.js


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


///////////////////////////////////////
//File: src/tests.js


function breakEverything() {

	

}


///////////////////////////////////////
//File: src/main.js


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