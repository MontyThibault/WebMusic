// http://stackoverflow.com/questions/4850821/svg-coordinates-with-transform-matrix
function createPoint(x, y) {
	var pt = svg.createSVGPoint();
	pt.x = x || 0;
	pt.y = y || 0;

	return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function localSpace(pt, object) {
	var globalToLocal = object.getTransformToElement(svg).inverse();
	return pt.matrixTransform(globalToLocal);
}

function globalSpace(pt, object) {
	var localToGlobal = object.getTransformToElement(svg);
	return pt.matrixTransform(localToGlobal);
}