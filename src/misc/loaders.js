// Interface for all loaders should be (url, callback) in order for the load.all
// function to work properly

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
	// This will match the ending filename of any given directory
	var filename = /([^\/]+)\./g.exec(url)[1];

	load.XML(url, function(x) {

		// Create a panel object for convenience
		var contents = $(x).contents();
		var panel = new Panel(contents);

		panel.svg.attr('class', filename);

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

// Loads all items in the given array. Array structure is like this:
// [[function, url], [function, url]]
// The script loads each item sequentially, stopping once all of the items have
// been loaded. 
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