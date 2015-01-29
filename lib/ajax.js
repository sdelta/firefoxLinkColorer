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

    exports.getInfoFromServer = function(listOfURL) {
        var Q = require("Q/q.js");
        var deffered = Q.defer();

        Request({
            url: "http://localhost/getInfo",
            content: { listOfURL: listOfURL },
            onComplete: function(response) {
                response = response.json;
                console.log("ajax: response:\n" + printObject(response, "\n"));
                deffered.resolve(response);
            }
        }).post();

        return deffered.promise;
    };

    exports.giveInfoToServer = function(info) {
        console.log("ajax: accepting info = " + printObject(info, "|"));
        Request({
            url: "http://localhost/giveInfo",
            content: info,
            onComplete: function () {
                console.log("ajax: commited info about url = " + info.url);
            }
        }).post();
    };
})();
