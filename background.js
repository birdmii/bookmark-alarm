'use strict';

chrome.alarms.onAlarm.addListener(function(alarm) {
  let title = '';
    
  chrome.notifications.create({
    type:     'basic',
    iconUrl:  'assets/bookmarkalarm.png',
    title:    'Don\'t forget!',
    message:  'Time to read this bookmark!',
    buttons: [
      {title: 'Later'}
    ],
    //requireInteraction: true,
    priority: 0});

  getAlarmCnt(function(count) {
    let notificationCnt = count.toString();
    if(notificationCnt === '0') 
        chrome.browserAction.setBadgeText({text: ''});
    else 
        chrome.browserAction.setBadgeText({text: notificationCnt});
  });

  chrome.bookmarks.search(alarm.name, function(BookmarkTreeNodes) {
    title = BookmarkTreeNodes[0].title;
  });
  chrome.storage.sync.set({[removeSpecialChar(alarm.name)]: "fired"});

  setTimeout(function(){ 
    if(confirm("Would like to read " + title + "?"))    
      window.open(alarm.name, '_blank'); }, 2000);
  //ADD: remove the item that the alarm has fired from popup.html
});

function getAlarmCnt(callback) {
  chrome.alarms.getAll(function(alarms) { callback(alarms.length) }); 
}

function removeSpecialChar(urlId){
  return urlId.replace(/[^\w\s]/gi, '');
}