/*!
I love source code!
*/

///////////////////////////////////////
//File: src/misc/context.js


var context = new webkitAudioContext();


///////////////////////////////////////
//File: src/misc/loaders.js


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
	// This will match the ending filename PLUS the proceeding period
	var filename = url.match(/([^\/]+)\./g)[0];

	// Trim off the period
	filename = filename.substring(0, filename.length - 1);

	load.XML(url, function(x) {

		var contents = $(x).contents();
		var panel = new Panel(contents);

		panel.svg.attr('id', filename);

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

load.all = function(items, callback, outputs) {
	var next = items.shift();

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
	this.modifiers = modifiers;
	this.duration = duration;
	
	// Set when the note starts playing
	this.start = null;
}


///////////////////////////////////////
//File: src/core/instrument.js


var HALFSTEP_INTERVAL = Math.pow(2, 1 / 12);

function Instrument(samples) {
	this.samples = samples;
}

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

	note.start = new Date().getTime();

	// Standard Web Audio API lingo
	var source = context.createBufferSource();
	source.buffer = closestSample;

	// Connect all of the modifiers in a chain
	var currentNode = source;
	for(var i = 0; i < note.modifiers.length; i++) {

		note.modifiers[i].note = note;

		currentNode.connect(note.modifiers[i]);
		currentNode = note.modifiers[i];
	}
	currentNode.connect(context.destination);

	var diff = note.pitch - closestSample.pitch;
	source.playbackRate.value = Math.pow(HALFSTEP_INTERVAL, diff)

	// Play the note
	source.noteOn(0);
};


///////////////////////////////////////
//File: src/display/svg.js


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

Panel.prototype.center = function() {
	var box = this.svg[0].getBBox(),
		pt = svg.createSVGPoint();
	pt.x = box.x + (box.width / 2);
	pt.y = box.y + (box.height / 2);

	return pt;
};

// // Wraps this panel in a group tag
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

	// Add a new translation
	transform += ' translate('+ x +', '+ y +')';

	this.svg.attr('transform', transform);
};

Panel.prototype.scale = function(x, y) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current scale, if any
	transform = transform.replace(/scale\(.*\)/g, '');

	// Add a new scale
	transform += ' scale('+x+', '+(x || y)+')';

	this.svg.attr('transform', transform);
};

Panel.prototype.rotate = function(r) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current rotation, if any
	transform = transform.replace(/rotate\(.*\)/g, '');

	// Add a new rotation
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
//File: src/tests.js


function breakEverything() {

	

}


///////////////////////////////////////
//File: src/main.js


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