define([], function () {
    return function () {

        this.get = function () {
            return localStorage.getItem('lastReadTime') || 0;
        };

        this.set = function (timestamp) {
            return localStorage.setItem('lastReadTime', timestamp);
        };

        this['unset'] = function () {
            localStorage.removeItem('lastReadTime');
        };

    };
});
