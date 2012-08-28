function Note(pitch, duration, modifiers) {
	this.pitch = pitch;
	this.modifiers = modifiers;
	this.duration = duration;
	
	// Set when the note starts playing
	this.start = null;
}