var load = {};

load.XML = function(url, callback) {
	var parser = new DOMParser();
	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onload = function() {
		var xml = parser.parseFromString(request.response, 'text/xml');
		callback(xml.documentElement);
	};

	request.send();
};

load.SVG = function(url, callback) {
	// This will match the ending filename PLUS the proceeding period
	var filename = url.match(/([^\/]+)\./g)[0];

	// Trim off the period
	filename = filename.substring(0, filename.length - 1);

	load.XML(url, function(x) {

		var contents = $(x).contents();
		var panel = new Panel(contents);

		panel.svg.attr('id', filename);

		return callback(panel);
	});
}

load.sample = function(url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	request.onload = function() {
		context.decodeAudioData(request.response, function(a) {
			callback(a);
		});
	};
	request.send();
};

load.JSON = $.getJSON;

load.all = function(items, callback, outputs) {
	var next = items.shift();

	// Load the next item
	next[0](next[1], function(x) {

		outputs = outputs || [];
		outputs.push(x);

		// If there are still more items
		if(items.length) {
			load.all(items, callback, outputs);

		// If all items are done
		} else {
			callback.call(this, outputs);
		}
	});
};