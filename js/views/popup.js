define([
    'jquery',
    'underscore',
    'backbone',
    'collections/tweets',
    'views/tweet',
    'modules/badge',
    'twitter',
    'oauth',
    'modules/preprocessTweet',
    'models/tweet',
    'modules/lastReadTime'
], function ($, _, Backbone, tweets, TweetView, Badge, TwitterApi, OAuth, preprocessTweet, Tweet, LastReadTime) {

    var oauth = new OAuth(),
        twitter = new TwitterApi(oauth),
        accessToken = oauth.getAccessToken(),
        userId = accessToken ? accessToken.user_id : null,
        badge = new Badge(),
        $timeline = $('.timeline');

    var PopupView = Backbone.View.extend({

        el: 'body',

        events: {
            'click #sign-in-with-twitter': 'signIn'
        },

        initialize: function () {
            if (!accessToken) {
                $('body').addClass('sign-in');
                return;
            }

            tweets.bind('add', this.addOne, this);
            tweets.bind('reset', this.addAll, this);
            tweets.fetch();

            // expecting new data from background collection
            // request = {method: 'name', data: {...}}
            // method is a method from tweets collection
            chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
                if (request.method && _.isFunction(tweets[request.method])) {
                    _.extend(request.data, {prepend: true});
                    sendResponse(tweets[request.method](request.data));
                }
            });

            $timeline.bind('scroll.badge', function () {
                if ($(this).scrollTop() === 0) {
                    badge.resetUnread();
                }
            });

            new Badge().resetUnread();
            new LastReadTime().set(Math.round(new Date().getTime() / 1000));
        },

        addOne: function (tweet) {
            if (tweet.get('deleted')) {
                return;
            }
            var view = new TweetView({
                model: tweet
            });
            var method = tweet.get('prepend') ? 'prepend' : 'append';
            $('#home-timeline')[method](view.render().el);
            if ($timeline.scrollTop() === 0) {
                badge.resetUnread();
            }
        },

        addAll: function () {
            var that = this,
                max = 20; // maximum number of tweets when the popup opens
            tweets.each(function () {
                if (max-- > 0) {
                    that.addOne.apply(that, arguments);
                }
            });
            this.bindScrollAutodownload();
        },

        bindScrollAutodownload: function () {
            if (tweets.length < 19) {
                return;
            }

            var that = this,
                $tweets = $('#home-timeline .tweet'),
                top = $('#home-timeline').height() - 800;

            $timeline.addClass('autoload');
            $timeline.bind('scroll.autoload', function () {
                if ($(this).scrollTop() > top) {
                    $timeline.unbind('scroll.autoload');
                    that.loadOlderTweets($tweets.last().data('post_id'));
                }
            });
        },

        loadOlderTweets: function (maxId) {
            var that = this,
                $tweetHolder = $('#home-timeline'),
                $loadingTweets = $('.loading-tweets');

            var success = function (data) {
                _.each(data, function (item) {
                    var tweet = new Tweet(preprocessTweet(item));
                    var view = new TweetView({model: tweet});
                    $tweetHolder.append(view.render().el);
                });
                if (data.length > 0) {
                    that.bindScrollAutodownload();
                } else {
                    $('.timeline').removeClass('autoload');
                }
            };

            var error = function () {
                $loadingTweets
                    .addClass('load-error')
                    .find('.try-again')
                    .unbind('click')
                    .click(function () {
                        $loadingTweets.removeClass('load-error');
                        that.loadOlderTweets(maxId);
                        return false;
                    });
            };

            twitter.homeTimeline(success, {max_id: maxId}, error);
        },

        signIn: function () {
            chrome.extension.sendRequest({
                method: 'authorize'
            });
            window.close();
        }

    });

    return PopupView;
});
