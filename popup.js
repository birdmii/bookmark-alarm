$(function() {
  //load alarmBoard
	getAlarmCnt(count => {
		if(count !== 0) {
			$('.row_end__item').show();
			let alarmList = getBookmarkAlarms();
			$('#alarmcontent').append(alarmList);
    } 
  });
  
  //search a bookmark
	$('#searchBar').change(() => {
      $('#bookmarkBoard').empty();
      dumpBookmarks($('#searchBar').val());
  }); 

  //clear an alarm
	$('#alarmList').off('click').on('click', '.clear', function(){
		let alarmItem = $(this).parent(),
        link = alarmItem[0].classList[0],
        isLeft = true;
        
		getAlarmCnt(count => {
      count === 0 ? 0: count--;
			let notificationCnt = count.toString();
			if(notificationCnt === '0') {
				chrome.browserAction.setBadgeText({text: ''});
				isLeft = false;
			}
			else 
				chrome.browserAction.setBadgeText({text: notificationCnt});
			
			chrome.alarms.clear(link, (wasCleared) => {
        if (wasCleared) {
          alarmItem.remove();
          if (!isLeft) {
            $('.row_end__item').hide();
          }
          alert('The bookmark alarm has removed successfully!');
        }
        else {
          alert('44:Oops! Error has occured..');
        }
      });
		});
	});

  //clear all alarm
	$('#alarmBoard').on('click', '#alarmBoardClear', () => {
		if(confirm('Are you sure clear all bookmark alarm?')) {
			chrome.alarms.clearAll((wasCleared) => {
          if (wasCleared) {
            // alert('All bookmark alarm is cleared!');
            chrome.browserAction.setBadgeText({ text: '' });
          } else {
            alert('57:Oops! Error has occured..');
          }
        });
			$('#alarmList').empty();
      $('.row_end__item').hide();
		}
	});

	chrome.storage.onChanged.addListener((changes, namespace) => {
      for (key in changes) {
        chrome.storage.sync.get(key, (result) => {
          if (result[key] === 'fired') {
            let item = $('#' + removeSpecialChar(key));
            item.remove();
            $('.row_end__item').hide();
          }
        });
      }
  }); 

  //load bookmarkBoard
  dumpBookmarks();
}); //end of document.ready()

/**
 * getBookmarkAlarms() returns an <ul> list
 * which is an user added bookmark alarm list
 *
 * @param <{alarmTitle: title, alarmLink: link}> obj
 * @return <ul Element> alarmList
 */
function getBookmarkAlarms(obj) {
  let $alarmList = $('#alarmList');
  //User clicked set alarm button 
	if(obj !== undefined) {
    let title = obj.alarmTitle,
        item = '<li id="'+removeSpecialChar(obj.alarmLink)+'" class="'+ obj.alarmLink+' alarm_item">'
                + title 
                + '<span class="clear"><img src="assets/clear.png" class="option_icon_md"></span>'
                +'</li>'
    $('.row_end__item').show();
		$alarmList.append(item);
	} else {
		chrome.alarms.getAll((Alarms) => {
        for (let i = 0; i < Alarms.length; i++) {
          let link = Alarms[i].name;
          chrome.bookmarks.search(Alarms[i].name, (BookmarkTreeNodes) => {
            let title = BookmarkTreeNodes[0].title,
              item = '<li id="' + removeSpecialChar(link) + '" class="' + link + ' alarm_item">'
                + title
                + '<span class="clear"><img src="assets/clear.png" class="option_icon_md"></span>'
                + '</li>';
            $alarmList.append(item);
          });
        }
      });
	}
	return $alarmList;
}

/**
 * removeSpecialChar() returns a string
 * removed all special characters
 *
 * @param <String> urlId
 * @return <String> 
 */
function removeSpecialChar(urlId){
    return urlId.replace(/[^\w\s]/gi, '');
}

/**
 * dumpBookmarks() calls dumpTreeNodes
 * and get ul list be composed of bookmark items
 *
 * @param <String> query
 */
function dumpBookmarks(query) {
	chrome.bookmarks.getTree(
		function (bookmarkTreeNodes) {
      $('#bookmarkBoard').append(dumpTreeNodes(bookmarkTreeNodes, query));
    });
}

/**
 * dumpTreeNodes() calls dumpNode 
 * and get li element which is bookmark item or directory name
 * 
 * @param <String> query
 * @return <ul element> list
 */
function dumpTreeNodes(bookmarkTreeNodes, query) {
  let $list = $('<ul>');
  if(bookmarkTreeNodes[0].id !== '0') {
    if(bookmarkTreeNodes[0].parentId === '0') 
      $list.addClass('accordion');
    else if(query === undefined || query === '') //no query need to search
      $list.addClass('inner-hide');
    else //has query need to search
      $list.addClass('inner-show');
  }
	for(let i = 0; i < bookmarkTreeNodes.length ; i++) {
    $list.append(dumpNode(bookmarkTreeNodes[i], query));        
  }
  
	return $list;
}

/**
 * dumpNode() returns a bookmark item or a directory
 *
 * @param <ul element> bookmarkNode
 * @param <String> query
 * @return <li element> li
 */
function dumpNode(bookmarkNode, query) {
	let $span = $('<span>'),
	    $directories = $('<span class="directories toggle">'),
	    $bookmarkItem = $('<a class="bookmark_item">');
	if(bookmarkNode.title) {
		if(query && !bookmarkNode.children) {
			if(String(bookmarkNode.title).indexOf(query) == -1) {
				return $('<span></span>');
			}
		}
	}

	//When bookmark has a url, a bookmark. If not it's a title
	if(!bookmarkNode.url) {
		if(bookmarkNode.title === '') {
      $directories.removeClass('toggle');
    } else {
      $directories.text(bookmarkNode.title);
      $span.append($directories);
    }
	} else {
    $bookmarkItem.attr('href', bookmarkNode.url);
    $bookmarkItem.text(bookmarkNode.title);
		$bookmarkItem.off('click').on('click', function() {
			chrome.tabs.create({url: bookmarkNode.url});
		});
		$span.append($bookmarkItem);
	}

	let $li = $(bookmarkNode.title ? '<li>' : '<div>').append($span);
	if(bookmarkNode.children && bookmarkNode.children.length > 0 ) {
		$li.append(dumpTreeNodes(bookmarkNode.children, query));
	}

	/*When hovered item is a folder, show add button 
	 *when it's a bookmark, show alarm button*/
  let $options = bookmarkNode.children ?
		$('<span><span id="addBtn" class="option_btn"><img src="assets/add.png" class="option_icon_md"></span></span>') :
    $('<span id="alarmBtn" class="option_btn"><img src="assets/alarm.png" class="option_icon_md"></span></span>' + 
    '<span id="deleteBtn" class="option_btn"><img src="assets/delete.png" class="option_icon_md"></span> ');
	
  let $alarmOptions = $('<div class="setAlarmPanel">'+
    '<div id="radioBtns">' +
    '<input type="radio" id="15min" name="alarmterm" value="15" checked> <label for="15min">15min</label> <br/>' +
    '<input type="radio" id="30min" name="alarmterm" value="30" > <label for="30min">30min</label> <br/>' +
    '<input type="radio" id="1hr" name="alarmterm" value="60"> <label for="1hr">1hr</label> <br/>' +
    '<input type="radio" id="3hrs" name="alarmterm" value="180"> <label for="3hr">3hrs</label><br> ' +
    '</div> <div id="setBtn">' +
    '<input type="submit" id="setAlarm" class="btn" value="SET"></div></div>');
      
	$span.hover(function () {
    $bookmarkItem.addClass('highlight');
    $span.append($options);

    $('#alarmBtn').off('click').on('click', function () {
        let title = $bookmarkItem.text(),
          link = $bookmarkItem[0].href;
        $span.append($alarmOptions);
        $('#setAlarm').click(() => {
          chrome.alarms.get(link, (alarm) => {
            if (alarm !== undefined) {
              alert('The same alarm is already on you list.');
            } else {
              getAlarmCnt((count) => {
                count++;
                let notificationCnt = count.toString(),
                  alarmTerm = $('input[name=alarmterm]:checked').val(),
                  minutes = parseFloat(alarmTerm);
                chrome.browserAction.setBadgeText({ text: notificationCnt });
                chrome.alarms.create(link, { delayInMinutes: minutes });
                chrome.storage.sync.set({ minutes: minutes });
                alert('You \'ll get alarmed in ' + minutes + 'min about ' + title);
                getBookmarkAlarms({ alarmTitle: title, alarmLink: link });
              });
              chrome.storage.sync.set({ [removeSpecialChar(link)]: 'set' });
            }
          });
        });
      }); //end of alarmBtn click

    $('#addBtn').off('click').on('click', function () {
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
          let currentTab = tabs[0],
            title = currentTab.title,
            url = currentTab.url;
          chrome.bookmarks.create({ parentId: bookmarkNode.id, title: title, url: url }, function (result) {
            if (result.url === url && result.title === title) {
              alert('New bookmark has added!');
              $('#bookmarkBoard').empty();
              dumpBookmarks();
            } else {
              alert('268:Oops! Error has occured..');
            }
          });
        });
      }); //end of addBtn click

    $('#deleteBtn').click(function() {
      if(confirm('Are you sure want to delete this bookmark?')) {
        chrome.bookmarks.remove(String(bookmarkNode.id));
        $span.parent().remove(); 
      } 
    });//end of deleteBtn click
  

    $('.toggle').off('click').on('click', function () {
      let $this = $(this).parent();
    
      if ($this.next().hasClass('show')) { //where ul class is inner
        $this.next().removeClass('show');
      } else {
        $this.parent().parent().find('li .inner-hide').removeClass('show');
        $this.next().toggleClass('show');
      }
    });//end of toggle click
  }, 
	//unhover
	function() {
		$options.remove();
    $alarmOptions.remove();
    $bookmarkItem.removeClass('highlight');
  }).append($bookmarkItem); //end of hover

  return $li;
}

/**
 * getAlarmCnt() is a callback function
 * to get all alarms
 *
 * @param <function> callback
 */
function getAlarmCnt(callback) {
    chrome.alarms.getAll(alarms => {callback(alarms.length) }); 
}