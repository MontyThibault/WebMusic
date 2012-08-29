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

	var wait = this.callbacks[evt.type] && this.callbacks[evt.type].call(this, evt);

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
	tempo: function(evt) {
		this.state.tempo = evt.tempo;

		return 0;
	},
	timesig: function(evt) {
		this.state.timesig = evt.timesig;

		return 0;
	},
	note: function(evt) {

		var pitch = new Pitch(evt.pitch),
			beats = evt.duration / 4,
			minute = 1000 * 60,
			duration = minute / this.state.tempo / beats;

		var modifiers = [];

		evt.staccato && modifiers.push(Staccato());
		evt.dynamic && modifiers.push(Dynamic(evt.dynamic));
		!evt.letRing && modifiers.push(Clip());

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