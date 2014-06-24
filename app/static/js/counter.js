function Counter ( initial, rate_per_millisecond ) 
{
	this.initial = initial;
	this.rate_per_millisecond = rate_per_millisecond;
	
	this.current = initial;
	this.previous = initial;
	this.start = new Date().getTime();
}

Counter.prototype = {
	update : function ( ) {
		var end = new Date().getTime();

		this.previous = this.current; // Rotate values
		
		this.current = this.initial + ((end - this.start) * this.rate_per_millisecond);
	},
	difference : function ( ) {
		return this.current - this.previous;
	},
	changed : function ( ) {
		return Math.floor(this.current) != Math.floor(this.previous);
	}
};

Counter.milliseconds_per_unit = function ( unit ) {
	// Assumes the max unit is an hour
	var millisecond = 1,
		second = 1000 * millisecond,
		minute = 60 * second,
		hour = 60 * minute
	;
		
	if ( unit.toLowerCase().indexOf('hour') !== -1) {
		return hour;
	} else if ( unit.toLowerCase().indexOf('minute') !== -1) {
		return minute;
	} else if ( unit.toLowerCase().indexOf('millisecond') !== -1) {
		return millisecond;
	} else { //Default unit.toLowerCase().indexOf('second') !== -1
		return second;
	}
};

Counter.rate_per_millisecond = function ( increment, interval, milliseconds ) {
	return (increment / interval) / milliseconds;
};