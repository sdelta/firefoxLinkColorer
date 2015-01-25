(function() {
    var Request = require("sdk/request").Request;

    function printObject(obj, strDelim, shift) {
        var result = "";

        shift = shift || "";
        for(var i in obj) {
            if (obj.hasOwnProperty(i)) {
                if (typeof(obj[i]) != "object") {
                    result += shift + i + ": " + obj[i] + strDelim;
                } else {
                    result += shift + i + ": " + strDelim;
                    result += printObject(obj[i], strDelim, shift + "    ");
                }
            }
        }

        return result;
    }

    exports.getInfoFromServer = function(targetURL, callback, errback) {
        console.log("ajax: targetURL = " + targetURL);
        Request({
            url: "http://localhost/getInfo",
            content: { type: "get", url: targetURL },
            onComplete: function(response) {
                response = response.json;
                console.log("ajax: url = " + targetURL);
                console.log("ajax: response:\n" + printObject(response, "\n"));
                //response = JSON.parse(response);
                //console.log("ajax: parsed response = " + response);
                if (response.type === "unknown") {
                    console.log("ajax: calling errback");
                    errback(targetURL);
                } else {
                    console.log("ajax: calling callback");
                    callback(response);
                }
            }
        }).post();
    };
})();
