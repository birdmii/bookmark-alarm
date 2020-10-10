'use strict';

chrome.alarms.onAlarm.addListener(function(alarm) {
    let title = '';
    chrome.browserAction.setBadgeText({text: ''});
    chrome.notifications.create({
        type:     'basic',
        iconUrl:  'bookmarkalarm.png',
        title:    'Don\'t forget!',
        message:  'Time to read this bookmark!',
        buttons: [
          {title: 'Later'}
        ],
        //requireInteraction: true,
        priority: 0});

    chrome.bookmarks.search(alarm.name, function(BookmarkTreeNodes) {
        title = BookmarkTreeNodes[0].title;
    });
    setTimeout(function(){ 
        if(confirm("Would like to read " + title + "?"));    
            window.open(alarm.name, '_blank'); }, 2000);
  });