function Instrument(samples) {
	this.samples = samples;
}

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

	note.start = new Date().getTime();

	var source = context.createBufferSource();
	source.buffer = closestSample;

	// Connect all of the modifiers in a chain
	var currentModifier = source;
	for(var i = 0; i < note.modifiers.length; i++) {

		note.modifiers[i].note = note;

		currentModifier.connect(note.modifiers[i]);
		currentModifier = note.modifiers[i];

		currentModifier.start && currentModifier.start(note);
	}
	currentModifier.connect(context.destination);

	var diff = note.pitch.step - closestSample.pitch.step;
	source.playbackRate.value = Math.pow(HALFSTEP_INTERVAL, diff);

	// Play the note
	source.noteOn(0);

	return source.noteOff;
};