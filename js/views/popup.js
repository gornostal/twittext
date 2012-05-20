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
    'modules/lastReadTime',
    'twitterText'
], function ($, _, Backbone, tweets, TweetView, Badge, TwitterApi, OAuth, 
            preprocessTweet, Tweet, LastReadTime, twitterText) {

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
            
            this.initNewTweet();

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
        },
        
        initNewTweet: function () {
            var $newTweet = $('.new-tweet'),
                keyPressTimeout,
                tweeting = false,
                $tweeting = $newTweet.find('.tweeting'),
                $send = $newTweet.find('.send'),
                $remain = $newTweet.find('.remain'),
                $tweetHolder = $('#home-timeline'),
                $flashMsg = $newTweet.find('.flash-msg'),
                $input = $newTweet.find('.tweet-editor');
                
            $('.new-tweet-toggle')
                .tooltip({placement: 'bottom'})
                .click(function(){
                    $(this).tooltip('hide');
                    $newTweet.toggleClass('opened');
                    return false;
                });
            $newTweet.find('a.cancel').click(function(){
                $newTweet.toggleClass('opened');
                $flashMsg.hide();
                return false;
            });
            
            var updateRemainNum = function () {
                var text = twitterText($input.val());
                $remain.text(text.remain);
                if (text.valid) {
                    $send.removeClass('disabled');
                } else {
                    $send.addClass('disabled');
                }
            };
            
            var flashMessage = function (message, isError) {
                $flashMsg
                    .removeClass('success error')
                    .text(message)
                    .addClass(isError ? 'error' : 'success')
                    .fadeIn(100);
                setTimeout(function(){
                    $flashMsg.fadeOut(100);
                }, 15e3);
            }
            
            var enableInputs = function () {
                $send.removeClass('disabled');
                tweeting = false;
                $tweeting.hide();
                $input.prop('disabled', false);
            };
            
            var success = function (resp) {
                enableInputs();
                flashMessage('Sent');
                $input.val('');
                updateRemainNum();
                var tweet = new Tweet(preprocessTweet(resp)),
                    view = new TweetView({model: tweet});
                $tweetHolder.prepend(view.render().el);
            };
            
            var error = function (resp) {
                enableInputs();
                flashMessage('Error: ' + resp.error, true);
            };
            
            $send.click(function(){
                var text = twitterText($input.val());
                if (text.valid && !tweeting) {
                    $send.addClass('disabled');
                    tweeting = true;
                    $tweeting.show();
                    $input.prop('disabled', true);
                    twitter.send($input.val(), success, error);
                }
                return false;
            });
            
            $input.bind('keyup', function(){
                clearTimeout(keyPressTimeout);
                keyPressTimeout = setTimeout(updateRemainNum, 100);
            });
        }

    });

    return PopupView;
});
