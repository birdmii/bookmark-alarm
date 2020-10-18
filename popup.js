$(function() {
	$('#search').change(function() {
		$('#bookmarks').empty();
		dumpBookmarks($('#search').val());
	}); 

	getAlarmCnt(function(count) {
		if(count !== 0) {
			let alarmList = getBookmarkAlarms();
			$('#alarmcontent').append(alarmList);
			$('#alarmlist_row').show();
		} else {
			$('#alarmlist_row').hide();
		}
	});

	$('#alarmcontent_list').off('click').on('click', '.clear', function() {
		let item = $(this).parent();
		let link = item[0].id;
		let left = true;
		getAlarmCnt(function(count) {
			count--;
			let notificationCnt = count.toString();
			if(notificationCnt === '0') {
				chrome.browserAction.setBadgeText({text: ''});
				left = false;
			}
			else 
				chrome.browserAction.setBadgeText({text: notificationCnt});
			
			chrome.alarms.clear(link, function(wasCleared) {
				if(wasCleared) {
					item.remove();
					if(!left) 
						$('#alarmlist_row').hide();
					alert("The bookmark alarm has removed successfully!");
				}
				else {
					alert("40:Oops! Error has occured..");
				}
			});
		});
	});

	$('#alarmlist').on('click', '#alarmlist_clear_btn', function() {
		if(confirm("Are you sure clear all bookmark alarm?")) {
			chrome.alarms.clearAll(function(wasCleared) {
				if(wasCleared) {
					alert('All bookmark alarm is cleared!');
					chrome.browserAction.setBadgeText({text: ''});
				} else {
					alert('52:Oops! Error has occured..');
				}
			});
			$('#alarmcontent').empty();
			$('#alarmlist_row').hide();
		}
	});

	chrome.storage.onChanged.addListener(function(changes, namespace) {
		for(key in changes) {
			chrome.storage.sync.get(key, function(result) {
				if(result[key] === "fired") {
					let item = $("#"+removeSpecialChar(key));
					item.remove();
				}
			});
		}
	});
});

function getBookmarkAlarms(obj) {
	let alarmList = $('#alarmcontent_list');
	if(obj !== undefined) {
		let title = obj.alarmtitle
		let item = '<li id="'+removeSpecialChar(obj.alarmlink)+'" class="alarm_item">'+ title + '<span class="clear"><img src="assets/clear.png" class="option_icon_md"></span></li>'
		$('#alarmlist_row').show();
		$('#alarmcontent_list').append(item);
	} else {
		chrome.alarms.getAll(function(Alarms) {
			for(let i = 0 ; i < Alarms.length ; i++) {
				let link = Alarms[i].name;
				chrome.bookmarks.search(Alarms[i].name, function(BookmarkTreeNodes) {
					let title = BookmarkTreeNodes[0].title;
					let item = '<li id="'+link+'" class="alarm_item">'+title + '<span class="clear"><img src="assets/clear.png" class="option_icon_md"></span></span></li>'
					// let item = '<li id="'+link+'" class="alarm_item">'+title + " ["+link+"]"+'<span class="clear"><img src="assets/delete.png" class="option_icon_md"></span></span></li>'
					$('#alarmcontent_list').append(item);
				});	
			}
		});
	}
	return alarmList;
}

function removeSpecialChar(urlId){
    return urlId.replace(/[^\w\s]/gi, '');
}

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
	let alarm = $('<div class="setAlarmPanel"><input type="radio" id="test" name="alarmterm" value="0.1" checked> <label for="0.5min">test</label> ' +
			'<input type="radio" id="5min" name="alarmterm" value="5" > <label for="5min">5min</label>' +
			'<input type="radio" id="15min" name="alarmterm" value="15"> <label for="15min">15min</label> ' +
			'<input type="radio" id="30min" name="alarmterm" value="30"> <label for="30min">30min</label><br> ' +
			'<input type="submit" id="setalarm" class="btn" value="SET"></div>');
	
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
				chrome.alarms.get(link, function(alarm) {
					if(alarm !== undefined) {
						alert("The same alarm is already on you list.");
					} else {
						getAlarmCnt(function(count) {
							count++;
							let notificationCnt = count.toString();
							let alarmTerm = $('input[name=alarmterm]:checked').val();
							let minutes = parseFloat(alarmTerm);
							chrome.browserAction.setBadgeText({text: notificationCnt});
							chrome.alarms.create(link, {delayInMinutes: minutes});
							chrome.storage.sync.set({minutes: minutes});
							alert('You \'ll get alarmed in ' +minutes + 'min about ' + title);
							getBookmarkAlarms({alarmtitle: title, alarmlink: link});
						});
						chrome.storage.sync.set({[removeSpecialChar(link)]: "set"});
					}
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
						alert("222:Oops! Error has occured..");
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