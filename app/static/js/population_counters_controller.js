function PopCountersViewController(api, animator, usPopContainerID, usComponentsID, worldPopContainerID, useOdometers)
{
	
	this.api = api;
	this.animator = animator;
	this.usPopContainerID    = usPopContainerID;
	this.usComponentsID      = usComponentsID;
	this.worldPopContainerID = worldPopContainerID;
	this.stripPopulation     = false;
	this.useOdometers        = (isDefined(useOdometers))
	? useOdometers
	: true; // use odometers by default
	
	this.progressBars               = [];
	this.progressBarTrackColorLight = '90-#cecdc9:50-#b9b8b4'; /* �angle�-�colour�[-�colour�[:�offset�]]*-�colour� */
	this.progressBarBarColorLight   = '90-#1782d0:49-#167ece:50-#208fd7:51-#269ddd';
	this.progressBarBarColorDark    = '90-#07497B:49-#06426F:50-#095381:51-#3784AB';
	
	this.headerDateLabel = $('#' + this.usPopContainerID).parent().parent().children('div:eq(0)').children('p:eq(0)');
	
	this.displayDateFormat = 'MM d, yy';
	this.usPopulationCounter = new Population(this.usPopContainerID);
	this.worldPopulationCounter = new Population(this.worldPopContainerID);
	
	// set date label
	this.timeStampLabel;
	this.timeStampCounter = new Counter(0, Counter.rate_per_millisecond(1, 1, Counter.milliseconds_per_unit('second')));
	this.now = function() {
		return new Date();
	}
	this.now_utc = function() {
		var now = this.now();
		return new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
	}

}
	PopCountersViewController.prototype = {
		createViews: function(singleProgressBarWidth, componentProgressBarWidth, componentProgressBarHeight, digitWrapperHeight, digitImageWidth, digitImageHeight, digitImagePaths)
		{
			/*
			 * singleProgressBarWidth - no longer used, as pop counter progress replaced with odometer
			 * componentProgressBarWidth - the width of each progress for the rates area - todo: most likely can be deprecated as progress bars are now HTML not SVG
			 * componentProgressBarHeight - the height of each progress for the rates area - todo: most likely can be deprecated as progress bars are now HTML not SVG
			 * digitImageWidth - the width of the image when it is placed in a rolling digit for the odometer, should be the same as the masking element
			 * digitImageHeight - the entire height of the digit image from 0 to 10 - used for positioning digit within mask
			 * digitImagePaths - object with two valid keys
			 *     main - which is used by default for all digits unless reverse_text image path exists
			 *     reverse_text - which is used for the ones position if set
			 */
			var creatingChart = $.Deferred();			 
			var controller   = this;
			var singleWidth = (!singleProgressBarWidth)
			? 270
			: singleProgressBarWidth;
			
			var componentWidth = (!componentProgressBarWidth)
			? 115
			: componentProgressBarWidth;
			
			var progressBarHeight = (!progressBarHeight)
			? 15
			: progressBarHeight;
	
			// full date label in top left of component
			this.setDateLabel(this.headerDateLabel);
		
			// begin data calls
			// US
			// header above odometer
			var label = (controller.stripPopulation)
			? config.components.us.label.replace('Population', '')
			: config.components.us.label;
			controller.usPopulationCounter.setContainerLabel(label);

			var gettingUSJSON = this.getJSON('us');
			var gettingWorldJSON = this.getJSON('world');
			$.when(gettingUSJSON, gettingWorldJSON).then( function ( usData, worldData ) {
				// US
				controller.createUSView(
										usData.us,
										digitWrapperHeight,
										digitImageWidth, 
										digitImageHeight,
										digitImagePaths, 
										componentProgressBarWidth, 
										componentProgressBarHeight
				);
				
				// World
				var label = (controller.stripPopulation)
				? config.components.world.label.replace('Population', '')
				: config.components.world.label;
				controller.worldPopulationCounter.setContainerLabel(label);
				
				controller.createWorldView(
										worldData.world,
										config.components.world_rates.tables,
										// data.world.monthly_estimates, removed from api data call replacing with formated config data
										digitWrapperHeight, 
										digitImageWidth, 
										digitImageHeight, 
										digitImagePaths
				);

				creatingChart.resolve();
			});
			
			return creatingChart;
		},
		
		setDateLabel: function(label)
		{
			
			var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
			var nowUTC = this.now_utc();
			
			var month = months[nowUTC.getMonth()]; // months[this.now_utc().getMonth()];
			var date = nowUTC.getDate(); // this.now_utc().getDate();
			var year = nowUTC.getFullYear(); // this.now_utc().getFullYear();
			var hour = nowUTC.getHours(); //this.now_utc().getHours();
			var minutes = nowUTC.getMinutes(); // this.now_utc().getMinutes();
			var timezone_offset_minutes = nowUTC.getTimezoneOffset(); // this.now_utc().getTimezoneOffset();
			var timezone_offset_hours = timezone_offset_minutes/-60;
			var timezone_abbr = '';
			// @todo: Maybe define more of these or use this: https://bitbucket.org/pellepim/jstimezonedetect/overview
			if ( timezone_offset_hours == -5 ) {
				timezone_abbr = 'Eastern';
			}
			
			var r_timezone_offset_hours = -(timezone_offset_hours);
			
			label.text(month + ' ' + zeroFill(date, 2) + ', ' + year + ' ' + zeroFill(hour, 2) + ':' + zeroFill(minutes, 2) + ' UTC ' + '(' + timezone_abbr +'+'+ r_timezone_offset_hours + ')');
		},
		
		createUSView: function(data, digitWrapperHeight, digitImageWidth, digitImageHeight, digitImagePaths, componentProgressBarWidth, componentProgressBarHeight)
		{
			if (this.useOdometers) {
				// we are using odometers not text
				// build the odometer
				this.usPopulationCounter.buildOdometer(
					this.animator,
					new Counter(data.population, Counter.rate_per_millisecond(data.population_rate, 1, Counter.milliseconds_per_unit(data.rate_interval))),
					digitImagePaths.main, // image of numbers w/ dark text
					digitWrapperHeight, // height of the "mask" for the image
					digitImageWidth, // width of the "mask" for the image
					digitImageHeight, // overall height of the image(s) - should be 11x mask height
					digitImagePaths.reverse_text // image of numbers w/ light text
				);
				
			} else {
				$('#' + this.usPopContainerID + ' p:eq(0)').append(addCommas(data.population));

			}
			
			// create the tables holding the rates
			var tableContent = {
				headerLabels: [
					config.components.us_rates.table_header_labels[0],
					config.components.us_rates.table_header_labels[1]
				],
				rows: [
					{
						counter: new Counter(0, Counter.rate_per_millisecond(1, data.components.birth_rate.interval, Counter.milliseconds_per_unit(data.components.birth_rate.unit))),
						label: config.components.us.birth_rate_label.replace('%@', data.components.birth_rate.interval)
					},
					{
						counter: new Counter(0, Counter.rate_per_millisecond(1, data.components.death_rate.interval, Counter.milliseconds_per_unit(data.components.death_rate.unit))),
						label: config.components.us.death_rate_label.replace('%@', data.components.death_rate.interval)
					},
					{
						counter: new Counter(0, Counter.rate_per_millisecond(1, data.components.immigrant_rate.interval, Counter.milliseconds_per_unit(data.components.immigrant_rate.unit))),
						label: config.components.us.immigrant_rate_label.replace('%@', data.components.immigrant_rate.interval)
					},
					{
						counter: new Counter(0, Counter.rate_per_millisecond(data.population_rate, 1, Counter.milliseconds_per_unit(data.rate_interval))),
						label: config.components.us.net_gain_label.replace('%@', Math.round(1 / data.population_rate))
					}
				]
			}
			this.createRateTable($('#' + this.usComponentsID).find('table'), config.components.us_rates.table_summary, tableContent, componentProgressBarWidth);
		},
		
		createRateTable: function(table, tableSummary, tableJSON, componentProgressBarWidth, componentProgressBarHeight)
		{
			var controller = this;
			/*
			 * table is a jQuery object for the table tag in the template
			 * tableSummary is for 508 compliance
			 * tableJSON is a javascript object with a headerLabel and rows key
			 *     the headerLabel key contains an array of labels to be used in <th> elements
			 *     the rows key is an array of objects with a rate and label key
			 *         the rate key is an integer and tells us how fast to fill the progress bar
			 *         the label key is a modified string (replacing the %@ string combination) with the integer
			 */
			var tableHead = table.find('thead');
			var tableBody = table.find('tbody');
			var tableRos  = tableJSON.rows;
			
			// for 508 compliance the table needs a summary and header row
			table.attr('summary', tableSummary);
			var headerRow = '<tr><th scope="row">'+ tableJSON.headerLabels[0] +'</th><th>'+ tableJSON.headerLabels[1] +'</th></tr>';
			tableHead.append(headerRow);
	
			// display UTC time in table
			var timeStampRow = '<tr><td></td><td id="component-timestamp">' + this.getUTCStringForNow() + '</td></tr>';	
			tableBody.append(timeStampRow);

			// build table rows with progress bars
			if ( tableBody && tableJSON.rows ) {
				
				for (var i = 0; i < tableJSON.rows.length; i++) {
					var row = tableJSON.rows[i];
					var component = new PopulationComponent('#' + this.usComponentsID, row.rate);
					var progressBarUniqueID = 'pop-counter-progress-bar-' + this.progressBars.length;
					component.initWithLabelTextBarID(row.label, progressBarUniqueID);
					component.buildProgressBar(
						this.animator,
						row.counter,
						progressBarUniqueID,
						'html-progress-bar-track',
						'html-progress-bar-bar',
						(i == 1) // second rate is death; therefore, reversed
					);
					this.progressBars.push(component.progressBar);
				}
			}
			
			this.animator.add(function ( ) { controller.updateTimeStamp(); });
		},
		
		getUTCStringForNow: function()
		{
			var nowUTC = this.now_utc();
			var hour = zeroFill(nowUTC.getHours(), 2);
			var minute = zeroFill(nowUTC.getMinutes(), 2);
			var second = zeroFill(nowUTC.getSeconds(), 2);
	
			return hour + ':' + minute + ':' + second + ' UTC'
		},
		
		createWorldView: function(data, worldTables, digitWrapperHeight, digitImageWidth, digitImageHeight, digitImagePaths)
		{
			var controller = this;
			var $historicalWrapper = $('#world-pop-historical');
			var $table1 = $historicalWrapper.find('table:eq(0)');
			var $table2 = $historicalWrapper.find('table:eq(1)');

			if (this.useOdometers) {
				// we are using odometers not text
				// build the odometer
				this.worldPopulationCounter.buildOdometer(
					this.animator,
					new Counter(data.population, Counter.rate_per_millisecond(data.population_rate, 1, Counter.milliseconds_per_unit(data.rate_interval))),
					digitImagePaths.main, // image of numbers w/ dark text
					digitWrapperHeight, // height of the "mask" for the image
					digitImageWidth, // width of the "mask" for the image
					digitImageHeight, // overall height of the image(s) - should be 11x mask height
					digitImagePaths.reverse_text // image of numbers w/ light text
				);
				
			} else {
				$('#' + this.worldPopContainerID + ' p:eq(0)').append(addCommas(data.population));

			}
			
			// buld tables
			var table1HTML = this.createWorldTable(worldTables[0]);
			$table1HTML = $(table1HTML).attr('summary', config.components.world_rates.table1_summary);
			$table1.replaceWith($table1HTML);

//			var table2HTML = this.createWorldTable(worldTables[1]);
//			$table2HTML = $(table1HTML).attr('summary', config.components.world_rates.table2_summary);
//			$table2.replaceWith($table2HTML);
			
			// historical data removed from API data returned
			// using config instead
			// var rowCount = 1;
			// var mostPopulousTableHTML = '<table>';
			// var historicalRows = [];
			// use jQuery to loop over historical data
			// jQuery.each(historicalData, function( unixTime, data ) {
			// 	var date = $.datepicker.formatDate(controller.displayDateFormat, getDateFromUnixEpoch(unixTime));
			// 	var population = data.population;
			// 	historicalRows[rowCount] = '<td>' + date  + '</td><td>' + addCommas(population) + '</td>';
			// 	rowCount++;
			// });
			// historicalRows.reverse();
			
			// used to split data into two tables
			// var mid = Math.ceil(historicalRows.length / 2) - 1; 
			// var leftTableRows = historicalRows.slice(0,mid);
			// var rightTableRows = historicalRows.slice(mid);
						
			// 508 compliance requires table summary
			// $table1.prop('summary', config.components.world_rates.table1_summary);
			// $table1.append('<tr>' + leftTableRows.join('</tr><tr>') + '</tr>');
			
			// 508 compliance requires table summary
			// $table2.prop('summary', config.components.world_rates.table2_summary);
			// $table2.append('<tr>' + rightTableRows.join('</tr><tr>') + '</tr>');

		},

		createWorldTable: function(tableData)
		{
			// returns html for rank table
			// with two header rows
			var html = '<table>';


			// create header rows
			html += '<thead>';
			html += '<tr><th colspan="6">' + tableData.title + '</th></tr>';
			html += '<tr><th>' + tableData.columns[0] + '</th><th>' + tableData.columns[1] + '</th><th>' + tableData.columns[2] + '. ' + tableData.columns[3] + '</th><th>' + + '</th></tr>';
			//html += '<tr><th>' + tableData.columns[0] + '</th><th>' + tableData.columns[1] + '</th><th>' + '</th></tr>';
			html += '</thead>';
			// create body rows
			html += '<tbody>';
	
			// split the keys and values into two arrays		
			var countries = [];
			var populations = [];
			for ( var key in tableData.rows ) {
				countries.push(key);
				populations.push(addCommas(tableData.rows[key]));
			}
	
			// columnate array prior to row builds
			var mid = Math.ceil(countries.length / 2); 
			var leftRowCountries = countries.slice(0,mid);
			var leftRowPopulations = populations.slice(0,mid);
			var rightRowCountries = countries.slice(mid);
			var rightRowPopulations = populations.slice(mid);
			
			// build rows
			// Murali - 9/16/13 - Modify to print only Top 5 countries 
			for ( var i = 0; i < leftRowCountries.length; i++ ) {
				var rank = i + 1;
			html += '<tr><td>' + rank + '. ' + leftRowCountries[i] + '</td><td align="right">' + leftRowPopulations[i] + '</td><td>&nbsp;&nbsp;' + (rank + 5) + '. ' + rightRowCountries[i] + '</td><td align="right">' + rightRowPopulations[i] + '</td></tr>';
			//html += '<tr><td>' + rank + '. ' + leftRowCountries[i] + '</td><td align="right">' + leftRowPopulations[i] + '</td><td> </tr>';
			}
			html += '</tbody>';

			html += '</table>';
			return html;
		},
		
		getJSON: function (apiCallName)
		{
			return this.api.get(apiCallName, {}, function(data, textStatus, JQXHR, promise) {
				promise.resolve(data);
			});
		},
		
		getCSV: function ()
		{
			var controller  = this;
			var creatingCSV = $.Deferred();
			var csv         = [];

			var gettingUSJSON = this.getJSON('us');
			gettingUSJSON.done( function( data ) {
				var table = {
					title: config.components.us.label,
					data: [
							['Population: ' + addCommas(data.us.population)],
							[config.components.us.birth_rate_label.replace('%@', data.us.components.birth_rate.interval).replace(/<[^>]+>/g, '')],
							[config.components.us.death_rate_label.replace('%@', data.us.components.death_rate.interval).replace(/<[^>]+>/g, '')],
							[config.components.us.immigrant_rate_label.replace('%@', data.us.components.immigrant_rate.interval).replace(/<[^>]+>/g, '')],
							[config.components.us.net_gain_label.replace('%@', config.components.us.interval).replace(/<[^>]+>/g, '')]
					]
				};
				csv.push(table);
				
				var gettingWorldJSON = controller.getJSON('world');
				gettingWorldJSON.done( function( data ) {
					var table = {
						title: config.components.world.label,
						data: [
								['Population:' + addCommas(data.world.population), '']
							   // [$.datepicker.formatDate(controller.displayDateFormat, getDateFromUnixEpoch(Math.round((new Date()).getTime() / 1000))), ],
						]
					};
					
					table.data.push([config.components.world_rates.tables[0].title, '']);
					table.data.push([config.components.world_rates.tables[0].columns[0], config.components.world_rates.tables[0].columns[1]]);
					for ( var i = 0; i < config.components.world_rates.tables[0].rows.length; i++ ) {
						var rank = i + 1;
						table.data.push([rank, config.components.world_rates.tables[0].rows[i]]);
					}
					table.data.push([config.components.world_rates.tables[1].title, '']);
					table.data.push([config.components.world_rates.tables[1].columns[0], config.components.world_rates.tables[0].columns[1]]);
					for ( var i = 0; i < config.components.world_rates.tables[1].rows.length; i++ ) {
						var rank = i + 1;
						table.data.push([rank, config.components.world_rates.tables[1].rows[i]]);
					}
					// historical data was remove from API call
					// will use config data to create the world sub tables
					// historicalRows = [];
					// jQuery.each(data.world.monthly_estimates, function( unixTime, data ) {
					// 	var date = $.datepicker.formatDate(controller.displayDateFormat, getDateFromUnixEpoch(unixTime));
					// 	var population = data.population;
					// 	historicalRows.push([date, addCommas(population)]);
					// });
					// historicalRows.reverse();
					// for (var i = 0; i < historicalRows.length; i++) {
					// 	table.data.push(historicalRows[i]);
					// }
					csv.push(table);
					creatingCSV.resolve(csv);
				});
			});
			return creatingCSV;
		},
		
		/* animator delegate */
		updateTimeStamp: function ( )
		{
			if ( ! this.useOdometers) return;
			
			this.timeStampCounter.update();
			// Update label on rollover
			if ( this.timeStampCounter.changed() ) {
				this.setDateLabel(this.headerDateLabel);
				if ( this.timeStampLabel ) {
					this.timeStampLabel.text(this.getUTCStringForNow());
					
				} else {
					
					if ( $('#' + popCountersViewController.usComponentsID + ' #component-timestamp').length > 0 ) {
						this.timeStampLabel = $('#' + popCountersViewController.usComponentsID + ' #component-timestamp');
						this.timeStampLabel.text(this.getUTCStringForNow());
					}
				}
			}
		}
	}
