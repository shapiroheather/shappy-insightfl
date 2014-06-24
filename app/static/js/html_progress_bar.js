/*
This progress bar creates a progress bar using HTML; a SPAN inside a DIV
	to create the bar and track respectively
the bar can have a min and max value - which can be set using the setValue method
	requires the percent for value in range method to be defined
setPercent should NOT be called directly
*/
function HTMLProgressBar(animator, counter, containerID, reversed)
{
	this.animator = animator;
	this.counter = counter;
	this.containerID = containerID; // div inside cell
	this.jQueryEquivalent = $('#' + this.containerID);
	this.reversed = (!reversed)
	? false
	: reversed;

	this.value    = 0;
	this.minValue = 0;
	this.maxValue = 1;
		
	this.track;
	this.bar;
}
	HTMLProgressBar.prototype = {
		render : function ( trackClassName, barClassName ) {
			var htmlprogressbar = this;
			var trackHTML = '<div></div>';
			this.jQueryEquivalent.append(trackHTML);
			this.track = this.jQueryEquivalent.find('div');
			this.track.addClass(trackClassName);
			
			var barHTML = '<span></span>';
			this.track.append(barHTML);
			this.bar = this.jQueryEquivalent.find('span');
			this.bar.addClass(barClassName);
			if ( this.reversed ) {
				this.bar.addClass('barIsReversed');
			}
			
			if ( this.animator ) 
				this.animator.add(function ( ) { htmlprogressbar.update(); });
		},
		setPercent: function(percent)
		{
			if (percent > 1) {
				percent = 1;
				
			} else if (percent < 0) {
				percent = 0;
				
			}
			
			if (this.reversed) {
				percent = 1 - percent;
			}

			this.bar.css({ 
				width: (percent > 0.000001) ? this.track.width() * percent : 0 
				
			});
		},
		setValue: function(value)
		{
			this.value = value;
			var valueToPercent = percentForValueInRange(this.minValue, this.maxValue, this.value);
			this.setPercent(valueToPercent);			
		},
		update: function()
		{	
			this.counter.update();
			
			var newValue = this.counter.current % 1;
			this.setPercent(newValue);
		}
	}