console.log("analyzer: page-worker that analyze samlim page is started");

$(document).ready(function() {
    console.log("analyzer: trying to analyze url" + document.URL);
    if ((/Размещен: \d+\/\d+\/\d+, изменен: \d+\/\d+\/\d+./).test(document.body.innerHTML)) {
        // we work with book page
        var size = document.body.innerHTML.match(/\d+k\./)[0];
        size = parseInt(size.slice(0, size.length - 2));
        console.log("analyzer: size of book = " + size);
        self.port.emit("analyzed", { 
            type: "bookPage",
            totalSize: size, 
            url: document.URL
        });
    } else {
        // we work with author page
        if ((/Объем:/).test(document.body.innerHTML)) {
            var size = document.body.innerHTML.match(/\d+k\/\d/)[0];
            size = parseInt(size.slice(0, size.length - 3));
            console.log("analyzer: total size of all books on author page = " + size);

            self.port.emit("analyzed", {
                type: "authorPage",
                totalSize: size,
                url: document.URL
            });
        } else {
            console.log("analyzer: analyzing samlib technical page, exiting");
        }
    }
});
