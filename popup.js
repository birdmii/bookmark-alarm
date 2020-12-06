window.addEventListener('DOMContentLoaded', (event) => {
  //load bookmarkBoard
  dumpBookmarks();

  //load alarmBoard
  getAlarmCnt((count) => {
    if (count !== 0) {
      toggleAlarmBoardTitle(true);
      const alarmList = getBookmarkAlarms();
      document.getElementById('alarmcontent').append(alarmList);
    }
  });

  //search a bookmark
  const searchBar = document.getElementById('searchBar');
  searchBar.addEventListener('change', (event) => {
    emptyObj('bookmarkBoard');
    dumpBookmarks(searchBar.value);
  });

  //clear an alarm
  const alarmItems = document.getElementById('alarmList');
  alarmItems.addEventListener('click', (event) => {
    if (event.target && event.target.matches('img')) {
      const alarmItem = event.target.parentElement.parentElement;
      const link = alarmItem.classList[0];
      let isLeft = true;

      getAlarmCnt((count) => {
        count === 0 ? 0 : count--;
        const notificationCnt = count.toString();
        if (notificationCnt === '0') {
          chrome.browserAction.setBadgeText({ text: '' });
          isLeft = false;
        } else chrome.browserAction.setBadgeText({ text: notificationCnt });

        chrome.alarms.clear(link, (wasCleared) => {
          if (wasCleared) {
            alarmItem.remove();
            if (!isLeft) {
              toggleAlarmBoardTitle(false);
            }
            showAlert(
              'success',
              'The bookmark alarm has removed successfully!',
            );
          } else {
            showAlert('fail', '42:Oops! Error has occured..');
          }
        });
      });
    }
  });

  //clear all alarm
  const $alarmBoardClear = document.getElementById('alarmBoardClear');
  if ($alarmBoardClear) {
    $alarmBoardClear.addEventListener('click', (event) => {
      if (confirm('Are you sure clear all bookmark alarm?')) {
        chrome.alarms.clearAll((wasCleared) => {
          if (wasCleared) {
            showAlert('success', 'All bookmark alarm is cleared!');
            chrome.browserAction.setBadgeText({ text: '' });
          } else {
            showAlert('fail', '56:Oops! Error has occured..');
          }
        });
        emptyObj('alarmList');
        toggleAlarmBoardTitle(false);
      }
    });
  }

  chrome.storage.onChanged.addListener((changes, namespace) => {
    for (key in changes) {
      chrome.storage.sync.get(key, (result) => {
        if (result[key] === 'fired') {
          let item = document.getElementById(removeSpecialChar(key));
          item.remove();
        }
        getAlarmCnt((count) => {
          if (count === 0) {
            toggleAlarmBoardTitle(false);
          }
        });
      });
    }
  });
});

/**
 * getBookmarkAlarms() returns an <ul> list
 * which is an user added bookmark alarm list
 *
 * @return {ul Element} alarmList
 */
function getBookmarkAlarms() {
  let $alarmList = document.getElementById('alarmList');

  //User clicked set alarm button
  chrome.alarms.getAll((Alarms) => {
    for (let i = 0; i < Alarms.length; i++) {
      const link = Alarms[i].name;
      chrome.bookmarks.search(Alarms[i].name, (BookmarkTreeNodes) => {
        const title = BookmarkTreeNodes[0].title,
          $item = createAlarmItem(link, title);
        $alarmList.append($item);
      });
    }
  });
  return $alarmList;
}

/**
 * setBookmarkAlarms() adds new bookmark alarm item
 *
 * @param {alarmTitle: title, alarmLink: link} obj
 */
function setBookmarkAlarms(obj) {
  let $alarmList = document.getElementById('alarmList');
  let $item = createAlarmItem(obj.alarmLink, obj.alarmTitle);

  toggleAlarmBoardTitle(true);
  $alarmList.append($item);
}

/**
 * Creates an alarm item
 * @param {String} link
 * @param {String} title
 * @return {li object}
 */
function createAlarmItem(link, title) {
  let $item = document.createElement('li');
  $item.id = removeSpecialChar(link);
  $item.classList.add(`${link}`, 'alarm_item');
  $item.innerHTML =
    title +
    '<span class="clear"><img src="assets/clear.png" class="option_icon_md"></span>';

  return $item;
}

/**
 * toggle display value(block <-> none) of .row_end__item class
 * @param {boolean} isShow
 */
function toggleAlarmBoardTitle(isShow) {
  document.querySelectorAll('.row_end__item').forEach((item) => {
    item.style.display = isShow ? 'block' : 'none';
  });
}
/**
 * removeSpecialChar() returns a string
 * removed all special characters
 *
 * @param {String} urlId
 * @return {String}
 */
function removeSpecialChar(urlId) {
  return urlId.replace(/[^\w\s]/gi, '');
}

/**
 * Get element id and remove empty the element
 * @param {String} el
 */
function emptyObj(el) {
  const element = document.getElementById(el);
  //empty
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
}

/**
 * dumpBookmarks() calls dumpTreeNodes
 * and get ul list be composed of bookmark items
 *
 * @param {String} query
 */
async function dumpBookmarks(query) {
  chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
    let $bookmarkBoard = document.getElementById('bookmarkBoard');
    $bookmarkBoard.append(dumpTreeNodes(bookmarkTreeNodes, query));
  });
}

/**
 * dumpTreeNodes() calls dumpNode
 * and get li element which is bookmark item or directory name
 *
 * @param {String} query
 * @return {ul element} list
 */
function dumpTreeNodes(bookmarkTreeNodes, query) {
  let $list = document.createElement('ul');
  if (bookmarkTreeNodes[0].id !== '0') {
    if (bookmarkTreeNodes[0].parentId === '0') $list.classList.add('accordion');
    else if (query === undefined || query === '')
      //no query need to search
      $list.classList.add('inner-hide');
    //has query need to search
    else $list.classList.add('inner-show');
  }
  //CHECKOUT
  for (let i = 0; i < bookmarkTreeNodes.length; i++) {
    $list.append(dumpNode(bookmarkTreeNodes[i], query));
  }

  return $list;
}

/**
 * dumpNode() returns a bookmark item or a directory
 *
 * @param {ul element} bookmarkNode
 * @param {String} query
 * @return {li element} li
 */
function dumpNode(bookmarkNode, query) {
  let $span = document.createElement('span');
  $span.classList.add('item');

  let $directories = document.createElement('span');
  $directories.classList.add('directories', 'toggle');

  let $bookmarkItem = document.createElement('a');
  $bookmarkItem.classList.add('bookmark_item');

  if (bookmarkNode.title) {
    if (query && !bookmarkNode.children) {
      if (String(bookmarkNode.title).indexOf(query) == -1) {
        return document.createElement('span');
      }
    }
  }

  //When bookmark has a url, a bookmark. If not it's a title
  if (!bookmarkNode.url) {
    if (bookmarkNode.title === '') {
      $directories.classList.remove('toggle');
    } else {
      $directories.innerText = bookmarkNode.title;
      $span.append($directories);
    }
  } else {
    $bookmarkItem.setAttribute('href', bookmarkNode.url);
    $bookmarkItem.innerText = bookmarkNode.title !== '' ? bookmarkNode.title : 'untitled';

    $bookmarkItem.addEventListener('click', (event) => {
      chrome.tabs.create({ url: bookmarkNode.url });
    });
    $span.append($bookmarkItem);
  }

  let $li = bookmarkNode.title
    ? document.createElement('li')
    : document.createElement('div');
  $li.append($span);
  if (bookmarkNode.children && bookmarkNode.children.length > 0) {
    $li.append(dumpTreeNodes(bookmarkNode.children, query));
  }

  /*When hovered item is a folder, show add button
   *when it's a bookmark, show alarm button*/
  let $options = document.createElement('span');
  if (bookmarkNode.children) {
    // $options = document.createElement('span');
    $options.innerHTML =
      '<span id="addBtn" class="option_btn"><img src="assets/add.png" class="option_icon_lg"></span>';
  } else {
    //create alarmBtn
    let $alarmBtn = document.createElement('span');
    $alarmBtn.id = 'alarmBtn';
    $alarmBtn.classList.add('option_btn');
    $alarmBtn.innerHTML = '<img src="assets/alarm.png" class="option_icon_md">';

    //create deleteBtn
    let $deleteBtn = document.createElement('span');
    $deleteBtn.id = 'deleteBtn';
    $deleteBtn.classList.add('option_btn');
    $deleteBtn.innerHTML =
      '<img src="assets/delete.png" class="option_icon_md">';

    $options.append($alarmBtn);
    $options.append($deleteBtn);
  }

  let $alarmOptions = document.createElement('div');
  $alarmOptions.classList.add('setAlarmPanel');
  $alarmOptions.innerHTML =
    '<div id="radioBtns">' +
    '<input type="radio" id="15min" name="alarmterm" value="0.1" checked> <label for="15min">15min</label> <br/>' +
    '<input type="radio" id="30min" name="alarmterm" value="30" > <label for="30min">30min</label> <br/>' +
    '<input type="radio" id="1hr" name="alarmterm" value="60"> <label for="1hr">1hr</label> <br/>' +
    '<input type="radio" id="3hrs" name="alarmterm" value="180"> <label for="3hr">3hrs</label><br> ' +
    '</div> <div id="setBtn">' +
    '<input type="submit" id="setAlarm" class="btn" value="SET"></div>';

  $span.addEventListener('mouseenter', (event) => {
    $span.append($options);
    event.stopPropagation();

    let $this = event;
    if ($this.target.children[0].classList[0] === 'bookmark_item') {
      $this.target.children[0].classList.add('highlight');
    }
    /* reference 
      if ($this.target.children[0].matches('span') && $this.target && $this.target.matches('span.item')) {

      }
    */
    let $alarmBtn = document.getElementById('alarmBtn');
    // console.log($alarmBtn);
    if ($alarmBtn) {
      $alarmBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const title = $bookmarkItem.innerText,
          link = $bookmarkItem.getAttribute('href');
        $span.append($alarmOptions);

        const $setAlarm = document.getElementById('setAlarm');
        $setAlarm.addEventListener('click', (event) => {
          event.stopPropagation();
          event.stopImmediatePropagation();
          chrome.alarms.get(link, (alarm) => {
            if (alarm !== undefined) {
              showAlert('warning', 'The same alarm is already on you list.');
            } else {
              getAlarmCnt((count) => {
                count++;
                const notificationCnt = count.toString(),
                  alarmTerm = document.querySelector(
                    'input[name="alarmterm"]:checked',
                  ).value,
                  minutes = parseFloat(alarmTerm);
                chrome.browserAction.setBadgeText({ text: notificationCnt });
                chrome.alarms.create(link, { delayInMinutes: minutes });
                // chrome.storage.sync.set({ minutes: minutes });
                showAlert(
                  'success',
                  `You 'll get alarmed in ${minutes}min about ${title}`,
                );
                setBookmarkAlarms({ alarmTitle: title, alarmLink: link });
              });
              chrome.storage.sync.set({ [removeSpecialChar(link)]: 'set' });
            }
          });
        }); // end of setAlarm click event
      }); // end of alarm icon click event
    }

    const $addBtn = document.getElementById('addBtn');
    if ($addBtn) {
      $addBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
          const currentTab = tabs[0],
            title = currentTab.title,
            url = currentTab.url;
          chrome.bookmarks.create(
            { parentId: bookmarkNode.id, title: title, url: url },
            (result) => {
              if (result.url === url && result.title === title) {
                showAlert('success', 'New bookmark has added!');
                emptyObj('boomarkBoard');
                dumpBookmarks();
              } else {
                showAlert('fail', '268:Oops! Error has occured..');
              }
            },
          );
        });
      }); // end of create bookmark icon click event
    }

    let $deleteBtn = document.getElementById('deleteBtn');
    if ($deleteBtn) {
      $deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        event.stopImmediatePropagation();
        if (confirm('Are you sure want to delete this bookmark?')) {
          showAlert('success', 'Bookmark has deleted!');
          chrome.bookmarks.remove(String(bookmarkNode.id));
          $span.remove();
        }
      }); //end of delete icon click event
    }

    const toggleItem = document.querySelectorAll('.toggle');
    if (toggleItem) {
      toggleItem.forEach((item) => {
        item.addEventListener('click', (event) => {
          event.stopPropagation();
          event.stopImmediatePropagation();
          const $targetElement = event.target.parentElement.nextSibling;
          if ($targetElement.classList.contains('inner-hide')) {
            $targetElement.classList.remove('inner-hide');
            $targetElement.classList.add('inner-show');
          } else {
            $targetElement.classList.remove('inner-show');
            $targetElement.classList.add('inner-hide');
          }

          //  jQuery Code
          // if ($this.next().hasClass('show')) {
          //   //where ul class is inner
          //   $this.next().removeClass('show');
          // } else {
          //   $this.parent().parent().find('li .inner-hide').removeClass('show');
          //   $this.next().toggleClass('show');
          // }
        });
      });
    }
  }); // end of mouseenter event

  //unhover
  $span.addEventListener('mouseleave', (event) => {
    let $this = event;
    $options.remove();
    $alarmOptions.remove();
    $this.target.children[0].classList.remove('highlight');
  });

  return $li;
}

/**
 * getAlarmCnt() is a callback function
 * to get all alarms
 *
 * @param {function} callback
 */
function getAlarmCnt(callback) {
  chrome.alarms.getAll((alarms) => {
    callback(alarms.length);
  });
}

/**
 * showAlert() shows result of user's action
 * on the top of the page
 *
 * @param {String} className
 * @param {String} message
 */
function showAlert(className, message) {
  const $messageContainer = document.createElement('div');
  $messageContainer.classList.add('alert', `alert-${className}`);

  const $message = document.createTextNode(`${message}`);
  $messageContainer.appendChild($message);

  const $searchBoard = document.getElementById('searchBoard');
  $searchBoard.before($messageContainer);

  setTimeout(() => document.querySelector('.alert').remove(), 1500);
}
