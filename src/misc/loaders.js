var load = {};

load.XML = function(url, callback) {
	var parser = new DOMParser();
	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onload = function() {
		var xml = parser.parseFromString(request.response, 'text/xml');
		callback(xml);
	};

	request.send();
};

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
			callback.apply(this, outputs);
		}
	});
};