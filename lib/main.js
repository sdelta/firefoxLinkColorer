var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');
var pageMod = require('sdk/page-mod')
var data = require('sdk/self').data;
var array = require('sdk/util/array');
var storage = require('sdk/simple-storage').storage;

var pageWorkers = [];

if (!storage.hasOwnProperty("cache")) {
    storage.cache = { };
}

if (!storage.hasOwnProperty("properties")) {
    storage.properties = { 
        authorPageMinSize: 600,
        bookPageMinSize: 450,
        ficbookPageMinSize: 150,
        colorOfLinkToBookPage: "FF0000",
        colorOfLinkToAuthorPage: "33FF00",
        colorOfLinkToFicbookPage: "FF00BB"
    };
}

pageMod.PageMod({
    include: "*",
    contentScriptFile: data.url('highlightLinks.js'),
    attachTo: "top",
    onAttach: function(worker) {
        console.log("main: attached worker to " + worker.tab.id + " tab");

        array.add(pageWorkers, worker);

        worker.on('pageshow', function() { 
            array.add(pageWorkers, this); 
        });

        worker.on('pagehide', function() { 
            array.remove(pageWorkers, this); 
        });

        worker.on('detach', function() { 
            worker.destroy();
            array.remove(pageWorkers, this); 
        });

        worker.port.on("links", function(payload) {
            console.log("main: message from scanning links worker received");

            for (var i = 0; i < payload.length; ++i) {
                if (storage.cache.hasOwnProperty(payload[i])) {
                    if (shouldBeColored(storage.cache[payload[i]])) {
                        worker.port.emit("color", storage.cache[payload[i]], storage.properties);
                    }
                } else {
                    getPageInfo(payload[i], worker);
                }
            }
        });
    }

})

function getPageInfo(pageURL, destination) {
    function callback(payload) {
        console.log("main: executing callback");
        storage.cache[payload.url] = payload;
        if (shouldBeColored(payload)) {
            destination.port.emit("color", payload, storage.properties);
        }
    }

    require("parser.js").parseURL(pageURL, callback); 
}


var buttonHighlight = buttons.ActionButton({
    id: "highlight_links",
    label: "samlib highlight",
    icon: { 
        "16": "./icons/icon-16.png",
        "32": "./icons/icon-32.png",
        "64": "./icons/icon-64.png"
    },
    onClick: function() {
        var currentTab = tabs.activeTab.id;

        console.log("main: sending message to tab " + currentTab);

        for (var i = 0; i < pageWorkers.length; ++i) {
            if (pageWorkers[i].tab.id == currentTab) {
                console.log("main: workers of " + currentTab + " found");
                pageWorkers[i].port.emit("scan");
            }
        }
    }
});


var propertiesPanel = require("sdk/panel").Panel({
    height: 300,
    width: 500,
    contentURL: data.url("properties.html"),
    contentScriptFile: [data.url("jquery-2.1.1.js"), data.url("colpick/colpick.js"), data.url("propertiesScript.js")]
});

propertiesPanel.port.on("setProperties", function(arg) {
    console.log("main: message \"setProperties\" received");
    console.log("main: arg.bookPage = " + arg.bookPageMinSize);
    console.log("main: arg.authorPage = " + arg.authorPageMinSize);
    storage.properties = arg;
});

propertiesPanel.port.on("applyProperties", function() {
    for (i = 0; i < pageWorkers.length; ++i) {
        pageWorkers[i].port.emit("update");
    }
});

var buttonPopup = buttons.ActionButton({
    id: "openPopup",
    label: "open properties",
    icon: {
        "16": "./icons/icon-properties-16.png",
        "32": "./icons/icon-properties-32.png",
        "64": "./icons/icon-properties-64.png"
    },

    onClick: function() {
        propertiesPanel.show();

        propertiesPanel.port.emit("properties", storage.properties);
    }
});

var buttonClearCache = buttons.ActionButton({
    id: "clearCache",
    label: "clear cache",
    icon: {
        "16": "./icons/icon-clear-16.png",
        "32": "./icons/icon-clear-32.png",
        "64": "./icons/icon-clear-64.png"
    },
    onClick: function() {
        storage.cache = {};
    }
});

function shouldBeColored(elem) {
    var isGoodAuthor =  elem.type == "authorPage" && elem.totalSize >= storage.properties.authorPageMinSize;
    var isGoodBook =    elem.type == "bookPage" && elem.totalSize >= storage.properties.bookPageMinSize;
    var isGoodFicbook = elem.type == "ficbookPage" && elem.totalSize >= storage.properties.ficbookPageMinSize;

    return isGoodAuthor || isGoodBook || isGoodFicbook;
}
