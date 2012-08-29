// SVG utility class
function Panel(element) {

	// Create an empty group if no element is passed in
	if(!element) {
		var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.svg = $(g);

	// If a set of elements are passed in, add them to a group
	} else if(element.length > 1) {
		var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		this.svg = $(g).append(element);

	// Add the element just as it is
	} else {
		this.svg = $(element);
	}
}

Panel.prototype.clone = function() {
	return new Panel(this.svg.clone());
};

// Returns the bounding box of this element
Panel.prototype.box = function() {

	// If this element is in the document markup
	if($(svg).find(this.svg).length) {
		return this.svg[0].getBBox();
	}

	// Must be added to the markup for getBBox() to work
	$(svg).append(this.svg);

	var box =  this.svg[0].getBBox();
	
	this.svg.remove();

	return box;
};

// Returns a point representing the center of this element
Panel.prototype.center = function() {
	var box = this.svg[0].getBBox(),
		pt = svg.createSVGPoint();
	pt.x = box.x + (box.width / 2);
	pt.y = box.y + (box.height / 2);

	return pt;
};

// Wraps this panel in a group tag; useful for doing multiple transformations
Panel.prototype.wrap = function() {
	var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
	this.svg.wrap(g);
	this.svg = this.svg.parent();
};

// Sets a new translation for this panel
Panel.prototype.translate = function(x, y) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current translation, if any
	transform = transform.replace(/translate\(.*\)/g, '');
	transform += ' translate('+ x +', '+ y +')';

	this.svg.attr('transform', transform);
};

Panel.prototype.scale = function(x, y) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current scale, if any
	transform = transform.replace(/scale\(.*\)/g, '');
	transform += ' scale('+x+', '+(x || y)+')';

	this.svg.attr('transform', transform);
};

Panel.prototype.rotate = function(r) {

	var transform = this.svg.attr('transform') || '';

	// Remove the current rotation, if any
	transform = transform.replace(/rotate\(.*\)/g, '');
	transform += ' rotate('+r+')';

	this.svg.attr('transform', transform);
}