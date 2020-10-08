$(function() {
    $('#search').change(function() {
        $('#bookmarks').empty();
        dumpBookmarks($('#search').val());
    });
});

document.addEventListener('DOMContentLoaded', function() {
    dumpBookmarks();
});

function dumpBookmarks(query) {
    let bookmarkTreeNodes = chrome.bookmarks.getTree(
        function(bookmarkTreeNodes) {
            $('#bookmarks').append(dumpTreeNodes(bookmarkTreeNodes, query));
        }
    );
    
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
    if(bookmarkNode.title) {
        if(query && !bookmarkNode.children) {
            if(String(boomarkNode.title).indexOf(query) == -1) {
                return $('<span></span>');
            }
        }
    }
    let span = $('<span>');

    //When bookmark has a url, a bookmark. If not it's a title
    if(!bookmarkNode.url) {
        let h4 = $('<h4>');
        h4.text(bookmarkNode.title);
        span.append(h4);
    } else {
        let anchor = $('<a>');
        anchor.attr('href', bookmarkNode.url);
        anchor.text(bookmarkNode.title);
        anchor.click(function() {
            chrome.tabs.create({url: bookmarkNode.url});
        });
        span.append(anchor);
    }

    
    let li = $(bookmarkNode.title ? '<li>' : '<div>').append(span);
    if(bookmarkNode.children && bookmarkNode.children.length > 0) {
        li.append(dumpTreeNodes(bookmarkNode.children, query));
    }
    return li;
}