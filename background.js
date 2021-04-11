'use strict';

chrome.alarms.onAlarm.addListener(function (alarm) {
  let title = '';
  let url = '';

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'assets/bookmarkalarm.png',
    title: "Don't forget!",
    message: 'Time to read this bookmark!',
    buttons: [{ title: 'Later' }],
    //requireInteraction: true,
    priority: 0,
  });

  getAlarmCnt(function (count) {
    let notificationCnt = count.toString();
    if (notificationCnt === '0')
      chrome.browserAction.setBadgeText({ text: '' });
    else chrome.browserAction.setBadgeText({ text: notificationCnt });
  });

  chrome.bookmarks.get(alarm.name, function (bookmark) {
    url = bookmark[0].url;
    title = bookmark[0].title;
  });

  setTimeout(function () {
    if (confirm('Would like to read ' + title + '?'))
      window.open(url, '_blank');
  }, 1000);

  // remove the item that the alarm has fired from popup.html
  chrome.storage.local.set({ [alarm.name]: 'fired' });
});

function getAlarmCnt(callback) {
  chrome.alarms.getAll(function (alarms) {
    callback(alarms.length);
  });
}
