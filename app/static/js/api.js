/**
 * API class
 * 
 * @param bool cache
 */
function API ( cache, methods ) 
{
	// Read in cache
	this.cache = cache ? cache : true;
	
	this.methods = $.extend(true, {}, methods);
}

	/**
	 * Get from API
	 * 
	 * @param string method
	 * @param object data
	 * @param function success
	 * @param function error
	 * @returns promise
	 * @access public
	 */
	API.prototype.get = function ( method, data, success, error )
	{
		var api = this;
		var promise = $.Deferred();
		
		// Default error function
		error = typeof error == 'function' ? error : api.error;

		// Confirm API method exists
		if ( ! api.methods[method] ) {
			error(null, 'error', 'Unknown API Method! ' + method, promise);
			return promise;
		}
		
		// Retrieve existing data if cached
		if ( api.cache && api.retrieve(method, data) !== false ) {
			success(api.retrieve(method, data), 'cached', null, promise);
			return promise;
		}
				
		// URL
		var url = api.methods[method].url;
		
		// Default data can be overridden by the application
		var data = api.data(method, data);
		
		// Default to json
		var dataType = typeof api.methods[method].dataType != 'undefined' ? api.methods[method].dataType : 'json';
		
		// Make sure IE doesn't cache it
		if ( window.XDomainRequest ) {
			$.extend(data, { cache: new Date().getTime() });
		}
		
		// Make AJAX request
		$.ajax({
			type: 'GET',
			url: url, 
			data: data,
			dataType: dataType,
			cache: this.cache,
			success: function ( returnedData, textStatus, jqXHR ) {
				api.store(method, data, returnedData);
				success(returnedData, textStatus, jqXHR, promise);
			},
			error: error
		});
		
		return promise;
	};
	
	/**
	 * Forces an object return even if data was not provided
	 * 
	 * Data passed in will override method data
	 * 
	 * @param string method
	 * @param mixed data
	 * @return object
	 * @access private
	 */
	API.prototype.data = function ( method, data )
	{
		var api = this;
		
		// Confirm API method exists
		if ( ! api.methods[method] ) {
			api.error(null, 'error', 'Unknown API Method!');
			return false;
		}
		
		return $.extend({}, api.methods[method].data, data);
	};
	
	/**
	 * Generates storage key based on data
	 * 
	 * @param object data
	 * @return string
	 * @access private
	 */
	API.prototype.storageKey = function ( data )
	{
		return '?' + $.param(data);
	};
	
	/**
	 * Store returned data
	 * 
	 * @param string method
	 * @param object data
	 * @param mixed returnedData
	 * @access private
	 */
	API.prototype.store = function ( method, data, returnedData ) 
	{
		var api = this;
		
		// Confirm API method exists
		if ( ! api.methods[method] ) {
			api.error(null, 'error', 'Unknown API Method!');
			return;
		}
		
		// Init stored data
		if ( ! api.methods[method].storedData ) {
			api.methods[method].storedData = {};
		}
		
		var key = api.storageKey(api.data(method, data));
		
		api.methods[method].storedData[key] = returnedData;
	};
	
	/**
	 * Retrieve stored data
	 * 
	 * @param string method
	 * @param object data
	 * @return mixed|bool
	 * @access public
	 */
	API.prototype.retrieve = function ( method, data )
	{
		var api = this;
		
		// Confirm API method exists
		if ( ! api.methods[method] ) {
			api.error(null, 'error', 'Unknown API Method!');
			return false;
		}
		
		var key = api.storageKey(api.data(method, data));
		
		if ( api.methods[method].storedData && api.methods[method].storedData[key] ) {
			return api.methods[method].storedData[key];
		} else {
			return false;
		}
	};
	
	/**
	 * Global API error handler. Accepts parameters in accordance with jQuery.ajaxError
	 * 
	 * @param jqXHR
	 * @param textStatus
	 * @param errorThrown
	 * @access private
	 */
	API.prototype.error = function ( jqXHR, textStatus, errorThrown, promise )
	{
//		if ( console && typeof console.log == 'function' ) 
//			console.log('API ' + textStatus + ': ' + errorThrown);
		
		if ( promise )
			promise.reject();
	};
