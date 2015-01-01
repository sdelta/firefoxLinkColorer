function createPageParser(isUrlAppropriate, isPageAppropriate, extractInformation, mark) {
    return {
        isUrlAppropriate: isUrlAppropriate,
        isPageAppropriate: isPageAppropriate,
        extractInformation: extractInformation,
        mark: mark
    }
}

function createPageParserFromRegexp(urlRegexp, pageRexexp, extractInformation, mark) {
    function isUrlAppropriate(url) { 
        return urlRegexp.test(url) 
    };

    function isPageAppropriate(pageContent) { 
        return pageRexexp.test(pageContent) 
    };
    
    return createPageParser(isUrlAppropriate, isPageAppropriate, extractInformation, mark);
}

function joinParsers(parsersArray) {
    return function(pageURL, callback) {
        var appropriateParsers = [];
        for (var i = 0; i < parsersArray.length; ++i) {
            if (parsersArray[i].isUrlAppropriate(pageURL)) {
                appropriateParsers.push(parsersArray[i]);
            }
        }

        if (appropriateParsers.length > 0) {
            request = require("sdk/request").Request({
                url: pageURL,
                onComplete: function(response) {
                    console.log("downloading pageURL = " + pageURL);
                    page = response.text;

                    if (response.status != 200) {
                        console.log("parser: http error url = " + pageURL + " status = " + response.status);
                        return;
                    }

                    console.log("parser: page received page");
                    var result;

                    for (var i = 0; i < appropriateParsers.length; ++i) {
                        if (appropriateParsers[i].isPageAppropriate(page)) {
                            result = appropriateParsers[i].extractInformation(page);
                            break;
                        }
                    }

                    result.url = pageURL;
                    callback(result);
                }
            });

            request.get();
        }
    }
}

var samlibBookPageParser = createPageParserFromRegexp(/samlib/, /Размещен: \d+\/\d+\/\d+, изменен: \d+\/\d+\/\d+./, function(page) {
    var size = page.match(/\d+k\./)[0];
    size = parseInt(size.slice(0, size.length - 2));
    console.log("parser: size of book = " + size);
    return { 
        type: "bookPage",
        totalSize: size, 
    };
});

var samlibAuthorPageParser = createPageParserFromRegexp(/samlib/, /Объем:/, function(page) {
    var size = page.match(/\d+k\/\d/)[0];
    size = parseInt(size.slice(0, size.length - 3));
    console.log("parser: total size of all books on author page = " + size);

    return {
        type: "authorPage",
        totalSize: size,
    };
});



exports.parseURL = joinParsers([samlibBookPageParser, samlibAuthorPageParser]);
