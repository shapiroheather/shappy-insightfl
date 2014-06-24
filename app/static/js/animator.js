function Animator(milliseconds)
{
	this.delegates = [];
	this.milliseconds = milliseconds;
	this.id = 0; // Javascript setTimeout id
	this.updateCount = 0; // how many times update has fired
	
	// Start the animator
	this.start();
}
Animator.prototype = {
	update : function ( ) {
		var animator = this;
		
		animator.updateCount++;
		
		// Call all delegates
		for (var i = 0; i < animator.delegates.length; i++) {
			if (typeof animator.delegates[i] == 'function') {
				animator.delegates[i]();
			}
		}
		
		// Set next timeout
		animator.id = setTimeout(function ( ) {
				animator.update();
		}, animator.milliseconds);
	},
	start : function ( ) {
		var animator = this;
		animator.update();
	},
	stop : function ( ) {
		var animator = this;
		clearTimeout(animator.id);
	},
	add : function ( callback ) {
		var animator = this;
		animator.delegates.push(callback);
	}
}