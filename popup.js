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
	let directories = $('<span class="directories">');
	let bookmarkItem = $('<a class="bookmark_item">');
	if(bookmarkNode.title) {
		if(query && !bookmarkNode.children) {
			if(String(bookmarkNode.title).indexOf(query) == -1) {
				return $('<span></span>');
			}
		}
	}

	//When bookmark has a url, a bookmark. If not it's a title
	if(!bookmarkNode.url) {
		directories.text(bookmarkNode.title);
		span.append(directories);
	} else {
		bookmarkItem.attr('href', bookmarkNode.url);
		bookmarkItem.text(bookmarkNode.title);
		bookmarkItem.click(function() {
			chrome.tabs.create({url: bookmarkNode.url});
		});
		span.append(bookmarkItem);
	}

	let li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
	if(bookmarkNode.children && bookmarkNode.children.length > 0) {
		li.append(dumpTreeNodes(bookmarkNode.children, query));
	}

	//When hovered item is a folder, show add button 
	//when it's a bookmark, show edit and delete button
	let options = bookmarkNode.children ?
		$('<span><span id="addlink" class="option_btn"><img src="assets/add.png" class="option_icon_lg"></span></span>') :
		$('<span><span id="editlink" class="option_btn"><img src="assets/edit.png" class="option_icon_md"></span> ' +
		'<span id="deletelink" class="option_btn"><img src="assets/delete.png" class="option_icon_md"></span> '+
		'<span id="alarmlink" class="option_btn"><img src="assets/alarm.png" class="option_icon_md"></span></span>');
	
	// let edit = bookmarkNode.children ? 
	// 	$('<table><tr><td>Name</td><td><input id="title"></td></tr>' +
	// 	'<tr><td>URL</td><td><input id="url"></td></tr></table>') :
	// 	$('<input>');  
	let alarm = $('<div class="setAlarmPanel"><input type="radio" id="test" name="alarmterm" value="1" checked> <label for="0.5min">test</label> ' +
			'<input type="radio" id="5min" name="alarmterm" value="5" > <label for="5min">5min</label>' +
			'<input type="radio" id="15min" name="alarmterm" value="15"> <label for="15min">15min</label> ' +
			'<input type="radio" id="30min" name="alarmterm" value="30"> <label for="30min">30min</label><br> ' +
			'<input type="submit" id="setalarm" class="btn" value="SET">' +
			'<input type="submit" id="clear" class="btn" value="CLEAR"></div>');
	
	span.hover(function() {
		span.append(options);
		$('#deletelink').click(function() {
			if(confirm("Are you sure want to delete this bookmark?")) {
				chrome.bookmarks.remove(String(bookmarkNode.id));
				span.parent().remove(); 
			} 
		});//end of deletelink click

		$('#editlink').click(function() {
			let title = bookmarkItem.text();
			// let link = bookmarkItem[0].href;
			// edit.val(title);
			let editedTitle = prompt('Edit Title',title);
			if(editedTitle !== null && editedTitle !== title) {
				chrome.bookmarks.update(String(bookmarkNode.id), {
					title: editedTitle
				});
				bookmarkItem.text(editedTitle);
			}
		});//end of editlink click

		$('#alarmlink').on('click', function(event) {
			let title = bookmarkItem.text();
			let link = bookmarkItem[0].href;
			span.append(alarm);
			$('#setalarm').click(function() {
				getAlarmCnt(function(count) {
					count++;
					let notificationCnt = count.toString();
					// alert(notificationCnt);
					let alarmTerm = $('input[name=alarmterm]:checked').val();
					let minutes = parseFloat(alarmTerm);
					chrome.browserAction.setBadgeText({text: notificationCnt});
					chrome.alarms.create(link, {delayInMinutes: minutes});
					chrome.storage.sync.set({minutes: minutes});
					alert('You \'ll get alarmed in ' +minutes + 'min about ' + title);
					alarm.remove();
					window.close();
				});
			});
			//this component needs to be moved
			$('#clear').click(function() {
				getAlarmCnt(function(count) {
					count--;
					let notificationCnt = count.toString();
					if(notificationCnt === '0') 
						chrome.browserAction.setBadgeText({text: ''});
					else 
						chrome.browserAction.setBadgeText({text: notificationCnt});
					chrome.alarms.clear(link, function(wasCleared) {
						if(wasCleared)
							alert("The bookmark alarm has removed successfully!");
						else 
							alert("Oops! Error has occured..");
					});
				});
			});
		});//end of alarmlink click

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
						alert("Oops! Error has occured..");
					}
				});
				
			});
		});//end of addlink click
	}, 
	//unhover
	function() {
		options.remove();
		alarm.remove();
	}).append(bookmarkItem); //end of hover
	return li;
}

function getAlarmCnt(callback) {
    chrome.alarms.getAll(function(alarms) { callback(alarms.length) }); 
}

document.addEventListener('DOMContentLoaded', function() {
	dumpBookmarks();
});