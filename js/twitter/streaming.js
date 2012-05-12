define([
    'underscore',
    'modules/subscribers',
    'modules/streamingXhr',
    'jquery',
    'pubsub'
], function (_, Subscribers, StreamingXhr, $) {

    // store streams in a global space
    window.streaming = {};

    var TwitterStreaming = function (oauth, url, params, onStart) {
        if (typeof window.streaming[url] != 'undefined') {
            return window.streaming[url];
        }

        var subs = new Subscribers(),
            extension = chrome.app.getDetails();

        var shxr = new StreamingXhr({
            url: url,
            params: params,
            oauth: oauth,
            onData: function (data) {
                if (typeof data != 'object') {
                    return;
                }

                var type;
                if (data.id && data.id_str) {
                    type = 'tweet';
                } else if (data.friends) {
                    type = 'friends';
                } else if (typeof data['delete'] == 'object') {
                    type = 'delete';
                } else if (data.event && (data.event == 'unfavorite'
                    || data.event == 'favorite')) {
                    type = data.event;
                }

                if (type) {
                    _.each(subs.filter(type), function (s) {
                        s.callback(data, type);
                    });
                } else {
                    console.log('Unrecognized data type', data);
                }
            },
            headers: {
                'X-User-Agent': extension.name + ' v' + extension.version
            },
            onStart: onStart,
            unauthorized: function () {
                $.publish('error.unauthorized');
            }
        });


        window.streaming[url] = {
            start: shxr.start,
            abort: shxr.abort,
            /**
             * @param callback
             * @param events Object like {dm: true, tweet: true}
             *        by default subscribe for all events
             * @return int subscriber ID
             */
            subscribe: function (callback, events) {
                return subs.add(callback, events);
            },
            unsubscribe: function (subscriberId) {
                subs.remove(subscriberId);
            }
        };

        return window.streaming[url];

    };

    return TwitterStreaming;

});
