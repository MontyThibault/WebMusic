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