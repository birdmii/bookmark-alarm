$(function() {
	$('#search').change(function() {
		$('#bookmarks').empty();
		dumpBookmarks($('#search').val());
	});   
});

function dumpBookmarks(query) {
	let bookmarkTreeNodes = chrome.bookmarks.getTree(
		function(bookmarkTreeNodes) {
			$('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
		});
}

function dumpTreeNodes(bookmarkTreeNodes, query) {
	let list = $('<ul>');
	let i;
	for(i = 0; i < bookmarkTreeNodes.length ; i++) {
		list.append(dumpNode(bookmarkTreeNodes[i], query));        
	}
	return list;
}

function dumpNode(bookmarkNode, query) {
	let span = $('<span>');
	let h4 = $('<h4>');
	let anchor = $('<a>');
	if(bookmarkNode.title) {
		if(query && !bookmarkNode.children) {
			if(String(bookmarkNode.title).indexOf(query) == -1) {
				return $('<span></span>');
			}
		}
	}

	//When bookmark has a url, a bookmark. If not it's a title
	if(!bookmarkNode.url) {
		h4.text(bookmarkNode.title);
		span.append(h4);
	} else {
		anchor.attr('href', bookmarkNode.url);
		anchor.text(bookmarkNode.title);
		anchor.click(function() {
			chrome.tabs.create({url: bookmarkNode.url});
		});
		span.append(anchor);
	}

	//When hovered item is a folder, show add button 
	//when it's a bookmark, show edit and delete button
	let options = bookmarkNode.children ?
		$('<span>[<a href="#" id="addlink">Add to here</a>]</span>') :
		$('<span>[<a id="editlink" href="#">Edit</a> ' +
		'<a id="deletelink" href="#">Delete</a> '+
		'<a id="alarmlink" href="#">Alarm</a>]</span>');
	// let edit = bookmarkNode.children ? 
	// 	$('<table><tr><td>Name</td><td><input id="title"></td></tr>' +
	// 	'<tr><td>URL</td><td><input id="url"></td></tr></table>') :
	// 	$('<input>');  
	let alarm = $('<div><input type="radio" id="test" name="alarmterm" value="0.1"> <label for="0.5min">test</label><br> ' +
			'<input type="radio" id="5min" name="alarmterm" value="5" checked> <label for="5min">5min</label><br> ' +
			'<input type="radio" id="15min" name="alarmterm" value="15"> <label for="15min">15min</label><br>  ' +
			'<input type="radio" id="30min" name="alarmterm" value="30"> <label for="30min">30min</label><br> ' +
			'<input type="submit" id="setalarm" value="SET">' +
			'<input type="submit" id="clear" value="CLEAR"></div>');

	span.hover(function() {
		span.append(options);
		$('#deletelink').click(function() {
			if(confirm("Are you sure want to delete this bookmark?")) {
				chrome.bookmarks.remove(String(bookmarkNode.id));
				span.parent().remove(); 
			} 
		});

		$('#editlink').click(function() {
			let title = anchor.text();
			// let link = anchor[0].href;
			// edit.val(title);
			let editedTitle = prompt('Edit Title',title);
			if(editedTitle !== null && editedTitle !== title) {
				chrome.bookmarks.update(String(bookmarkNode.id), {
					title: editedTitle
				});
				anchor.text(editedTitle);
			}
		});

		$('#alarmlink').click(function() {
			let title = anchor.text();
			let link = anchor[0].href;
			
			span.append(alarm);

			$('#setalarm').click(function() {
				let alarmTerm = $('input[name=alarmterm]:checked').val();
				let minutes = parseFloat(alarmTerm);
				chrome.browserAction.setBadgeText({text: 'ON'});
				chrome.alarms.create(link, {delayInMinutes: minutes});
				chrome.storage.sync.set({minutes: minutes});
				alert('You \'ll get alarmed in ' +minutes + 'min about ' + title);

				alarm.remove();

			});

			$('#clear').click(function() {
				chrome.browserAction.setBadgeText({text: ''});
				chrome.alarms.clearAll();
			});

		});

		$('#addlink').click(function() {
			chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
				let currentTab = tabs[0];
				let title = currentTab.title;
				let url = currentTab.url;
				chrome.bookmarks.create({parentId: bookmarkNode.id, title: title, url: url}, function(result) {
					if(result.url === url && result.title === title) {
						alert("New bookmark has added!");
						$('#bookmarks').empty();
						dumpBookmarks();
					} else {
						alert("Oops! Error has occured");
					}
				});
				
			});
		});
	}, 
	//unhover
	function() {
		options.remove();
		alarm.remove();
	}).append(anchor);    
	
	let li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
	if(bookmarkNode.children && bookmarkNode.children.length > 0) {
		li.append(dumpTreeNodes(bookmarkNode.children, query));
	}

	return li;
}

document.addEventListener('DOMContentLoaded', function() {
	dumpBookmarks();
});