function PopOnDateViewController(api, usPopContainerID, dateInputID, clickEventSelector, labelSelector, defaultDate, year_range_min, year_range_max )
{
	var $controller = this;
	this.api = api;
	this.usPopContainerID = usPopContainerID;
	this.jQueryEquivalent = $('#' + this.usPopContainerID);
	
	this.shareLink;// = this.jQueryEquivalent.find('nav.share a:eq(1)');
	this.shareLinkOriginalHref;// = this.shareLink.prop('href');
	
	this.printLink;
	this.printLinkOriginalHref;
	
	// insert HTML to modify
	var labelString = function() {
		return config.components.pop_on_date.label.replace('%@', '\<span class="select-date">selected date</span>').replace('%@', '<span class="pop-count">unknown</span>');
	}
	this.jQueryEquivalent.find('p:eq(0)').append(labelString).append('<br /><a id="select-date-image-under" class="select-date" href="#dateselect">select date</a>');
	/*if (this.jQueryEquivalent.find('p:eq(0)').parents('iframe').length == 0) this.jQueryEquivalent.find('p:eq(0)').append('<a id="select-date-image-under" class="select-date hideable" href="#dateselect">select date</a>');*/
	
	this.dateDisplayLabel = this.jQueryEquivalent.find('p span:eq(0)');
	
	this.dateInputID = dateInputID;
	this.dateInputJQueryEquivalent = $('#' + this.dateInputID);
	this.clickEventSelector = clickEventSelector;
	
	this.labelSelector = labelSelector;
	this.displayLabel = $(this.labelSelector);
	
	this.now = Date.now();
	this.minDate = new Date(parseInt(config.components.pop_on_date.min_year), parseInt(config.components.pop_on_date.min_month) - 1, parseInt(config.components.pop_on_date.min_day));
	this.defaultDate = defaultDate;
	
	this.population = 0;
	this.year_range_min = year_range_min ;
	this.year_range_max = year_range_max ;
	this.year_range = year_range_min+':'+year_range_max ;


	this.datePicker = this.dateInputJQueryEquivalent.datepicker({
		minDate: $controller.minDate,
		maxDate: -1,
		changeYear: true,
		changeMonth: true,
		yearRange:$controller.year_range,
		
		dateFormat: "MM d, yy",
		onClose: function() {
			$controller.prepareDataForDate();
		}
	});
	this.datePicker.datepicker('setDate', this.defaultDate);
	$controller.dateDisplayLabel.text($controller.dateInputJQueryEquivalent.val());	
		
	this.jQueryEquivalent.find(this.clickEventSelector).click(function(event) {
		event.preventDefault();
		$controller.dateInputJQueryEquivalent.triggerHandler('focus');		
		return false;
	});
}
	
	PopOnDateViewController.prototype = {
		
		prepareDataForDate: function()
		{
			var $controller = this;
			var preparingDataForDate = $.Deferred();

			// Date
			var $dateObject = this.datePicker.datepicker('getDate');
			// Make sure defaultDate is updated
			this.defaultDate = (!$dateObject) ? this.defaultDate : $dateObject;
			// Parse date
			var year = $dateObject.getFullYear();
			var month = $dateObject.getMonth() + 1;
			if (month < 10) {
				month = '0' + month;
			}
			var day = $dateObject.getDate();
			if (day < 10) {
				day = '0' + day;
			}
			var formattedDate = year + '' + month + '' + day;
			
			// Share Link (if applicable)
			if (this.shareLink && this.shareLink.length == 1) {
				this.shareLink.attr('href', this.shareLinkOriginalHref + '&date=' + $.datepicker.formatDate('yymmdd', this.defaultDate));
			}
			// Print link
			$('#print-this').attr('href', this.printLinkOriginalHref + '&date=' + $.datepicker.formatDate('yymmdd', this.defaultDate));
			
			var gettingJSON = this.getJSON(formattedDate);
			
			gettingJSON.done(function( data ) {
				var usMainData = data.us;
				if (usMainData && usMainData.population && typeof usMainData.population == 'number' && usMainData.population % 1 == 0) {
					$controller.population = addCommas(usMainData.population);
				} else {
					$controller.population = 'unknown';
				}
				$controller.displayLabel.text($controller.population);
				$controller.dateDisplayLabel.text($controller.dateInputJQueryEquivalent.val());
				
				preparingDataForDate.resolve();
			});
			
			return preparingDataForDate;
		},
	
		getJSON: function ( date )
		{
			return this.api.get('us', {date: date}, function(data, textStatus, JQXHR, promise) {
				promise.resolve(data);
			});
		}
	}
