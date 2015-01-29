var buttons = require('sdk/ui/button/action');
var tabs = require('sdk/tabs');
var pageMod = require('sdk/page-mod');
var data = require('sdk/self').data;
var array = require('sdk/util/array');
var storage = require('sdk/simple-storage').storage;
var parserModule = require("parser.js");
var ajaxModule = require("ajax.js");

var pageWorkers = [];

var Q = require("Q/q.js");

if (!storage.hasOwnProperty("cache")) {
    storage.cache = {};
}

if (!storage.hasOwnProperty("properties")) {
    storage.properties = { 
        samlibAuthorPageMinSize: 600,
        samlibBookPageMinSize: 450,
        ficbookBookPageMinSize: 150,
        colorOfLinkToSamlibBookPage: "FF0000",
        colorOfLinkToSamlibAuthorPage: "33FF00",
        colorOfLinkToFicbookBookPage: "FF00BB"
    };
}

pageMod.PageMod({
    include: "*",
    contentScriptFile: [data.url("nanobar.min.js"), data.url('highlightLinks.js')],
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
            function checkAndSignal(info) {
                if (shouldBeColored(info)) {
                    worker.port.emit("color", info, storage.properties);
                }
            }

            console.log("main: message from scanning links worker received");
            payload = payload.filter(function(pageURL) {
                var parser = parserModule.createParserInstance(parserModule.parserClass);
                return parser.checkUrl(pageURL);
            });
            
            payload.filter(isCached).forEach(function(pageURL) {
                var info = getFromCache(pageURL);
                checkAndSignal(info);
            });

            var notCachedPages = payload.filter(function (pageURL) {
                return !isCached(pageURL);
            });


            var serverResponsePromise = ajaxModule.getInfoFromServer(notCachedPages);

            // transfrom server responce into 2 promises of array
            var cachedInfoListPromise = serverResponsePromise.get("foundList").then(function(obj) {
                return Object.keys(obj).map(function(key) {
                    return obj[key];
                });
            });

            var restLinksListPromise = serverResponsePromise.get("notFoundList").then(function(obj) {
                return Object.keys(obj).map(function(key) {
                    return obj[key];
                });
            });


            cachedInfoListPromise.invoke("forEach", function(info) {
                addToCache(info);
                checkAndSignal(info);
            });

            restLinksListPromise.get("length").then(function(len) {
                console.log("main: sending message 'numberOfShares' with len = " + len);
                worker.port.emit("numberOfShares", len);
            });

            
            restLinksListPromise.invoke("forEach", function(pageURL) {
                console.log("starting to process url = " + pageURL);
                var promise = parserModule.downloadAndParse(pageURL);
                promise.then(checkAndSignal)
                promise.then(addToCache)
                promise.then(ajaxModule.giveInfoToServer)
                promise.fail(function(reason) {
                        console.log("cannot process page: " + pageURL);
                        console.log("reason: " + reason);
                });
                promise.fin(function() {
                    worker.port.emit("shiftProgressBar");        
                });
            });
        });
    }
});

function isCached(pageURL) {
    return storage.cache.hasOwnProperty(pageURL);
}

function addToCache(info) {
   storage.cache[info.url] = info; 
}

function getFromCache(pageURL) {
    return storage.cache[pageURL];
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
    var isGoodAuthor =  elem.type == "samlibAuthorPage" && elem.totalSize >= storage.properties.samlibAuthorPageMinSize;
    var isGoodBook =    elem.type == "samlibBookPage" && elem.totalSize >= storage.properties.samlibBookPageMinSize;
    var isGoodFicbook = elem.type == "ficbookBookPage" && elem.totalSize >= storage.properties.ficbookBookPageMinSize;

    return isGoodAuthor || isGoodBook || isGoodFicbook;
}
