self.port.on("properties", function(arg) {
    console.log("properties form received \"properties\" message");

    properties = arg;
    $("#bookSize").attr("value", arg.bookPageMinSize);
    $("#authorSize").attr("value", arg.authorPageMinSize);
});

$("#apply").click(function() {
    properties.bookPageMinSize = parseInt($("#bookSize").val());
    properties.authorPageMinSize = parseInt($("#authorSize").val());

    console.log("submit button is clicked");
    console.log("bookSize = " + properties.bookPageMinSize);
    console.log("authorSize = " + properties.authorPageMinSize);
    
    self.port.emit("setProperties", properties);
    // without "applyProperties" message links coloring will not be change until button "scan" is clicked
    self.port.emit("applyProperties");
});
