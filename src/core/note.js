function Note(pitch, duration, modifiers) {
	this.pitch = pitch;
	this.duration = duration;
	this.modifiers = modifiers;
	
	// Set when the note starts playing
	this.start = null;
}