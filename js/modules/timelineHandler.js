define([
    'underscore',
    'collections/tweets',
    'modules/badge',
    'modules/lastReadTime',
    'modules/preprocessTweet'
], function (_, tweets, Badge, LastReadTime, preprocessTweet) {

    var badge = new Badge(),
        userId,
        lrt = new LastReadTime();

    // add tweet if it does not exists in local storage
    var addTweet = function (item) {
        item = preprocessTweet(item, userId);
        var tweet = tweets.get(item.id);

        if (tweet) {
            tweet.set({
                retweeted: item.retweeted,
                retweeted_statuses: _.extend(tweet.get('retweeted_statuses'), item.retweeted_statuses)
            });
            tweet.save();
        } else {
            badge.incrementUnread();
            tweets.create(item);
            cleanUp();
        }
    };

    // clean up a local storage if there are more then 'maxAmount' tweets
    var maxAmount = 30;
    var cleanUp = function () {
        var last = tweets.length;
        while (last > maxAmount) {
            last--;
            var tweet = tweets.at(last);
            tweet.destroy();
            tweets.remove(tweet);
        }
    };


    var timelineHandler = function (uid, twitter) {
        userId = uid;

        // load saved tweets from local storage
        tweets.fetch();

        // load tweets via REST API
        var homeTimeline = function () {
            twitter.homeTimeline(function (data) {
                _.each(data.reverse(), function (item) {
                    addTweet(item);
                });
            });
        };

        var unread = badge.getUnreadCount();
        if (unread > 0) {
            badge.unread(unread);
        }

        // connect to the user stream
        var streamer = twitter.getUserStream(homeTimeline);
        if (!streamer.start()) {
            streamer.abort();
            streamer.start();
        }

        streamer.subscribe(addTweet, {tweet: true});

        streamer.subscribe(function (data) {
            var item = data['delete'].status;
            var tweet = tweets.get(item.id_str);
            if (tweet) {
                tweet.destroy();
                tweets.remove(tweet);
                if (tweet.get('ts') > lrt.get()) {
                    badge.incrementUnread(-1);
                }
            } else {
                tweets.forEach(function (tweet) {
                    if (tweet.get('retweeted_statuses')[userId] == item.id_str) {
                        tweet.set({retweeted: false});
                        tweet.save();
                    }
                });
            }
        }, {'delete': true});

        streamer.subscribe(function (item, type) {
            var tweet = tweets.get(item.target_object.id_str);
            if (tweet) {
                tweet.set({favorited: type == 'favorite' ? true : false});
                tweet.save();
            }
        }, {favorite: true, unfavorite: true});

        return streamer;
    };

    return timelineHandler;

});
