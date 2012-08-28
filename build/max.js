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
		callback(xml);
	};

	request.send();
};

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
			callback.apply(this, outputs);
		}
	});
};


///////////////////////////////////////
//File: src/misc/vector2.js


/**
 * @author mrdoob / http://mrdoob.com/
 * @author philogb / http://blog.thejit.org/
 * @author egraether / http://egraether.com/
 * @author zz85 / http://www.lab4games.net/zz85/blog
 */

var Vector2 = function ( x, y ) {

	this.x = x || 0;
	this.y = y || 0;

};

Vector2.prototype = {

	constructor: Vector2,

	set: function ( x, y ) {

		this.x = x;
		this.y = y;

		return this;

	},

	copy: function ( v ) {

		this.x = v.x;
		this.y = v.y;

		return this;

	},

	add: function ( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	},

	addSelf: function ( v ) {

		this.x += v.x;
		this.y += v.y;

		return this;

	},

	sub: function ( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	},

	subSelf: function ( v ) {

		this.x -= v.x;
		this.y -= v.y;

		return this;

	},

	multiplyScalar: function ( s ) {

		this.x *= s;
		this.y *= s;

		return this;

	},

	divideScalar: function ( s ) {

		if ( s ) {

			this.x /= s;
			this.y /= s;

		} else {

			this.set( 0, 0 );

		}

		return this;

	},

	negate: function() {

		return this.multiplyScalar( - 1 );

	},

	dot: function ( v ) {

		return this.x * v.x + this.y * v.y;

	},

	lengthSq: function () {

		return this.x * this.x + this.y * this.y;

	},

	length: function () {

		return Math.sqrt( this.lengthSq() );

	},

	normalize: function () {

		return this.divideScalar( this.length() );

	},

	distanceTo: function ( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	},

	distanceToSquared: function ( v ) {

		var dx = this.x - v.x, dy = this.y - v.y;
		return dx * dx + dy * dy;

	},

	setLength: function ( l ) {

		return this.normalize().multiplyScalar( l );

	},

	lerpSelf: function ( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;

		return this;

	},

	equals: function( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) );

	},

	isZero: function () {

		return ( this.lengthSq() < 0.0001 /* almostZero */ );

	},

	clone: function () {

		return new Vector2( this.x, this.y );

	}

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
		[load.sample, 'assets/samples/Ensoniq-C2.wav'],
		[load.sample, 'assets/samples/Ensoniq-C4.wav'],
		[load.sample, 'assets/samples/Ensoniq-C7.wav'],
		[load.JSON, 'music.json']
	];

	load.all(items, function(c2, c4, c7, music) {
		c2.pitch = new Pitch('C2');
		c4.pitch = new Pitch('C4');
		c7.pitch = new Pitch('C7');
		var piano = new Instrument([c2, c4, c7]);

		var pitch = new Pitch('C5'),
			note = new Note(pitch, 1000, [
				Dynamic('mp'),
				Staccato()
			]);

		piano.play(note);
	});
};