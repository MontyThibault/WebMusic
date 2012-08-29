// A super-duper rediculously simple state machine
// Used as a base for the rendering and playback mechanisms
function State(initial) {
	this.state = initial;
}

State.prototype.process = function(event) {};