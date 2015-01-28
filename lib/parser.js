(function() {
    function createPageParserClass(isUrlAppropriate, isPageAppropriate, extractInformation) {
        return {
            checkUrl: function(url) {
                this.url = url;
                return isUrlAppropriate(url);
            },
            extractInfo: function(page) {
                if (!isPageAppropriate(page)) {
                    return null;
                } else {
                    var result = extractInformation(page);
                    result.url = this.url;
                    return result;
                }
            }
        }
    }

    function createPageParserClassFromRegexp(urlRegexp, pageRegexp, extractInformation) {
        function isUrlAppropriate(url) { 
            return urlRegexp.test(url) 
        }

        function isPageAppropriate(pageContent) { 
            return pageRegexp.test(pageContent) 
        }
        
        return createPageParserClass(isUrlAppropriate, isPageAppropriate, extractInformation);
    }


    function joinParserClasses(parserClassesArray) {
        var result = {
            checkUrl: function(url) {
                this.url = url;
                var appropriateParsers = [];

                for (var i = 0; i < this.subparsers.length; ++i) {
                    if (this.subparsers[i].checkUrl(url)) {
                        appropriateParsers.push(this.subparsers[i]);
                    }
                }
                this.subparsers = appropriateParsers;
                return this.subparsers.length > 0;
            },

            extractInfo: function(page) {
                var result = null;
                for (var i = 0; i < this.subparsers.length && result == null; ++i) {
                    result = this.subparsers[i].extractInfo(page);
                }
                
                if (result != null) {
                    result.url = this.url;
                }

                return result;
            },

            subparsers: []
        };

        for (var i = 0; i < parserClassesArray.length; ++i) {
            if (parserClassesArray[i].hasOwnProperty("subparsers")) {
                result.subparsers = result.subparsers.concat(parserClassesArray[i].subparsers);
            } else {
                result.subparsers.push(parserClassesArray[i]);
            }
        }

        return result;
    }

    function createParserInstance(parserClass) {
        return Object.create(parserClass);
    }

    function downloadAndParsePage(parserClass) {
        return function(pageURL, callback) {
            var parser = createParserInstance(parserClass);
            var downloadURL = pageURL;

            if (pageURL.search("tbooklist") !== -1) {
                downloadURL = pageURL.match(/\/to\/.*$/)[0];
                downloadURL = downloadURL.slice(4);
            }

            console.log("parser: downloadURL = " + downloadURL);
            if (parser.checkUrl(pageURL)) {
                request = require("sdk/request").Request({
                    url: downloadURL,
                    onComplete: function(response) {
                        console.log("parser: downloading pageURL = " + pageURL);

                        if (response.status != 200) {
                            console.log("parser: http error url = " + pageURL + " status = " + response.status);
                            callback(null);
                            return;
                        }

                        console.log("parser: page received");
                        callback(parser.extractInfo(response.text));
                    }
                });

                request.get();
            } 
        }
    }

    var samlibBookPageParser = createPageParserClassFromRegexp(/samlib/, /Размещен: \d+\/\d+\/\d+, изменен: \d+\/\d+\/\d+./, function(page) {
        var result = {};
        result.type = "samlibBookPage";

        result.totalSize = page.match(/\d+k\./)[0];
        result.totalSize = parseInt(result.totalSize.slice(0, -2));

        result.authorName = page.match(/<h3>[^<]*/)[0];
        result.authorName = result.authorName.slice(4, -2);

        result.bookName = page.match(/<h2>[^<]*/)[0];
        result.bookName = result.bookName.slice(4);

        return result;
    });

    var samlibAuthorPageParser = createPageParserClassFromRegexp(/samlib/, /Объем:/, function(page) {
        var result = {};
        result.type = "samlibAuthorPage";

        result.totalSize = page.match(/\d+k\/\d/)[0];
        result.totalSize = parseInt(result.totalSize.slice(0, -3));

        result.authorName = page.match(/<h3>[^<]*/)[0];
        result.authorName = result.authorName.slice(4, -1);

        return result;
    });

    var ficbookBookParser = createPageParserClassFromRegexp(/ficbook/, /Найти фанфик по вкусу/, function(page) {
        var result = {};
        result.type = "ficbookBookPage";

        result.totalSize = page.match(/\d+\s+страниц/)[0];
        result.totalSize = parseInt(result.totalSize.match(/\d+/)[0]);

        result.bookName = page.match(/<h1>[^<]*(?=<)/)[0];
        result.bookName = result.bookName.slice(4).trim();

        result.authorName = page.match(/Автор:(<[^<]*){2}/)[0];
        result.authorName = result.authorName.match(/[^>]*$/)[0];

        return result;
    });

    exports.parserClass = joinParserClasses([samlibBookPageParser, samlibAuthorPageParser, ficbookBookParser]);
    exports.createParserInstance = createParserInstance;
    exports.downloadAndparse = downloadAndParsePage(exports.parserClass);
})();
