function PopGrowth(api, populationGrowthWrapperID, populationGrowthChartID, populationGrowthOverlayID, minYear, maxYear)
{
	this.api = api;
	this.json;
	this.minYear = minYear;
	this.maxYear = maxYear;
	this.yearsArray = function()
	{
		var years = [];
		for (var i = this.minYear; i <= this.maxYear; i++) {
			years.push(i);
		}
		return years;
	}
	this.populationGrowthWrapperID = populationGrowthWrapperID;
	this.populationGrowthChartID   = populationGrowthChartID;
	this.populationGrowthOverlayID = populationGrowthOverlayID;
	this.lineChartWithOverlay      = null;
	this.titleLabel;
	
	this.overlayProgressBarWidth     = 100;
	this.overlayProgressBarHeight    = 15;	
	this.overlayProgresBarTrackColor = '90-#cecdc9:50-#b9b8b4';
	this.overlayProgressBarColors    = [
		'90-#f4715e:49-#f36755:50-#f57967:51-#f68876',
		'90-#b44015:49-#ac3a13:50-#b94b1c:51-#c35823',
		'90-#7a2e07:49-#6f2a06:50-#813909:51-#90430b',
		'90-#3b1701:49-#361501:50-#471e02:51-#542503'
	];
}
	PopGrowth.prototype = {
	
		createChart: function()
		{
			var $controller       = this;
			var creatingChart     = $.Deferred();
			var gettingJSON       = this.getJSON();
			
			gettingJSON.done(function( data ) {
				var max_percent = Math.ceil(data.max_percent);
				
				data.west.values.reverse();
				data.midwest.values.reverse();
				data.northeast.values.reverse();
				data.south.values.reverse();
				
				var westValues      = [];
				var midwestValues   = [];
				var northeastValues = [];
				var southValues     = [];
				var overlayRows     = [];
				
				var highestValueInDataSet = 0;
				for (var i = 0; i <= $controller.maxYear - $controller.minYear; i++) {
					// to create the stacked line chart we want add previous values
					// to currently being processed values with a pattern of
					// valN = currentDataValue + val(N - 1)
					// these values are then divided by millions for the purposes of the line chart
					// 400,000,000 becomes 400
					var val1 = parseInt(data.south.values[i].population);
					var val2 = parseInt(data.west.values[i].population) + val1;
					var val3 = parseInt(data.midwest.values[i].population) + val2;
					var val4 = parseInt(data.northeast.values[i].population) + val3;
					
					var divisor = 1000000;
					var southVal = val1/divisor;
					var westVal = val2/divisor;
					var midwestVal = val3/divisor;
					var northeastVal = val4/divisor;
					
					// the southern data set will always be the largest
					// as it is the sum of all the other values including its own
					if (northeastVal > highestValueInDataSet) {
						highestValueInDataSet = northeastVal;
					}
					
					westValues.push(westVal);
					midwestValues.push(midwestVal);
					northeastValues.push(northeastVal);
					southValues.push(southVal);
					
					var westRow = [data.west.label, addCommas(parseInt(data.west.values[i].population)), intPercentString(data.west.values[i].percentage, 2)];
					var midwestRow = [data.midwest.label, addCommas(parseInt(data.midwest.values[i].population)), intPercentString(data.midwest.values[i].percentage, 2)];
					var northeastRow = [data.northeast.label, addCommas(parseInt(data.northeast.values[i].population)), intPercentString(data.northeast.values[i].percentage, 2)];
					var southRow = [data.south.label, addCommas(parseInt(data.south.values[i].population)), intPercentString(data.south.values[i].percentage, 2)];
					
					// display in a specific order
					overlayRows[i] = [northeastRow, midwestRow, westRow, southRow];
				}
	
				// to make sure we always have enough room at the top of the chart
				// we will want to create a faux data set representing the next highest data set of interest
				var increment = 100; // determines rounding for faux data set
				var fauxDataSetValue = (Math.ceil(highestValueInDataSet/increment) * increment);
				var fauxDataSet = [];
				var fauxDataSetZero = [];
				for (var i = 0; i <= $controller.maxYear - $controller.minYear; i++) {
					fauxDataSet.push(fauxDataSetValue);
					fauxDataSetZero.push(0);
				}
				
				$controller.lineChartWithOverlay = new LineChartWithOverlay(
					$controller.populationGrowthWrapperID, 
					$controller.populationGrowthChartID, 
					$controller.populationGrowthOverlayID, 
					$controller.yearsArray(), 
					[fauxDataSetZero, southValues, westValues, midwestValues, northeastValues, fauxDataSet].reverse(),
					overlayRows,
					max_percent
				);
				$controller.lineChartWithOverlay.overlayProgressBarWidth     = $controller.overlayProgressBarWidth;
				$controller.lineChartWithOverlay.overlayProgressBarHeight    = $controller.overlayProgressBarHeight;
				$controller.lineChartWithOverlay.overlayProgresBarTrackColor = '#FAF9F7'; // override default
				$controller.lineChartWithOverlay.overlayProgressBarColors    = $controller.overlayProgressBarColors;
				$controller.lineChartWithOverlay.init();
				$controller.lineChartWithOverlay.buildChartRaph({ 
					axis: [0,0,1,1], 
					shade: true, 
					colors: ['none', '#331100', '#90430b', '#c35823', '#f68876', 'none'].reverse(), 
					axisxstep: ($controller.yearsArray().length - 1), 
					axisystep: fauxDataSetValue / increment
				});
				
				$controller.lineChartWithOverlay.yAxisLabel.attr('text', config.components.growth.y_axis_label);
				
				$controller.titleLabel = $controller.lineChartWithOverlay.chartRaph.text($controller.lineChartWithOverlay.chartJQueryEquivalent.width()/2, 15, 'United States Population Growth by Region');
				$controller.titleLabel.attr({ 'font-size': '18px' });
				$controller.titleLabel.hide();
				
				creatingChart.resolve();
			});
			
			return creatingChart;
		},

		createDataTables: function()
		{
			// creates a page of data tables
			// with headers between each year
			// 508 compliance measure
			var controller     = this;
			var creatingTables = $.Deferred();
			var gettingCSV     = this.getCSV();
			gettingCSV.done( function( csv ) {
				html = '';
				$(csv).each(function() {
					var year = this;
					var rows = year.data;
					html += '<h2>' + year.title + '</h2>';
					if ( config.components.growth.table_summary ) {
						html += '<table summary="' + config.components.growth.table_summary + '">';
	
					} else {
						html += '<table>';
						
					}
					altRow = true;
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						if ( i == 0 ) {
							html += '<thead><tr><th scope="row" class="cell0">' + row[0] + '</th><th class="cell1">' + row[1] + '</th><th class="cell2">' + row[2] + '</th></tr></thead>';
							
						} else {
							
							if ( i == 1 ) {
								html += '<tbody>';
							}
							
							if ( altRow ) {
								html += '<tr class="alt"><td class="cell0">' + row[0] + '</td><td class="cell1">' + row[1] + '</td><td class="cell2">' + row[2] + '</td></tr>';
								
							} else {
								html += '<tr><td class="cell0">' + row[0] + '</td><td class="cell1">' + row[1] + '</td><td class="cell2">' + row[2] + '</td></tr>';
								
							}
							
							if ( i == rows.length - 1 ) {
								html += '</tbody>';
							}
						}
						altRow = !altRow;
					}
					html += '</table>';
				});
				$('#' + controller.populationGrowthWrapperID).append(html);
				creatingTables.resolve();
			});
			return creatingTables;
		},
		
		getJSON: function ( )
		{
// it was discovered that the api call for the growth chart
// takes up to 8 seconds from initial call to receipt of data
// to measure improvements in this area uncomment the following
// four lines which begin when this method is called
// and logged to the console when data is received from the api
// in milliseconds
//var start = new Date().getTime();
			var controller = this;
			return this.api.get('region', { daterange: controller.getDaterange() }, function(data, textStatus, jqXHR, promise) {
//var end = new Date().getTime();
//var elapsed = end - start;
//console.log('total time to get data from API for growth chart: ' + elapsed);
				promise.resolve(data);	
			});
		},
		
		getDaterange: function ( ) 
		{
			return this.minYear + '0701' + '-' + this.maxYear + '0701';
		},

		getCSV: function ( )
		{
			var controller  = this;
			var creatingCSV = $.Deferred();
			var gettingJSON = this.getJSON();
			var years = this.yearsArray().reverse();
			gettingJSON.done( function( data ) {
				var csv = [];
				for (var i = 0; i < years.length; i++) {
					var headerrow = [
						"Region",
						"Population",
						"Percentage"
					];
					var northeast = [
						"Northeast",
						addCommas(data.northeast.values[i].population),
						intPercentString(data.northeast.values[i].percentage, 2) + "%"
					];
					var midwest = [
						"Midwest",
						addCommas(data.midwest.values[i].population),
						intPercentString(data.midwest.values[i].percentage, 2) + "%"
	
					];
					var west = [
						"West",
						addCommas(data.west.values[i].population),
						intPercentString(data.west.values[i].percentage, 2) + "%"
	
					];
					var south = [
						"South",
						addCommas(data.south.values[i].population),
						intPercentString(data.south.values[i].percentage, 2) + "%"
	
					];
					var yearObject = {
						"title": years[i].toString(),
						"data": [headerrow, northeast, midwest, west, south]
					};
					csv.push(yearObject);
				}
				creatingCSV.resolve( csv );
			});
			return creatingCSV;
		},
		
		/**
		 * Get SVG from chart
		 * 
		 * @return string Current SVG of chart
		 */
		getSVG: function ( )
		{
			var controller = this;	
			return controller.lineChartWithOverlay.chartRaph.toSVG();
		},
		
		getImage: function ( )
		{
			var $controller = this;
			var gettingImage = $.Deferred();
			
			/*
			 * Process:
			 * 1. Get JSON 
			 * 2. Create image name from last updated date
			 * 3. Test to see if the image exists
			 *     3a. If the image exists, return image url
			 * 4. On done, create a new, larger div
			 * 5. Create new instance of the class
			 * 6. Call createChart
			 * 7. On done, get SVG
			 *     7a. Delete created elements (clean up)
			 * 8. Call svgtoimage
			 * 9. On done, return image url
			 */
			
			// Get JSON
			var gettingJSON = $controller.getJSON();
			
			gettingJSON.done(function ( data ) {
			
				// Create image name
				var name = 'growth' + '_' + data.last_updated;
				var url = image_url(name);
				
				// Test to see if image exists
				var found_image = find_image(name);
				
				found_image.done(function ( ) {
					// The image exists!
					gettingImage.resolve(url);
				}).fail(function ( ) {
					// The image doesn't exist
						
					/*
					$('<div id="population-growth-wrapper-temp" style="display: none; position: relative;">\
							<div id="population-growth-overlay-temp" style="display: none"></div>\
							<div id="population-growth-chart-temp" style="width: 6.5in; height: 4in;"></div>\
						</div>').appendTo('body');
					
					// Create a new instance of the class
					var	popGrowthViewController = new PopGrowth($controller.api, 'population-growth-wrapper-temp', 'population-growth-chart-temp', 'population-growth-overlay-temp', $controller.minYear, $controller.maxYear);
					// Call prepare data
					var creatingChart = popGrowthViewController.createChart();
					
					creatingChart.done(function ( ) {
						
						// Make ready for image
						//popGrowthViewController.titleLabel.show();
				 	*/	
						// Get SVG
						var svg = popGrowthViewController.getSVG();
					/*	
						// Clean up
						$('#population-growth-wrapper-temp').remove();
						popGrowthViewController = null;
					*/
						// Call svgtoimage
						var creating_image = create_image(svg, name);
						
						creating_image.done(function ( data ) {
							
							// Return image url
							gettingImage.resolve(url);
						});
					/*	
					});
					*/
				});
			});
			
			return gettingImage;
		}
	
	}