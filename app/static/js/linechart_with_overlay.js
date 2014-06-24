function LineChartWithOverlay(wrapperID, chartID, overlayID, valuesX, valuesY, overlayRows, maxPercent)
{
	this.wrapperID = wrapperID;
	this.chartID = chartID;
	this.overlayID = overlayID;
	this.valuesX = valuesX;
	this.valuesY = valuesY;
	this.overlayRows = overlayRows;
	this.maxPercent = maxPercent;
	
	this.jQueryEquivalent = $('#' + this.containerID);
	this.chartJQueryEquivalent = $('#' + this.chartID);
	this.overlayJQueryEquivalent = $('#' + this.overlayID);
	this.overlay;
	this.chartRaph;
	this.lineChart;
	this.hoverObject;
	
	// the height and width of the chart can be set in CSS
	this.chartWidth = this.chartJQueryEquivalent.width() - 47;
	this.chartHeight = this.chartJQueryEquivalent.height() - 40;
	this.chartStartX = 30;
	this.chartStartY = 0;
	this.chartEndX = this.chartStartX + this.chartWidth;
	this.overlayWidth = this.chartWidth * 0.8;
	this.overlayJQueryEquivalent.css({ width : this.overlayWidth });
	
	this.overlayProgressBars                = [];
	this.overlayProgressBarWidth            = 100;
	this.overlayProgressBarHeight            = 15;	
	this.overlayProgresBarTrackColor        = '90-#cecdc9:50-#b9b8b4';
	this.overlayProgressBarColors           = [
		'90-#3b1701:49-#361501:50-#471e02:51-#542503',
		'90-#7a2e07:49-#6f2a06:50-#813909:51-#90430b',
		'90-#b44015:49-#ac3a13:50-#b94b1c:51-#c35823',
		'90-#f4715e:49-#f36755:50-#f57967:51-#f68876'
	];
	
	
	this.columnHoverLineString = "M" + 0 + "," + 10 +
		"L" + 0 + "," + this.chartHeight;
	this.columnHoverLine;

	this.popoverLabel;
	this.popoverOutline;
	this.popoverOutlineGlow;
	
	this.yAxisLabel;
}
	LineChartWithOverlay.prototype.init = function()
	{
		var $Chart = this;
		var mouseX;
		var mouseY;
		
		this.buildOverlay();

		this.overlayJQueryEquivalent.add(this.chartJQueryEquivalent).hover(
			function ( ) {
				$Chart.overlayJQueryEquivalent.css({ display: 'block' });
				$Chart.columnHoverLine.attr({ opacity: 0.75 });
				$Chart.displayPopover();
				$Chart.columnHoverIn();
			},
			function ( ) { 
				$Chart.overlayJQueryEquivalent.css({ display: 'none' });
				$Chart.columnHoverLine.attr({ opacity: 0 });
				$Chart.hidePopover();
			}
		);
	}

	LineChartWithOverlay.prototype.buildOverlay = function()
	{
		this.overlayJQueryEquivalent.css({ left: ((this.chartWidth - this.overlayWidth)/2 + 20) });
	}
	
	LineChartWithOverlay.prototype.buildChartRaph = function(chartOptions)
	{
		var $Chart = this;
		
		this.chartRaph = Raphael(this.chartID);
		this.lineChart = this.chartRaph.linechart(
			this.chartStartX,
			this.chartStartY,
			this.chartWidth,
			this.chartHeight,
			this.valuesX,
			this.valuesY,
			chartOptions
		).hoverColumn(
			function() { 
				$Chart.overlayJQueryEquivalent.css({ display: 'block' });
				$Chart.columnHoverLine.attr({ opacity: 0.75 });
				$Chart.displayPopover();
				$Chart.hoverObject = this;
				$Chart.columnHoverIn();
			},
			function() { }
		);
		
		this.yAxisLabel = this.chartRaph.text(20, this.chartHeight/2, 'no text')
			.attr({'text-anchor': 'middle', fill: '#4f4f4f', stroke: 'none'})
			.rotate(-90);
		
		for (var i = 0; i < this.lineChart.lines.length; i++) {
			var line = this.lineChart.lines[i];
			if ( i == 0 || i > this.lineChart.shades.length - 2) {
				// support IE < 9 faux data set line
				line.attr({ stroke: "#000000", "stroke-linecap": "", opacity : 0 });
				
			} else {
				line.attr({ 'stroke-width' : 3, "stroke-linecap": "" });
				
			}
		}
		
		for (var i = 0; i < this.lineChart.shades.length; i++) {
			var shade = this.lineChart.shades[i];
			if ( i == 0 || i > this.lineChart.shades.length - 2) {
				// support IE < 9 to hide faux data set shade area
				shade.attr({ opacity :0 });
				
			} else {
				shade.attr({ opacity : 0.8 });
				
			}
		}
		
		var zeroLabel = this.lineChart.axis[1].text[0];	
		var maxLabel = this.lineChart.axis[1].text[this.lineChart.axis[1].text.length - 1];
		var yAxisYPosRange = zeroLabel.attr('y') - maxLabel.attr('y');
		
		// horizontal line at top of chart
		var horizontalLine1 = this.chartRaph.path(
			"M" + 41 + ' ' + maxLabel.attr('y') +
			"L" + (this.chartWidth + 20) + ' ' + maxLabel.attr('y')).attr({ stroke: '#fff', 'stroke-width': 1 });
		
		var axisFontOpts = { 'font-weight': 'bold', stroke: '#4f4f4f' };
		zeroLabel.attr(axisFontOpts);
		maxLabel.attr(axisFontOpts);
		var xAxisLabels = this.lineChart.axis[0].text;
		for (var i = 0; i < xAxisLabels.length; i++) {
			if (i > 0 && i < xAxisLabels.length - 1) {
				var label = xAxisLabels[i];
				label.hide();

			}
		}
		var yAxisLabels = this.lineChart.axis[1].text;
		for (var i = 0; i < yAxisLabels.length; i++) {
			var label = yAxisLabels[i];
			label.attr({ stroke: '' });
			label.transform("t-5,0");
			if (i > 0 && i < (yAxisLabels.length - 1)) {
				// should not display label
				// but will want a horizontal line instead
				label.hide();
				var horizontalLineN = horizontalLine1.clone();
				horizontalLineN.transform("t" + 0 + ',' + (label.attr('y') - 10) );
				
			}
		}
		
		this.columnHoverLine = this.chartRaph.path(this.columnHoverLineString);
		this.columnHoverLine.attr({ stroke: '#979797', 'stroke-width': 2, 'stroke-dasharray': ['- '], opacity: 0.0 });
		
		this.buildPopover(12, 45, 15, 5, 7, { 'stroke-width': 2, fill: '90-#053b65-#0a507b:80' });
	}
	
	LineChartWithOverlay.prototype.columnHoverIn = function(object)
	{
		var $Chart = this;
		var axis = ( $Chart.hoverObject ) ? $Chart.hoverObject.axis : this.valuesX[0];
		var columnIndex = $.inArray(axis, this.valuesX);
		var table = this.overlayJQueryEquivalent.children('table');
		var rowsInTHead = table.children('thead').find('tr');
		var rowsInTable = table.children('tbody').find('tr');
		
		if ( rowsInTHead.length < 1 ) {
			var html = '<tr><th scope="row">'+ 
				config.components.growth.table_header_labels[0] +'</th><th>'+ 
				config.components.growth.table_header_labels[1] +'</th><th>'+ 
				config.components.growth.table_header_labels[2] +'</th><th>'+ 
				config.components.growth.table_header_labels[3] +'</th></tr>';
			table.find('thead').append(html);
		}
		
		// there are currently no rows in the table
		// therefore, we will need to build them
		if (rowsInTable.length < 1 && this.overlayRows.length > 0) {
			
			// 508 compliance, create table summary
			table.prop('summary', config.components.growth.table_summary);
			
			var progressBarID;
			// iterate over the expected number of rows
			$.each(this.overlayRows[columnIndex], function ( rowIndex, row ) {
				
				progressBarID = $Chart.chartID + '-progress-bar-' + rowIndex;
				var html = '<tr><td></td><td></td><td id="' + progressBarID + '"></td><td></td>';
				table.children('tbody').append(html);	
				
				
				var bar = new HTMLProgressBar(
					null,
					null,
					progressBarID
//					$Chart.overlayProgressBarWidth, 
//					$Chart.overlayProgressBarHeight, 
				);				
				bar.minValue = 0;
				bar.maxValue = $Chart.maxPercent;
				bar.render('html-progress-bar-track', 'html-progress-bar-bar');
				$Chart.overlayProgressBars.push(bar);
			});
			
			rowsInTable = table.children('tbody').find('tr');
		} 
		
		// now that we have rows in the table,
		// we need to update their values
		for (var i = 0; i < rowsInTable.length; i++) {	
			var $row = $(rowsInTable[i]);
			$row.find('td').eq(0).text($Chart.overlayRows[columnIndex][i][0]);
			$row.find('td').eq(1).text($Chart.overlayRows[columnIndex][i][1]);
			this.overlayProgressBars[i].setValue($Chart.overlayRows[columnIndex][i][2]);
			var rounded = Math.round( $Chart.overlayRows[columnIndex][i][2]*10 )/10; 
			$row.find('td').eq(3).text( rounded.toFixed(1)   + '%' );
		}
		
		var path = this.lineChart.axis[0].attr('path');
		if ( typeof path == 'object' ) {
			var transformX = path[(columnIndex + 1) * 2][1];
		} else {
			var transformX = path.split(',')[((columnIndex + 1) * 6) + 1];
		}
		
		// popover label and line
		this.columnHoverLine.transform("t" + transformX  + "," + 0);
		
		var lineEndPointY = this.lineChart.axis[1].text[0].attr('y'); // this.columnHoverLine.attr('path')[1][2];
		// position popover with year
		var popoverWidth = 45;
		this.popoverLabel.transform("t" + (transformX - popoverWidth/2) + "," + (lineEndPointY));
		this.popoverLabel.attr('text', axis);
		
		this.popoverOutline.transform("");
		this.popoverOutline.transform("t" + (transformX - popoverWidth/2) + "," + (lineEndPointY));
		
		this.displayPopover();
	}
	
	/* need to figure out how to create this as an actual Raphael object */
	LineChartWithOverlay.prototype.buildPopover = function (fontSize, width, topBottomPadding, cornerRadius, triangleHeight, attributes)
	{
		fontSize         = fontSize;
		width            = width; // the width will change depending on the width of the string
		topBottomPadding = topBottomPadding;
		cornerRadius     = cornerRadius;
		triangleHeight   = triangleHeight;
		attributes       = attributes;
		height           = (!triangleHeight) ? fontSize + topBottomPadding * 2 : fontSize + topBottomPadding * 2 - triangleHeight;
		
		// we start in the middle - at the tip of the triangle and work clockwise back around
		var point1X      = width/2;
		var point1Y      = (!attributes['stroke-width']) ? 0 : attributes['stroke-width'];
		
		var point2X      = (!triangleHeight) ? point1X : point1X + triangleHeight/2;
		var point2Y      = (!triangleHeight) ? point1Y : point1Y + triangleHeight;
		
		var point3X      = (!cornerRadius) ? width : width - cornerRadius;
		if (attributes['stroke-width']) {
			point3X = point3X - attributes['stroke-width'];
		}
		var point3Y      = point2Y;
		
		var point4XQuad  = (!cornerRadius) ? point3X : point3X + cornerRadius;
		var point4YQuad  = point3Y;
		
		var point5X      = point4XQuad;
		var point5Y      = (!cornerRadius) ? point4YQuad : point4YQuad + cornerRadius;
	
		var point6X      = point5X;
		var point6Y      = (!cornerRadius) ? height : height - cornerRadius;
		
		var point7XQuad  = point4XQuad;
		var point7YQuad  = (!cornerRadius) ? height : point6Y + cornerRadius;
	
		var point8X      = point3X;
		var point8Y      = point7YQuad;
		
		var point9X      = (!cornerRadius) ? 0 : cornerRadius;
		if (attributes['stroke-width']) {
			point9X = point9X + attributes['stroke-width'];
		}
		var point9Y      = point8Y;
		
		var point10XQuad = (!attributes['stroke-width']) ? 0 : attributes['stroke-width'];
		var point10YQuad = point9Y;
	
		var point11X     = point10XQuad;
		var point11Y     = point6Y;
		
		var point12X     = point11X;
		var point12Y     = point5Y;
		
		var point13XQuad = point12X;
		var point13YQuad = point4YQuad;
		
		var point14X     = (!cornerRadius) ? point13XQuad : point13XQuad + cornerRadius;
		var point14Y     = point3Y;
	
		var point15X     = (!triangleHeight) ? point1X : point1X - triangleHeight/2;
		var point15Y     = point2Y;
		
		
		this.popoverOutline = this.chartRaph.path(
			"M" + point1X + "," + point1Y +
			"L" + point2X + "," + point2Y +
			"L" + point3X + "," + point3Y +
			"Q" + point4XQuad + "," + point4YQuad + " " + point5X + "," + point5Y +
			"L" + point6X + "," + point6Y +
			"Q" + point7XQuad + "," + point7YQuad + " " + point8X + "," + point8Y +
			"L" + point9X + "," + point9Y +
			"Q" + point10XQuad + "," + point10YQuad + " " + point11X + "," + point11Y +
			"L" + point12X + "," + point12Y +
			"Q" + point13XQuad + "," + point13YQuad + " " + point14X + "," + point14Y +
			"L" + point14X + "," + point14Y + 
			"L" + point15X + "," + point15Y +
			"Z"
		);
		this.popoverOutline.attr(attributes);
		this.popoverOutline.transform("t" + this.thumbRadius + "," + (this.thumbRadius + 3));
		
		if ( Raphael.svg ) {
			// glow does not appear to move with the popover set
			// so, we'll use a data object to hold it, and remove it before adding one
			if (this.popoverOutline.data('glow')) {
				this.popoverOutline.data('glow').remove();
			}
			var g = this.popoverOutline.glow({width: 3, fill: true, opacity: 0.25, offsetx: 0, offsety: 2, color: "#000"});
			this.popoverOutline.data('glow', g);
		}
		
		var labelY = (!triangleHeight) ? topBottomPadding : triangleHeight + topBottomPadding;
		this.popoverLabel = this.chartRaph.text(width/2, labelY, 'XXXX');
		this.popoverLabel.attr({ 'font-size': fontSize, 'font-weight': 'bold', fill: "#fff" });
		this.popoverLabel.transform("t" + this.thumbRadius + "," + (this.thumbRadius + 3));
		this.hidePopover();
	}
	
	LineChartWithOverlay.prototype.displayPopover = function()
	{
		this.popoverLabel.attr({ opacity: 1 });		
		this.popoverOutline.attr({ opacity: 1, fill: '90-#053b65-#0a507b:80' });
		
		if ( Raphael.svg ) {		
			if (this.popoverOutline.data('glow')) {
				this.popoverOutline.data('glow').remove();
			}
			var g = this.popoverOutline.glow({width: 3, fill: true, opacity: 0.25, offsetx: 0, offsety: 2, color: "#000"});
			this.popoverOutline.data('glow', g);
		}
	}

	LineChartWithOverlay.prototype.hidePopover = function()
	{
		this.popoverLabel.attr({ opacity: 0 });
		this.popoverOutline.attr({ opacity: 0, fill: 'none' });
		
		if ( Raphael.svg ) {		
			if (this.popoverOutline.data('glow')) {
				this.popoverOutline.data('glow').remove();
			}
		}
	}