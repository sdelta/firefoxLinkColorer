console.log("page-worker that analyze samlim page is started");

$(document).ready(function() {
    console.log("analyzer: trying to analyze url" + document.URL);
    if ($("*:contains('Размещен:'):contains('изменен:')").toArray().length != 0) {
        // we work with book page
        var mayBeSize = $("li:contains('изменен'):first").toArray();
        var size = mayBeSize[0].innerHTML.match(/\d+k/)[0];
        size = size.slice(0, size.length - 1);
        console.log("analyzer: size of book = " + size);
        self.port.emit("analyzed", { 
            type: "bookPage",
            totalSize: size, 
            url: document.URL
        });
    } else {
        // we work with author page
        var table = $("ul:contains('Объем'):first").toArray();
        if (table.length == 0) {
            console.log("analyzer: analyzing samlib technical page, exiting");
        } else {
            var size = table[0].innerHTML.match(/\d+k\/\d/)[0];
            size = size.slice(0, size.length - 3);
            console.log("analyzer: total size of all books on author page = " + size);

            self.port.emit("analyzed", {
                type: "authorPage",
                totalSize: size,
                url: document.URL
            });
        }
    }
});
