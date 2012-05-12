define([], function() {

    var month = function(n){
        switch (n) {
            case 1: return 'Jan';
            case 2: return 'Feb';
            case 3: return 'Mar';
            case 4: return 'Apr';
            case 5: return 'May';
            case 6: return 'Jun';
            case 7: return 'Jul';
            case 8: return 'Aug';
            case 9: return 'Sep';
            case 10: return 'Oct';
            case 11: return 'Nov';
            case 12: return 'Dec';
        }
    };


    /*
     * JavaScript Pretty Date
     * Copyright (c) 2011 John Resig (ejohn.org)
     * Licensed under the MIT and GPL licenses.
     */
    return function (date) {
        var c = (((new Date()).getTime() - date.getTime()) / 1000);
        var eqDate = new Date().getDate() == date.getDate();
        if (c < 10) {
            return 'Just now';
        } else if (c < 60) { // seconds
            return Math.floor(c) + 's';
        } else if (c >= 60 && c < 3600) { // minutes
            return Math.floor(c / 60) + 'm';
        } else if (c >= 3600 && c < 86400 && eqDate) { // hours
            return Math.floor(c / 3600) + 'h';
        } else if (c >= 86400 || !eqDate) {
            var year = '';
            if (new Date().getYear() != date.getYear()) {
                year = ', ' + date.getYear();
            }
            return date.getDate() + ' ' + month(date.getMonth() + 1) + year;
        }
    };
});
