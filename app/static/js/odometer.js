/*
Rolling digit is designed to take an image
and move it up or down dependent on the value set.
For effective animation, it is recommended
that the first and last "frame" of the image be the same;
ex. an image may have the following in vertical display
0 1 2 3 4 5 6 7 8 9 0 - this allows for seamless transition
from 9 back to 0 (representing 10)

Requires:
jQuery and image should be positioned relative
percentForValueInRange method to allow setting values

*/
function RollingDigit(element, endTop, minValue, maxValue)
{
	this.jQueryEquivalent = $(element); // element should contain image to move
	this.endTop           = endTop; // css top value at 100% mov't
	
	this.value; // current value, does not include transitional states
	this.inBetweenValue;
	this.minValue = minValue; // minimum allowable value
	this.maxValue = maxValue; // maximum allowable value
	
	// when the value beting set is greater than
	// the max value less 1 - property is set to true
	// when the value is set back to 0 - property is set to false
	this.isRollingOver = false;
	
	// property not used in class; however, can be set or accessed/set
	// to aid in rolling over contiguous instances
	this.isAnimating = false;
}
	
RollingDigit.prototype = {
	setValue : function(value) {
		if (value < this.minValue || value > this.maxValue) {
			return -1;
		}

		// we only want to update our value
		// when we reach a whole number		
		if (value % 1 == 0 || value == 0) {
			this.value = value;
			this.inBetweenValue = value;
						
		} else {
			this.inBetweenValue = value;
			
		}
		this.isRollingOver = (value > this.maxValue - 1);
		
		this.moveToPercent(percentForValueInRange(this.minValue, this.maxValue, value));
	},
	moveToPercent : function(percent) {
		var newTop;
		if (percent < 0.9999) {
			newTop = percent * this.endTop;
			
		} else {
			this.setValue(0);
			this.isRollingOver = false;
			newTop = 0;
			
		}
		this.jQueryEquivalent.find('img').css({ 
			top : newTop
		});
	}
}
	
function Odometer(animator, counter, containerID)
{
	this.animator = animator;
	this.counter = counter;
	this.containerID  = containerID;
	
	// # of seconds to increase ones value by 1
	//this.speed        = speed;
	//this.initialValue = (typeof initialValue == 'undefined' || initialValue > this.ceiling)
	//? 0
	//: initialValue;
	
	this.jQueryEquivalent = $('#' + containerID + ' p:eq(0)');
	this.digits   = [];
	this.startTop = 0;
	this.digitEndTop;
	
	
	// numbers approaching the sextillion range 10^21
	// may result in display of 10^5; therefore, disallow
	//this.ceiling   = 100000000000000000000;
	//this.totalGain = 0;
	
	// current "whole" number value
	//this.currentValue = function()
	//{
	//	return this.initialValue + this.totalGain;
	//}
	
	// individual numeral
	this.digitWrapperHeight;
	this.digitImageWidth;
	this.digitImageHeight;
	this.digitImagePath;
	this.reverseImagePath;
	this.blurImagePath;
	
	this.animatingFrame = 1;
}
Odometer.prototype = {
	render : function(digitImagePath, digitWrapperHeight, digitImageWidth, digitImageHeight, reverseImagePath) {
		var odometer = this;
		
		// container element "masks" numeral image
		this.digitWrapperHeight = digitWrapperHeight;
		
		// if the speed is less the 1/4 of a second, browser cannot
		// keep up with that pace; therefore, use a blurred image
		// for the digit in the ones position - if no blur image path
		// is set, the object will use the reverse image - if applicable
		// and the regular image if no reverse image is established
//		if (typeof blurImagePath !== 'undefined') {
//			this.blurImagePath = blurImagePath;
//		}
		// reverse image path will be used in the ones position
		// for when a darker background is added to this position
		if (typeof reverseImagePath !== 'undefined') {
			this.reverseImagePath = reverseImagePath;
		}
		this.digitImageWidth    = digitImageWidth;
		this.digitImageHeight   = digitImageHeight;
		this.digitImagePath     = digitImagePath;
		
		// the image will need to move up, but not completely out of the viewport
		// before resetting to a 0 top
		this.digitEndTop = (digitImageHeight - digitWrapperHeight) * -1;
		
		var numString = this.counter.initial.toString().split('').reverse();
		for (var i = 0; i < numString.length; i++)
		{
			this.addDigit(numString[i]);	
		}
		
		this.animator.add(function ( ) { odometer.update(); });
	},
	
	addDigit : function(value) {
		// prepare to insert HTML for digit
		// insert commas between digits
		if (this.digits.length > 0 && this.digits.length % 3 == 0) {
			this.jQueryEquivalent.prepend('<span>,</span>');
		}
		
		var digitHTML = '<span class="rolling-digit"><img src="' + this.digitImagePath + 
			'" width="' + this.digitImageWidth + 
			'" height="' + this.digitImageHeight + 
			'" /></span>';
		this.jQueryEquivalent.prepend(digitHTML);
		
		// build digit
		var digitMin = 0;
		var digitMax = 10;
		var newDigit = new RollingDigit(
			this.jQueryEquivalent.find('span.rolling-digit:eq(0)'), 
			this.digitEndTop,
			 digitMin, 
			 digitMax
		);

		newDigit.setValue(parseInt(value));
	
		this.digits.push(newDigit);
	},
	update : function() {
		
		this.counter.update();
		
		var newValue = Math.floor(this.counter.current).toString().split('').reverse();
		var newValueAdjust = this.counter.current % 1;
		var newDigitValue = 0;
		
		for ( var i = 0; i < this.digits.length; i++ ) {
			if ( i == 0 ) {
				newDigitValue = parseInt(newValue[i]) + newValueAdjust;
			} else {
				if ( this.digits[i - 1].inBetweenValue > 9 ) {
					newDigitValue = parseInt(newValue[i]) + newValueAdjust;
				} else {
					newDigitValue = parseInt(newValue[i]);
				}
			}
			this.digits[i].setValue(newDigitValue);
		}
	}
}