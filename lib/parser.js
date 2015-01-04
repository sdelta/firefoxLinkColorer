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

    function createPageParserClassFromRegexp(urlRegexp, pageRexexp, extractInformation) {
        function isUrlAppropriate(url) { 
            return urlRegexp.test(url) 
        }

        function isPageAppropriate(pageContent) { 
            return pageRexexp.test(pageContent) 
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
        return function(pageURL, callback, callAnyway) {
            var parser = createParserInstance(parserClass);
            if (parser.checkUrl(pageURL)) {
                request = require("sdk/request").Request({
                    url: pageURL,
                    onComplete: function(response) {
                        callAnyway();
                        console.log("downloading pageURL = " + pageURL);

                        if (response.status != 200) {
                            console.log("parser: http error url = " + pageURL + " status = " + response.status);
                            return;
                        }

                        console.log("parser: page received");
                        
                        var result = parser.extractInfo(response.text);
                        if (result != null) {
                            callback(result);
                        }
                    }
                });

                request.get();
            } else {
                callAnyway();
            }
        }
    }

    var samlibBookPageParser = createPageParserClassFromRegexp(/samlib/, /Размещен: \d+\/\d+\/\d+, изменен: \d+\/\d+\/\d+./, function(page) {
        var size = page.match(/\d+k\./)[0];
        size = parseInt(size.slice(0, size.length - 2));
        console.log("parser: size of book = " + size);
        return { 
            type: "bookPage",
            totalSize: size, 
        };
    });

    var samlibAuthorPageParser = createPageParserClassFromRegexp(/samlib/, /Объем:/, function(page) {
        var size = page.match(/\d+k\/\d/)[0];
        size = parseInt(size.slice(0, size.length - 3));
        console.log("parser: total size of all books on author page = " + size);

        return {
            type: "authorPage",
            totalSize: size,
        };
    });

    var ficbookBookParser = createPageParserClassFromRegexp(/ficbook/, /Найти фанфик по вкусу/, function(page) {
        var size = page.match(/\d+\s+страниц/)[0];
        size = parseInt(size.match(/\d+/)[0]);
        console.log("parser: size of ficbook = " + size);
        return {
            type: "ficbookPage",
            totalSize: size
        };
    });

    // this hack will be removed soon
    if (typeof(exports) === "undefined") {
        exports = {};
    }
    exports.parserClass = joinParserClasses([samlibBookPageParser, samlibAuthorPageParser, ficbookBookParser]);
    exports.createParserInstance = createParserInstance;
    exports.downloadAndparse = downloadAndParsePage(exports.parserClass);
})();
