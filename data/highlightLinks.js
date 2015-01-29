console.log('worker created...');

var samlibLinks = {};
var coloredLinks = [];
var progressBar = {
    bar: new Nanobar({targer: null})
};

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

self.port.on("numberOfShares", function(number) {
    progressBar.numberOfShares = number;
    progressBar.numberOfProcessedShares = 0;
});

self.port.on("shiftProgressBar", function() {
    console.log("highlighter: shifting progressBar");
    ++progressBar.numberOfProcessedShares;
    var percent = (progressBar.numberOfProcessedShares / progressBar.numberOfShares) * 100;
    progressBar.bar.go(Math.round(percent));
});

self.port.on("color", function(payload, properties) {
    console.log("highlighter: message color received URL = " + payload.url);

    for (var i = 0; i < samlibLinks[payload.url].length; ++i) {
        if (payload.type == "samlibBookPage"){
            colorElem(samlibLinks[payload.url][i], "#" + properties.colorOfLinkToSamlibBookPage);
        } else if (payload.type == "samlibAuthorPage") {
            colorElem(samlibLinks[payload.url][i], "#" + properties.colorOfLinkToSamlibAuthorPage);
        } else {
            colorElem(samlibLinks[payload.url][i], "#" + properties.colorOfLinkToFicbookBookPage);
        }
    }
});

self.port.on("update", function() {
    console.log("highlighter: update message received");
    uncolorAll();

    self.port.emit("links", Object.keys(samlibLinks))
});

self.port.on("scan", function() {
    console.log('highlighter: message "scan" received');


    var lst = document.links;
    var result = [];

    for (var i = 0; i < lst.length; i++) {
        if (samlibLinks.hasOwnProperty(lst[i].href)) {
            samlibLinks[lst[i].href].push(lst[i]);
        } else {
            samlibLinks[lst[i].href] = [lst[i]];
            result.push(lst[i].href);
        }
    }

    self.port.emit("links", result);
});

