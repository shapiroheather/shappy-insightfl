// for IE browsers <IE9, where Date.now() does not exist 
Date.now = Date.now || function() { return +new Date; };

// returns base URL for app
var _URL_ = window.location.protocol + '//' + window.location.hostname + window.location.pathname.replace(/\/[^\/]*$/, '/');

var isDefined = function(variable)
{
	return (typeof variable !== 'undefined');
}

var addCommas = function(nStr, decimals)
{
	if (!isNaN(nStr)) {
		decimals = (typeof decimals !== 'undefined') ? +decimals : 0;
		nStr += '';
		x = nStr.split('.');
		x1 = x[0];
		points = (decimals !== 0) ? points = '.'+Array(decimals+1).join('0') : '';
		x2 = x.length > 1 ? '.' + x[1] : points;
		var rgx = /(\d+)(\d{3})/;
		while (rgx.test(x1)) {
			x1 = x1.replace(rgx, '$1' + ',' + '$2');
		}
		return x1 + x2;
	} else {
		return nStr;
	}
}

var getDateFromUnixEpoch = function(UnixEpoch)
{
	return new Date(UnixEpoch*1000);
}

var floatToPercentString = function(float, decimalPlaces)
{
	var rawPercent = float * 100;
	var multiplier = 1;
	var zeros = '';
	for (var i = 0; i < decimalPlaces; i++) {
		zeros = zeros + "0";
	}
	multiplier = multiplier + zeros;
	
	var adjusted = Math.round(rawPercent * multiplier)/multiplier;
	return adjusted.toString();
}

var intPercentString = function(int, decimalPlaces)
{
	return floatToPercentString(int/100, decimalPlaces);
}

var percentForValueInRange = function(minValue, maxValue, target)
{
	// returns float between 1.0 and 0.0
	// min value should always be smaller than max value
	// target should be a value between the other two numbers
	if (minValue > maxValue) {
		return -1;
		
	} else if (!(target <= maxValue && target >= minValue)) {
		return -1;
	}
	
	var range = maxValue - minValue;
	var adjustedTarget = target - minValue;
	return adjustedTarget/range;
}

// @link http://stackoverflow.com/questions/1267283/how-can-i-create-a-zerofilled-value-using-javascript
var zeroFill = function ( number, width )
{
	width -= number.toString().length;
	if ( width > 0 ) {
		return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
	}
	return number + ""; // always return a string
}

var zeroAppend = function ( number, width )
{
	width -= number.toString().length;
	if ( width > 0 ) {
		return number + (/\./.test( number ) ? '' : '.') + new Array( width + (/\./.test( number ) ? 1 : 0) ).join( '0' );
	}
	return number + "";
}

/**
 * Shim for Object.create in <IE9
 * @link http://javascript.crockford.com/prototypal.html
 */
if (typeof Object.create !== 'function') {
	Object.create = function (o) {
		function F() {}
		F.prototype = o;
		return new F();
	};
}

var resize_parent_popover = function ( ) 
{
	try {
		if ( ! parent || typeof parent.resize_popover != 'function' ) return;
		
		setInterval(do_resize_parent_popover, 500);

	} catch ( err ) {}
}
	
var do_resize_parent_popover = function ( ) 
{
	if ( ! parent || typeof parent.resize_popover != 'function' ) return;
	
	// 16 is the body padding (8px all around)
	var width = $('#main-wrapper').outerWidth() + 16;
	var height = $('#main-wrapper').outerHeight() + 16;
	parent.resize_popover(width, height);
}

var populous_density_csv_table = function ( title, columns, data ) {
	var rows = [];
	
	// Add headers first
	rows.push(columns);

	// Add data rows
	for (var i = 0; i < data.length; i++) {
		rows.push([data[i].name, addCommas(data[i].population), addCommas(data[i].density)]);
	}
	
	// Return a csv-ified table
	return {
		title: title,
		data: rows
	};
	
}