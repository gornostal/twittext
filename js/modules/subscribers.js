define(['underscore'], function (_) {

    var Subscribers = function () {
        var subs = [],
            i = 0;

        return {
            add: function (callback, events) {
                var id = i++;
                subs.push({
                    id: id,
                    callback: callback,
                    events: events || null
                });
                return id;
            },
            remove: function (id) {
                if (typeof subs[id] != 'undefined') {
                    _.each(subs, function (sub, n) {
                        if (sub.id === id) {
                            subs.splice(n, 1);
                        }
                    });
                }
            },
            removeAll: function () {
                subs = [];
            },
            getAll: function () {
                return subs;
            },
            filter: function (eventName) {
                return _.filter(subs, function (sub) {
                    if (!sub.events || (typeof sub.events[eventName]
                        != 'undefined' && sub.events[eventName])) {
                        return sub;
                    }
                });
            }
        };
    };

    return Subscribers;
});
