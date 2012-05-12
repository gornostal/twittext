define([
    'jquery',
    'twitter',
    'modules/timelineHandler',
    'oauth',
    'modules/badge',
    'collections/tweets',
    'modules/lastReadTime',
    'pubsub'
], function ($, TwitterApi, timelineHandler, OAuth, Badge, tweets, LastReadTime) {

    var Background = function () {
        var oauth = new OAuth(),
            badge = new Badge(),
            streamer,
            lrt = new LastReadTime(),
            accessToken = oauth.getAccessToken(),
            that = this;

        if (accessToken) {
            streamer = timelineHandler(accessToken.user_id, new TwitterApi(oauth));
        } else {
            badge.noauth();
        }

        this.authorize = function (callback) {
            oauth.authorize(function (accessToken) {
                badge.resetUnread();
                tweets.reset([]);
                streamer = timelineHandler(accessToken.user_id, new TwitterApi(oauth));
                if (typeof callback == 'function') {
                    try {
                        callback();
                    } catch (e) {
                    }
                }
            });
        };

        this.unauthorized = function () {
            badge.noauth();
            lrt.unset();
            oauth.destroyAccessToken();
            tweets.localStorage.destroyAll();
            if (streamer) {
                streamer.abort();
            }
        };

        $.subscribe('error.unauthorized', function () {
            that.unauthorized();
        });

        var that = this;
        chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
            if (request.method && _.isFunction(that[request.method])) {
                that[request.method](sendResponse);
            }
        });

    };

    return Background;
});
