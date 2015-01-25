(function() {
    var conditions = {
        isSamlibBookPage: function (item) {
            return item.type === "samlibBookPage";
        },

        isSamlibAuthorPage: function (item) {
            return item.type === "samlibAuthorPage";
        },

        isFicbookBookPage: function (item) {
            return item.type === "ficbookBookPage";
        },

        isSizeMoreThan: function (size) {
            return function (item) {
                return item.totalSize >= size
            }
        },

        isUpdatedLessThan: function (days) {
            return function (item) {
                var momentModule = require("moment.js");
                var now = momentModule.moment(new Date());
                return days >= now.diff(momentModule.moment(item.dateOfRenewal), "days");
            }
        }
    };

    // first elem of array is color
    function fromConditionsToCheck(checkProperies) {
        var condList = checkProperies.conditions.map(function (elem) {
            if (elem.hasArgs) {
                return conditions[elem.name](elem.args);
            } else {
                return conditions[elem.name];
            }
        });

        return function (item) {
            var result = true;
            for (var i = 0; i < condList.length; ++i) {
                result = result && condList[i](item);
            }

            if (result) {
                return [checkProperies.color];
            } else {
                return [];
            }
        }
    } 

    exports.createColorer = function (properties) {
        var checks = properties.map(fromConditionsToCheck);

        return function (item) {
            var result = [];
            for (var i = 0; i < checks.length; ++i) {
                result = result.concat(checks[i](item));             
            }

            return result;
        }
    }
}()
