// Does not play the note past the set duration
var Clip = (function() {
	
	var timer = function(note) {
		var gain = this.gain;

		setTimeout(function() {
			gain.value = 0;
		}, note.duration);
	};

	function Clip() {
		var modifier = context.createGain();
		modifier.start = timer;

		return modifier;
	}

	return Clip;
})();