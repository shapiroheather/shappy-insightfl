 /*
margins and padding accept either nil, an integer, or an array of 4 values 
[0] = top margin, [1] = right margin, [2] = bottom margin, [3] = left margin
values beyond index 3 will be ignored, length less than 4 will result in crash 
*/
function BiChart (containerID, margins, padding, gutterWidth, gutterPadding)
{
	this.containerID      = containerID;
	this.jQueryEquivalent = $('#' + this.containerID);
	this.containerHeight  = this.jQueryEquivalent.height();
	this.containerWidth   = this.jQueryEquivalent.width();
	this.Raph             = Raphael(this.containerID, this.jQueryEquivalent.width(), this.jQueryEquivalent.height());

	this.topMargin = 0;
	if (margins instanceof Array) {
		this.topMargin = margins[0];
		
	} else if (margins) {
		this.topMargin = margins;
		
	}
	
	this.rightMargin = 0;
	if (margins instanceof Array) {
		this.rightMargin = margins[1];
		
	} else if (margins) {
		this.rightMargin = margins;
		
	}
	
	this.bottomMargin = 0;
	if (margins instanceof Array) {
		this.bottomMargin = margins[2];
		
	} else if (margins) {
		this.bottomMargin = margins;
		
	}
	
	this.leftMargin = 0;
	if (margins instanceof Array) {
		this.leftMargin = margins[3];
		
	} else if (padding) {
		this.leftMargin = margins;
		
	}
	
	this.topPadding = 0;
	if (padding instanceof Array) {
		this.topPadding = padding[0];
		
	} else if (padding) {
		this.topPadding = padding;
		
	}
	
	this.rightPadding = 0;
	if (padding instanceof Array) {
		this.rightPadding = padding[1];
		
	} else if (padding) {
		this.rightPadding = padding;
		
	}
	
	this.bottomPadding = 0;
	if (padding instanceof Array) {
		this.bottomPadding = padding[2];
		
	} else if (padding) {
		this.bottomPadding = padding;
		
	}
	
	this.leftPadding = 0;
	if (padding instanceof Array) {
		this.leftPadding = padding[3];
		
	} else if (padding) {
		this.leftPadding = padding;
		
	}
	
	this.gutterWidth   = (gutterWidth) ? gutterWidth : 0;
	this.gutterPadding = (gutterPadding) ? gutterPadding : 0;

	this.chartCenterX = this.jQueryEquivalent.width()/2;
	this.chartYValues = [];
	
	var xAxisPathString = "M" + (this.leftMargin + this.leftPadding) + "," + (this.jQueryEquivalent.height() - this.bottomMargin) + 
		"L" + (this.jQueryEquivalent.width() - this.leftPadding - this.leftMargin) + "," + (this.jQueryEquivalent.height() - this.bottomMargin);
	this.chartXAxisPath = this.Raph.path(xAxisPathString);
	this.xAxisLeftLabel = this.Raph.text(this.leftMargin, this.jQueryEquivalent.height() - (this.bottomMargin * 0.70), '');
	this.xAxisRightLabel = this.Raph.text((this.containerWidth - this.rightMargin), this.jQueryEquivalent.height() - (this.bottomMargin * 0.70), '');
	this.xAxisMiddleLabel = this.Raph.text(this.chartCenterX, this.jQueryEquivalent.height() - (this.bottomMargin * 0.70), '');

	
	this.medianIndex;
	var medianLineString = "M" + (this.leftMargin + this.leftPadding) + "," + 0 +
		"L" + (this.jQueryEquivalent.width() - this.leftPadding - this.leftMargin) + "," + 0;
	this.medianLine      = this.Raph.path(medianLineString);
	this.medianLineLabel = this.Raph.text((this.leftMargin + this.leftPadding), (this.medianLine.attr('y') + 12), '');
	this.medianLineLabel.attr({ 'text-anchor': 'start', fill: '#4f4f4f', 'font-weight': 'bold' });
	
	this.chart1XOrigin = this.chartCenterX - (this.gutterWidth/2 + this.gutterPadding);
	this.chart1YOrigin = this.topMargin + this.topPadding;
	this.chart1Width   = this.jQueryEquivalent.width()/2 - this.leftMargin - this.leftPadding - this.gutterWidth/2 - this.gutterPadding;
	this.chart1Height  = this.jQueryEquivalent.height() - this.topMargin - this.topPadding - this.bottomPadding - this.bottomMargin;
	this.chart1MaxValue = 1.0;
	this.chart1MinValue = 0;
	this.chart1XValues = [];
	
	
	this.chart2XOrigin = this.chartCenterX + (this.gutterWidth/2 + this.gutterPadding);
	this.chart2YOrigin = this.chart1YOrigin;
	this.chart2Width   = this.jQueryEquivalent.width()/2 - this.rightMargin - this.rightPadding - this.gutterWidth/2 - this.gutterPadding;
	this.chart2Height  = this.chart1Height;
	this.chart2MaxValue = 1.0;
	this.chart2MinValue = 0;
	this.chart2XValues = [];
	
}

function PyramidGraph(containerID, margins, padding, gutterWidth, gutterPadding)
{
	BiChart.call(this, containerID, margins, padding, gutterWidth, gutterPadding);
	this.rowHeight;
	this.graphTotal;
	this.chartYValues;
	this.chart1Bars       = [];
	this.chart2Bars       = [];
	this.chartBarOverlays = [];
	
	this.xAxisLeftLabel;
	this.xAxisRightLabel;
	this.xAxisMiddleLabel;
	
	this.leftRowLabel  = this.Raph.text(this.chartCenterX, 0, '').attr({'font-size': 12}); // reusable chart 1 row value - cloned
	this.rightRowLabel = this.Raph.text(this.chartCenterX, 0, '').attr({'font-size': 12}); // reusable chart 2 row value - cloned
	this.gutterLabel   = this.Raph.text(this.chartCenterX, 0, '').attr({'font-size': 12}); // reusable middle row value - cloned
	
	this.gutterValueLabels = []; // large center value labels
// used if all labels for the chart are created on initial rendering
// however, generating the labels is an expensive process
// specifically in Internet Explorer 8 and less
// usually 0.5 seconds per label to be created
// however, these are still used for the print version
	this.gutterValueLabelsPrint = [];
	this.chart1ValueLabels      = [];
	this.chart2ValueLabels      = [];

	this.interactionIsDisabled = false;

}
PyramidGraph.prototype = Object.create(BiChart.prototype);
PyramidGraph.prototype.constructor = PyramidGraph;

	PyramidGraph.prototype = {
		render: function(yValues, chart1BarAttributes, chart2BarAttributes)
		{
			var $Graph = this;
			this.chartYValues  = yValues;
			if (this.chartYValues) {
				
				this.rowHeight = this.chart1Height/this.chartYValues.length;
				var iteratorCount = 0;
				for (var i = 0; i < this.chartYValues.length; i++) {
					// container height = bottom of container, move up bottom margin distance, move up bottom padding distance (ex. 1000 - 20 - 10 = 970)
					// move above all the bars we've already created
					// move up one bar height to account for the height of the bar we are creating
					var yPos = (this.containerHeight - this.bottomMargin - this.bottomPadding) - (this.rowHeight * i) - this.rowHeight;
					
					// build the bar for chart 1
					this.chart1Bars[i] = this.Raph
						.rect((this.leftMargin + this.leftPadding), yPos, this.chart1Width, this.rowHeight)
						.attr(chart1BarAttributes)
						.data('percent', 1.0)
						.data('index', i);

					// build the bar for chart 2
					this.chart2Bars[i] = this.Raph
						.rect(this.chart2XOrigin, yPos, this.chart2Width, this.rowHeight)
						.attr(chart2BarAttributes)
						.data('index', i);

					// we want to have functions called for each bar - spanning the entire chart
					// these bars span the entire chart and are transparent
					this.chartBarOverlays[i] = this.Raph
						.rect(0, yPos, this.containerWidth, this.rowHeight)
						.attr({ stroke: "none", fill: "#000", opacity: 0.0 })
						.data('index', i)
						.hover(
							function() { // mouse in
								if (!$Graph.interactionIsDisabled) {
									$Graph.scaleUpBarsAtIndex(this.data('index'));
								}			
							},
							function() { // mouse out
								if (!$Graph.interactionIsDisabled) {
									$Graph.resetScaleForBarsAtIndex(this.data('index'));
								}
							}
						);
	
					// large Y value indicator label
					if (i < this.chartYValues.length && (iteratorCount == 20)) {
						var gutterStepLabel = this.Raph.text(this.chartCenterX, this.chartBarOverlays[i].attr('y') + 2, (i + 1 < this.chartYValues.length) ? i : 'Age')
						.attr({
							  'font-size': 18, 
							  'font-weight': 'bold', 
							  fill: '#a8a8a8', 
							  opacity: 0.75
							  
						});
						this.gutterValueLabels.push(gutterStepLabel);
						
						iteratorCount = 0;
					}
					iteratorCount++;

					// rendering/creating text is an expensive process (particularly for Internet Explorer)
					// therefore, we will create the labels once and position
					// them on the fly when a row is hovered
					// having the text be an empty string results in awkward positioning
					// therefore, a default string is used
					if ( i == 0 ) {
						// build the value label to display at end of bar in chart 1
						this.leftRowLabel.attr('text', 'left').transform('t0,' + yPos).hide();

						// build the value label to display at end of bar in chart 2
						this.rightRowLabel.attr('text', 'right').transform('t0,' + yPos).hide();
					
						// Y value label for bar at index
						this.gutterLabel.attr('text', 'center').transform("t0," + yPos).hide();
					}
				}
				
				this.renderVerticalWhiteLines();
				this.renderXAxis();
				this.renderMaleIcon();
				this.renderFemaleIcon();
			}
		},
		
		renderVerticalWhiteLines: function()
		{
			// lines over charts
			var verticalLine1 = this.Raph.path(
				"M" + (this.leftMargin + this.leftPadding) + ' ' + this.topMargin +
				"L" + (this.leftMargin + this.leftPadding) + ' ' + (this.containerHeight - this.bottomMargin)).attr({ stroke: '#fff' });
			
			verticalLine2 = verticalLine1.clone();
			verticalLine2.transform("t" + (this.chart1Width * 0.2) + ",0");

			verticalLine3 = verticalLine1.clone();
			verticalLine3.transform("t" + (this.chart1Width * 0.4) + ",0");
			
			verticalLine4 = verticalLine1.clone();
			verticalLine4.transform("t" + (this.chart1Width * 0.6) + ",0");
			
			verticalLine5 = verticalLine1.clone();
			verticalLine5.transform("t" + (this.chart1Width * 0.8) + ",0");
			
//			verticalLine6 = verticalLine1.clone();
//			verticalLine6.transform("t" + (this.chart1Width * 1.0) + ",0");
	
// The existence of this line causes display issue in IE due to pixel shift of bars		
//			verticalLine7 = verticalLine1.clone();
//			verticalLine7.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth) + ",0");
			
			verticalLine8 = verticalLine1.clone();
			verticalLine8.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.20) + ",0");
			
			verticalLine9 = verticalLine1.clone();
			verticalLine9.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.40) + ",0");
			
			verticalLine10 = verticalLine1.clone();
			verticalLine10.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.60) + ",0");
			
			verticalLine11 = verticalLine1.clone();
			verticalLine11.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.80) + ",0");
			
			verticalLine12 = verticalLine1.clone();
			verticalLine12.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 1.0) + ",0");
		},
		
		renderXAxis: function()
		{
			// xAxis under lines
			var dash1 = this.Raph.path(
				"M" + (this.leftMargin + this.leftPadding) + ' ' + (this.containerHeight - this.bottomMargin) + 
				"L" + (this.leftMargin + this.leftPadding) + ' ' + (this.containerHeight - this.bottomMargin * 0.90)).attr({ stroke: '#000' });

			var dash2 = dash1.clone();
			dash2.transform("t" + (this.chart1Width * 0.20) + ",0");

			var dash3 = dash1.clone();
			dash3.transform("t" + (this.chart1Width * 0.40) + ",0");
			
			var dash4 = dash1.clone();
			dash4.transform("t" + (this.chart1Width * 0.60) + ",0");
			
			var dash5 = dash1.clone();
			dash5.transform("t" + (this.chart1Width * 0.80) + ",0");
			
			var dash6 = dash1.clone();
			dash6.transform("t" + (this.chart1Width * 1.0) + ",0");
			
			var dash7 = dash1.clone();
			dash7.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth) + ",0");
			
			var dash8 = dash1.clone();
			dash8.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.20) + ",0");
			
			var dash9 = dash1.clone();
			dash9.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.40) + ",0");
			
			var dash10 = dash1.clone();
			dash10.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.60) + ",0");
			
			var dash11 = dash1.clone();
			dash11.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 0.8) + ",0");
			
			var dash12 = dash1.clone();
			dash12.transform("t" + (this.chart1Width * 1.0 + this.gutterPadding * 2 + this.gutterWidth + this.chart2Width * 1.0) + ",0");
			
			this.chartXAxisPath.attr({ stroke: '#656565' });
			this.chartXAxisPath.toFront();
		},
		
		renderMaleIcon: function()
		{
			// Peg-man
			this.Raph.setStart();
			this.Raph.path("M18.255,8.511l-0.086-0.003c-0.021,0-0.034,0.004-0.043,0.004l-6.772-0.004v0.003" +
				"c-0.009,0-0.013-0.003-0.023-0.003l-0.086,0.003c-2.271,0-4.097,1.877-4.073,4.229l-0.003,0.168v9.636" +
				"c0,1.943,2.803,1.943,2.803,0v-8.973h0.751l-0.003,0.02v25.428c0,2.521,3.752,2.598,3.752,0V24.041h0.623v14.978" +
				"c0,2.521,3.755,2.598,3.755,0V13.589v-0.019h0.681v8.973c0,1.943,2.803,1.943,2.803,0v-9.636v-0.169" +
				"C22.353,10.387,20.527,8.511,18.255,8.511z")
			.attr({fill: '#0C6291', stroke: 'none'});
			this.Raph.circle(14.631, 4.203, 3.265).attr({fill: '#0C6291', stroke: 'none'});
			
			var pegMan = this.Raph.setFinish();
			pegMan.toFront();
			pegMan.transform("t" + this.leftMargin + "," + this.topMargin);
		},
		
		renderFemaleIcon: function()
		{
				// Peg-woman
			this.Raph.setStart();
			this.Raph.path("M14.294,27.337v11.862c0,2.317-3.471,2.317-3.471,0V27.337H8.091l3.053-13.592H10.37l-2.058,7.699" +
				"c-0.688,2.126-3.611,1.256-2.942-1.024l2.383-8.542c0.343-1.208,1.871-3.351,4.518-3.351h2.438l0,0h2.624" +
				"c2.621,0,4.155,2.16,4.552,3.351l2.101,8.466c0.644,2.276-2.256,3.218-2.943,1l-1.78-7.598h-0.836L21.22,27.34h-2.44v11.873" +
				"c0,2.304-3.457,2.288-3.457,0V27.34L14.294,27.337L14.294,27.337z")
			.attr({fill: '#C1592C', stroke: 'none'});
			
			
			this.Raph.circle(14.771, 4.202, 3.265).attr({fill: '#c1592c', stroke: 'none'});
			var pegWoman = this.Raph.setFinish();
			pegWoman.toFront();
			pegWoman.transform("t" + (this.containerWidth - this.rightMargin - 29) + "," + this.topMargin);

		},
		
		scaleUpBarsAtIndex: function(index)
		{
			// increase height of bars
			this.scaleBar(this.chart1Bars[index], this.chart1XOrigin, 1);
			this.scaleBar(this.chart2Bars[index], this.chart2XOrigin, 1);

			// position and set text for labels
			var leftPercent = zeroAppend(floatToPercentString(this.chart1Bars[index].data('percent')/100, 2), 4) + '%'; // this.chart1Bars[index].data('percent');	
			this.updateLabelForBar(this.chart1Bars[index], this.leftRowLabel, leftPercent, true);
			
			var rightPercent = zeroAppend(floatToPercentString(this.chart2Bars[index].data('percent')/100, 2), 4) + '%'; // this.chart2Bars[index].data('percent');
			this.updateLabelForBar(this.chart2Bars[index], this.rightRowLabel, rightPercent, false);
			
			var gutterValue = this.chartYValues[index];
			this.updateLabelForBar(this.chartBarOverlays[index], this.gutterLabel, gutterValue);

			this.showLabels();
			
		},
		
		resetScaleForBarsAtIndex: function(index)
		{
			// decrease height of bars
			this.scaleBar(this.chart1Bars[index], this.chart1XOrigin, 0.5);
			this.scaleBar(this.chart2Bars[index], this.chart2XOrigin, 0.5);
		},
		
		scaleBar: function(bar, xOrigin, desiredVerticalScale)
		{
			// horizontally scale bar based on percent value
			var theBar = bar;
			var barPercent = percentForValueInRange(this.chart1MinValue, this.chart1MaxValue, theBar.data('percent'));
			if (typeof barPercent == 'undefined') {
				barPercent = 0;
			}
			var barTransform = "s" + barPercent + " " + desiredVerticalScale + " " + xOrigin + " " + theBar.attrs.y;
			theBar.transform(barTransform);
		},
		
		updateLabelForBar: function(bar, label, text, isLeft)
		{
			// position the label relative to the bar y position and width
			// and set text for label
			// we can interact with the graph
			if (!this.interactionIsDisabled) {	
				var xTranslation = 0; 
				
				// we don't want to move the labels in the center
				if ($.inArray(bar, this.chartBarOverlays) < 0) {

					var barPercent = percentForValueInRange(this.chart1MinValue, this.chart1MaxValue, bar.data('percent'));
					if ( barPercent ) {
						xTranslation = ( isLeft )
						? -(bar.attrs.width * barPercent) - (this.gutterWidth/2) - 40
						: (bar.attrs.width * barPercent) + (this.gutterWidth/2) + 40;

					}
				}

				// IE does not appear to automatically convert
				// number to string in this context - perform
				// explicit conversion
				if ( typeof text == 'number' ) {
					text = text.toString();
				}
				
				label.transform( 't' + xTranslation + ' ' + (bar.attrs.y + (bar.attrs.height/2)) )
				.attr('text', text)
				.toFront();
			}
		},
		
		showLabels: function()
		{
			this.leftRowLabel.show();
			this.rightRowLabel.show();
			this.gutterLabel.show();
		},

		hideLabels: function()
		{
			this.leftRowLabel.hide();
			this.rightRowLabel.hide();
			this.gutterLabel.hide();
		},

		showAllLabels: function()
		{
			for ( var i = 0; i < this.gutterValueLabels.length; i++ ) {
				this.gutterValueLabels[i].hide();
			}
			for ( var i = 0; i < this.chartBarOverlays.length; i++ ) {
				this.chart1ValueLabels[i] = this.leftRowLabel.clone();
				barPercent = floatToPercentString(this.chart1Bars[i].data('percent')/100, 2);
				
				this.chart1ValueLabels[i].attr({ text: barPercent + '%', 'text-anchor': 'end' });
				barWidth = this.chart1Bars[i].attrs.width;

				this.chart1ValueLabels[i].transform('t' + (-(this.gutterWidth/2 + barWidth * this.chart1Bars[i].data('percent')) - 40) + ',' + (this.chart1Bars[i].attr('y') + 2));

				this.chart2ValueLabels[i] = this.rightRowLabel.clone();
				barPercent = floatToPercentString(this.chart2Bars[i].data('percent')/100, 2);

				this.chart2ValueLabels[i].attr({ text: barPercent + '%', 'text-anchor': 'start'});
				barWidth = this.chart2Bars[i].attrs.width;

				this.chart2ValueLabels[i].transform('t' + ((this.gutterWidth/2 + barWidth * this.chart2Bars[i].data('percent')) + 40) + ',' + (this.chart2Bars[i].attr('y') + 2));


				this.gutterValueLabelsPrint[i] = this.gutterLabel.clone();
				this.gutterValueLabelsPrint[i].attr({
					'text': this.chartYValues[i]
				});
				
				this.gutterValueLabelsPrint[i].transform("t0," + (this.chartBarOverlays[i].attr('y') + 1));
				
			}
		},

		updateGraphWithData: function(chart1Values, chart2Values, minValueForCharts, maxValueForCharts, testChart1Values, testChart2Values, medianIndex)
		{
			// the left and right bar data array MUST have the a value for
			// each value/index in the vertical set array
			// if the median index is set a horizontal line will be drawn at that index
			var $Graph = this;
			
			this.chart1XValues = chart1Values;
			this.chart2XValues = chart2Values;			
			for (var i = 0; i < this.chartYValues.length; i++) {
				// possibly replace with data from json
				this.chart1Bars[i].data('percent', chart1Values[i]);
				this.chart2Bars[i].data('percent', chart2Values[i]);
				this.resetScaleForBarsAtIndex(i);
				
//				if (typeof medianIndex !== 'undefined' && medianIndex == i) {
//					this.medianLine.transform("t0," + this.chart1Bars[i].attr('y')).attr({ stroke: '#979797', 'stroke-width': 2, 'stroke-dasharray': ['- '], opacity: 0.75 });
//					this.medianLineLabel.transform("t0," + this.chart1Bars[i].attr('y'));
//					this.medianLineLabel.toFront();							 
//					this.medianLine.toFront();
//				}
			}
		}	
	}