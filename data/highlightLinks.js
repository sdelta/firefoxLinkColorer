console.log('worker created...');

var samlibLinks = {};
var coloredLinks = [];

function colorElem(elem, color) {
    coloredLinks.push(elem);

    var fontNode = document.createElement("FONT");
    
    fontNode.setAttribute("color", color);

    for (var j = 0; j < elem.childNodes.length; ++j) {
        fontNode.appendChild(elem.childNodes[j]);
    }

    while (elem.childNodes.length > 0) {
        elem.removeChild(elem.firstChild);
    }

    elem.appendChild(fontNode);
}

function uncolorAll() {
    for (var i = 0; i < coloredLinks.length; ++i) {

        for (var j = 0; j < coloredLinks[i].firstChild.childNodes.length; ++j) {
            coloredLinks[i].appendChild(coloredLinks[i].firstChild.childNodes[j]);
        }

        coloredLinks[i].removeChild(coloredLinks[i].firstChild);
    }

    coloredLinks = [];
}


self.port.on("color", function(payload) {
    console.log("highlighter: message color received");

    for (var i = 0; i < samlibLinks[payload.url].length; ++i) {
        if (payload.type == "authorPage") {
            colorElem(samlibLinks[payload.url][i], "green");
        } else {
            colorElem(samlibLinks[payload.url][i], "red");
        }
    }
});

self.port.on("update", function() {
    console.log("highlighter: update message received");
    console.log("highlighter: samlibLinks.length = " + samlibLinks.length);
    uncolorAll();

    var result = [];
    for (var url in samlibLinks) {
        result.push(url);
        console.log("highlighter: result.push(" + url +")");
    }

    self.port.emit("links", result)
});

self.port.on("scan", function() {
    console.log('highlighter: message "scan" received');
    var lst = document.links;
    var result = [];

    for (var i = 0; i < lst.length; i++) {
        if (lst[i].href.indexOf("samlib.ru") > -1) {
            if (samlibLinks.hasOwnProperty(lst[i].href)) {
                samlibLinks[lst[i].href].push(lst[i]);
            } else {
                samlibLinks[lst[i].href] = [lst[i]];
                result.push(lst[i].href);
            }
        }
    }

    self.port.emit("links", result);
});

