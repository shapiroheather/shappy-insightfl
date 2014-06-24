/*
The tabbed tabl class is meant to be applied to a container element
with the following format:
<div id="container-id">
	<h3>[container label]</h3>
	<nav>[tabs]</nav>
	[tables]
</div>
*/
function TabbedTable(containerID, prependString)
{
	this.containerID = containerID;
	this.jQueryEquivalent = $(this.containerID);
	
	// to allow multiple tables with the same tabs on page via unique 
	// can be left blank identifier
	this.prependString = prependString; 
}

	TabbedTable.prototype.render = function(json)
	{
		var $tabbedTable = this;

		for(var i = 0; i < json.length; i++) {
			var table = json[i];
			
			// add link html
			var linkHTML = 	$tabbedTable.linkForTab(table.title);
			$tabbedTable.jQueryEquivalent.children('ul.tabs').append(linkHTML);
			
			// Create label for print view
			var printLabel = '<h4>' + table.title + '</h4>';
			
			// add table html
			var tableHTML = '';
			if ( table.summary ) {
				tableHTML += '<table summary="' + table.summary + '" class="beveled shadow" cellpadding="0" cellspacing="0" border="0">';
				
			} else {
				tableHTML += '<table class="beveled shadow" cellpadding="0" cellspacing="0" border="0">';
				
			}

		
			// build header
			tableHTML    += '<thead><tr>';

			$.each(table.columns, function ( index, column ) {
				if ( index == 0 ) {
					tableHTML += '<th scope="row" class="cell' + index + '">' + column + '</th>';
					
				} else {
					tableHTML += '<th class="cell' + index + '">' + column + '</th>';
					
				}
				
			});
			
			tableHTML    += '</tr></thead>';
			
			// build rows
			tableHTML    += '<tbody>';
			
			$.each(table.rows, function ( index, row ) {
				
				tableHTML += '<tr' + ( index % 2 == 1 ? ' class="alt"' : '' ) + '>';
				
				$.each(row, function ( index, value ) {
					tableHTML += '<td class="cell' + index + '">' + value + '</td>';					
				});
				
				tableHTML += '</tr>';
			});
			
			tableHTML    += '</tbody>';

			tableHTML    += '</table>';
			
			$tabbedTable.jQueryEquivalent.append(printLabel + tableHTML);

		}
		
	}
	
	TabbedTable.prototype.enable = function(selected)
	{
		var $tabbedTable = this;
		
		// Set default selected
		selected = typeof selected !== 'undefined' ? selected : 0;
		
		// Hide non selected tables
		this.jQueryEquivalent.find('table:not(:eq(' + selected + '))').css({ display: 'none' });
		
		this.jQueryEquivalent.find('ul.tabs a').eq(selected).addClass("selected");
		this.jQueryEquivalent.find('ul.tabs a').each(function(index) {
			var $theLink = $(this);
			var index = index;
			
			$theLink.click(function(event) {
				event.preventDefault();
				
				$tabbedTable.jQueryEquivalent.find('ul.tabs a').each(function(index) {
					$(this).removeClass('selected');
				
				});
				
				$(this).addClass('selected');
				
				$tabbedTable.jQueryEquivalent.find('table').each(function(index) {
					$(this).css({ display: 'none' });
					
				});
				
				$tabbedTable.jQueryEquivalent.find('table').eq(index).css({ display: 'block' });

				return false;
			});
		});
	}
	
	TabbedTable.prototype.linkForTab = function(labelString)
	{
		// <a href="#[prependString][label in lower case format]">[label in original format]</a>
		var string = '<a href="';
		
		string += (this.prependString.length > 0)
		? this.prependString + labelString.toLowerCase()
		: labelString.toLowerCase();
		
		string += '">' + labelString + '</a>';
		return string;
	}