/*
The population class is meant to be applied to a container element
with the following format:
<div id="container-id">
	<h3>[container label]</h3>
	<div class="progress-bar-container"></div>
	<p>[total label]</p>
</div>

The fill rate is in whole seconds for a net gain value of 1
*/
function Population(containerID)
{
	this.containerID      = containerID;
	this.jQueryEquivalent = $('#' + containerID);
	this.containerLabel = this.jQueryEquivalent.children('h3:first-child');
	
	this.progressBar;
	this.initialTotal;
	this.odometer;
}

	Population.prototype.setContainerLabel = function(value)
	{
		this.containerLabel.text(value);
	}
	
	Population.prototype.setTotalLabel = function(value)
	{
		if (!this.initialTotal) {
			this.initialTotal = value;
		}
		this.jQueryEquivalent.children('p').text(addCommas(value));	
	}
	
	Population.prototype.buildOdometer = function(animator, counter, digitImagePath, digitContainerHeight, digitContainerWidth, digitImageHeight, reverseImagePath, blurImagePath)
	{
		this.odometer = new Odometer(animator, counter, this.containerID);
		this.odometer.render(digitImagePath, digitContainerHeight, digitContainerWidth, digitImageHeight, (typeof reverseImagePath == 'undefined') ? digitImagePath : reverseImagePath, blurImagePath);
	}

/*
The population component class generates a paragraph element with a label,
and progress bar with a span element; as such, the container ID is usually an empty
block level element (e.g., <div>)
*/
function PopulationComponent(containerID)
{
	this.containerID = containerID;
	this.jQueryContainer = $(containerID);
	this.rowContainer = this.jQueryContainer.find('table tbody');
	
	this.progressBar;
}

	PopulationComponent.prototype.initWithLabelTextBarID = function(labelText, barID)
	{
		var html = '<tr><td>' + labelText + '</td><td id="' + barID + '"></td></tr>';
		this.rowContainer.append(html);
	}
	
	PopulationComponent.prototype.buildProgressBar = function(animator, counter, uniqueID, trackColor, barColor, fillFromLeft)
	{
		this.progressBar = new HTMLProgressBar(animator, counter, uniqueID, fillFromLeft);
		this.progressBar.render(trackColor, barColor);
	}