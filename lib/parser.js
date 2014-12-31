exports.parseURL = function(pageURL, callback) {
    console.log("parser: parser started");
    request = require("sdk/request").Request({
        url: pageURL,
        onComplete: function(response) {
            page = response.text;

            if (response.status != 200) {
                console.log("parser: http error url = " + pageURL + " status = " + response.status);
                return;
            }

            console.log("parser: page received page");

            var result;

            if ((/Размещен: \d+\/\d+\/\d+, изменен: \d+\/\d+\/\d+./).test(page)) {
                // we work with book page
                var size = page.match(/\d+k\./)[0];
                size = parseInt(size.slice(0, size.length - 2));
                console.log("parser: size of book = " + size);
                result = { 
                    type: "bookPage",
                    totalSize: size, 
                    url: pageURL
                };
            } else {
                // we work with author page
                if ((/Объем:/).test(page)) {
                    var size = page.match(/\d+k\/\d/)[0];
                    size = parseInt(size.slice(0, size.length - 3));
                    console.log("parser: total size of all books on author page = " + size);

                    result = {
                        type: "authorPage",
                        totalSize: size,
                        url: pageURL
                    };
                } else {
                    console.log("parser: analyzing samlib technical page, exiting");
                    return;
                }
            }
            callback(result);
        }
    });

    request.get();

}
