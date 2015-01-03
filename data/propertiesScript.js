self.port.on("properties", function(arg) {
    console.log("properties: properties form received \"properties\" message");
    properties = arg;

    $("#bookSize").attr("value", properties.bookPageMinSize);
    $("#authorSize").attr("value", properties.authorPageMinSize);
    $("#ficbookSize").attr("value", properties.ficbookPageMinSize);

    $("#bookColor").css("background-color", "#" + properties.colorOfLinkToBookPage);
    $("#authorColor").css("background-color", "#" + properties.colorOfLinkToAuthorPage);
    $("#ficbookColor").css("background-color", "#" + properties.colorOfLinkToFicbookPage);
});

$("#apply").click(function() {
    properties.bookPageMinSize = parseInt($("#bookSize").val());
    properties.authorPageMinSize = parseInt($("#authorSize").val());
    properties.ficbookPageMinSize = parseInt($("#ficbookSize").val());

    console.log("properties: submit button is clicked");
    for (var i in properties) {
        if (properties.hasOwnProperty(i)) {
            console.log("properties:\t" + i + " = " + properties[i]);
        }
    }
    
    self.port.emit("setProperties", properties);
    // without "applyProperties" message links coloring will not be change until button "scan" is clicked
    self.port.emit("applyProperties");
});


$(document).ready(function() {
    var options = function(propertyName) {
        return {
            layout: "hex",
            color:  "ff0000",
            onSubmit: function (hsb, hex, rgb, elem) {
                $(elem).css("background-color", "#" + hex);
                $(elem).colpickHide();
                properties[propertyName] = hex;
            }
        }
    }

    $("#bookColor").colpick(options("colorOfLinkToBookPage"));
    $("#authorColor").colpick(options("colorOfLinkToAuthorPage"));
    $("#ficbookColor").colpick(options("colorOfLinkToFicbookPage"));
});
