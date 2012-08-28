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