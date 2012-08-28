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