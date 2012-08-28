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