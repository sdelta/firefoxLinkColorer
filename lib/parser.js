function createPageParser(isUrlAppropriate, isPageAppropriate, extractInformation) {
    return {
        isUrlAppropriate: isUrlAppropriate,
        isPageAppropriate: isPageAppropriate,
        extractInformation: extractInformation
    }
}

function createPageParserFromRegexp(urlRegexp, pageRexexp, extractInformation) {
    function isUrlAppropriate(url) { 
        return urlRegexp.test(url) 
    };

    function isPageAppropriate(pageContent) { 
        return pageRexexp.test(pageContent) 
    };
    
    return createPageParser(isUrlAppropriate, isPageAppropriate, extractInformation);
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

                    console.log("parser: page received");
                    var result;

                    for (var i = 0; i < appropriateParsers.length; ++i) {
                        if (appropriateParsers[i].isPageAppropriate(page)) {
                            result = appropriateParsers[i].extractInformation(page);
                            break;
                        }
                    }
                    
                    if (result == undefined) {
                        console.log("parser: WARNING! parsers url test passed but parsers page test don't");
                        return;
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

var ficbookBookParser = createPageParserFromRegexp(/ficbook/, /Найти фанфик по вкусу/, function(page) {
    var size = page.match(/\d+\s+страниц/)[0];
    size = parseInt(size.match(/\d+/)[0]);
    console.log("parser: size of ficbook = " + size);
    return {
        type: "ficbookPage",
        totalSize: size
    };
});


exports.parseURL = joinParsers([samlibBookPageParser, samlibAuthorPageParser, ficbookBookParser]);
