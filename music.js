(function() {
	if(!webkitAudioContext) {
		alert('A modern version of Chrome or Safari is required!');
		return;
	}

	var context = new webkitAudioContext();

	function loadAudio(url, callback) {
		var request = new XMLHttpRequest();
		request.open('GET', url, true);
		request.responseType = 'arraybuffer';

		request.onload = function() {
			context.decodeAudioData(request.response, function(a) {
				callback(a);
			});
		};

		request.send();
	}

	function loadMusic(url, callback) {
		var parser = new DOMParser();
		var request = new XMLHttpRequest();
		request.open('GET', url, true);

		request.onload = function() {
			var xml = parser.parseFromString(request.response, 'text/xml');
			callback(xml);
		};

		request.send();
	}

	loadMusic('music.xml', function(music) {

		// Because I can
		loadAudio('samples/Ensoniq-C2.wav', function(c2) {
			loadAudio('samples/Ensoniq-C4.wav', function(c4) {
				loadAudio('samples/Ensoniq-C7.wav', function(c7) {

					c2.pitch = new Pitch('C2');
					c4.pitch = new Pitch('C4');
					c7.pitch = new Pitch('C7');

					var piano = new Instrument([c2, c4, c7]);

					doStuff(music, piano);
				});
			});
		});
	});

	function Instrument(samples) {
		this.samples = samples;
	}

	// Multiply any frequency by this to raise by a half step

	// Any note one octave higher should be twice the frequency,
	// So this value can be found with the equation:
	// x^12 = 2
	// Where multiplying any frequency by this 12 times should
	// equal exactly twice that frequency

	// Equiv. to  ¹²√2
	var HALFSTEP_INTERVAL = Math.pow(2, 1 / 12);

	///////////////////////////

	function Pitch(step) {
		if(step.length) {
			this.setName(step);
		} else {
			this.step = step;
		}
	}

	Pitch.prototype.toStep = {'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11};
	Pitch.prototype.toNote = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

	Pitch.prototype.getName = function() {
		var octave = Math.floor(this.step / 12),
			note = this.toNote[this.step % 12];

		return note + octave;
	}

	Pitch.prototype.setName = function(x) {
		var octave = x.substr(x.length - 1, x.length),
			note = x.substr(0, x.length - 1);

		this.step = (octave * 12) + this.toStep[note];
	};

	window.pitch = Pitch;

	/////////////////////////////

	function Note(instrument, pitch) {
		this.instrument = instrument;
		this.pitch = pitch || new Pitch('C4');
	};

	Note.prototype.getFrequency = function(sample) {
		var base = sample.pitch.step;

		return Math.pow(HALFSTEP_INTERVAL, this.pitch.step - base);
	};

	Note.prototype.play = function() {
		var sample, diff, 
			lowestSample = this.instrument.samples[0],
			lowestDiff = Math.abs(lowestSample.pitch.step - this.pitch.step); 
			
		for(var i = 1; i < this.instrument.samples.length; i++) {
			sample = this.instrument.samples[i];
			diff = Math.abs(sample.pitch.step - this.pitch.step);

			if(diff < lowestDiff) {
				lowestDiff = diff;
				lowestSample = sample;
			}
		}

		return playNote(lowestSample, this.getFrequency(lowestSample));
	};

	function parseElement(element, state) {

		if(element.is('note')) {
			var note = element;

			return [{
				type: 'note',
				pitch: note.attr('pitch') || state.pitch,
				duration: note.attr('duration') || state.duration,
				tempo: state.tempo || 120
			}];

		} else if(element.is('rest')) {

			return [{
				type: 'rest',
				duration: element.attr('duration'),
				tempo: state.tempo || 120
			}];

		} else {

			state = $.extend({}, state);

			if(element.is('section')) {
				state.tempo = parseInt(element.attr('tempo'));
			}

			var noteList = [], $value, inside;
			element.children().each(function(index, value) {
				$value = $(value);
				inside = parseElement($value, state);

				noteList = noteList.concat(inside);
			});

			return noteList;
		}
	}

	// Play the sequence through with proper timings
	function playSequence(seq, piano, stops) {
		if(seq.length) {
			var note = seq.shift();

			// If not a rest
			if(note.type === 'note') {
				var pitch = new Pitch(note.pitch);

				// Returns a function that, when called, stops the playback
				var x = new Note(piano, pitch).play();
				stops.push(x);
			}

			if(note.duration === '0') {
				playSequence(seq, piano, stops);

				// Display mechanisms
				console.log(0, 0, note.pitch || 'rest');
				$('#notes').append('<div><span class="duration">'+0+'</span><span class="note">'+(note.pitch||'rest')+'</span></div>');

			} else {
				var dur = parseInt(note.duration);
				var delay = (1000 * 60) / note.tempo / (dur / 4);

				// --||--
				console.log(dur, delay, note.pitch || 'rest');
				$('#notes').append('<div><span class="duration">'+dur+'</span><span class="note">'+(note.pitch||'rest')+'</span></div>');


				setTimeout(function() {
					// If the next thing is a note
					if(seq[0].type === 'note') {

						// Stop all of the ringing notes
						for(var i = 0; i < stops.length; i++) {
							stops[i]();
						}
					}

					playSequence(seq, piano, []);
				}, delay);
			}
		}
	}


	function doStuff(data, piano) {

		data = $(data);

		var instrument = data.find('instrument').first();
		var channel = instrument.find('channel').first();

		var seq = parseElement(channel, {});

		console.log("Console structure:\ntype, duration, pitch");
		playSequence(seq, piano, []);
	}

	// Plays a given sample at a given speed. Returns a stopper function
	function playNote(buffer, playback) {
		var source = context.createBufferSource();
		source.buffer = buffer;

		var gain = context.createGainNode();

		source.connect(gain);
		gain.connect(context.destination);

		source.playbackRate.value = playback;

		source.noteOn(0);

		return function() {
			gain.gain.value = 0;
		};
	}

})();