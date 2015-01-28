self.port.on("properties", function(arg) {
    console.log("properties: properties form received \"properties\" message");
    properties = arg;

    $("#bookSize").attr("value", properties.samlibBookPageMinSize);
    $("#authorSize").attr("value", properties.samlibAuthorPageMinSize);
    $("#ficbookSize").attr("value", properties.ficbookBookPageMinSize);

    $("#bookColor").css("background-color", "#" + properties.colorOfLinkToSamlibBookPage);
    $("#authorColor").css("background-color", "#" + properties.colorOfLinkToSamlibAuthorPage);
    $("#ficbookColor").css("background-color", "#" + properties.colorOfLinkToFicbookBookPage);
});

$("#apply").click(function() {
    properties.samlibBookPageMinSize = parseInt($("#bookSize").val());
    properties.samlibAuthorPageMinSize = parseInt($("#authorSize").val());
    properties.ficbookBookPageMinSize = parseInt($("#ficbookSize").val());

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

    $("#bookColor").colpick(options("colorOfLinkToSamlibBookPage"));
    $("#authorColor").colpick(options("colorOfLinkToSamlibAuthorPage"));
    $("#ficbookColor").colpick(options("colorOfLinkToFicbookBookPage"));
});
