var Dynamic = (function() {
	// Each sequential increase of dynamics is this many times as load as the last one
	// Increase this value to get more dramatic changes
	var increase = 3;

	var levels = {
		'ff': Math.pow(increase, 2),
		'f': Math.pow(increase, 1),
		'mf': Math.pow(increase, 0),
		'mp':Math.pow(increase, -1),
		'p': Math.pow(increase, -2),
		'pp': Math.pow(increase, -3)
	};

	function Dynamic(level) {
		var modifier = context.createGainNode();
		modifier.gain.value = levels[level];

		return modifier;
	}

	return Dynamic;
})();