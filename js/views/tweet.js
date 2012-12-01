define([
    'jquery',
    'underscore',
    'backbone',
    'text!templates/tweet.html',
    'entities',
    'twitter',
    'helpers/prettyDate',
    'oauth',
    'modules/getTemplate',
    'modules/jquery/imagePreview',
    'bootstrap'
], function ($, _, Backbone, tweetTemplate, parseEntities,
    TwitterApi, prettyDate, OAuth, getTemplate) {

    var oauth = new OAuth(),
        twitter = new TwitterApi(oauth),
        userId = oauth.getAccessToken().user_id,
        template = getTemplate('tweetTemplate', tweetTemplate);

    var TweetView = Backbone.View.extend({

        tagName: "div",

        events: {
            'click .actions .delete': 'deleteTweet',
            'click .actions .favorite': 'toggleFavorite',
            'click .actions .retweet': 'toggleRetweet'
        },

        initialize: function () {

        },

        render: function () {
            if (!document.getElementById(this.model.id)) {
                var obj = this.model.toJSON(),
                    that = this;
                if (typeof obj.retweeted_status != 'object') {
                    obj.retweeted_status = null;
                }
                template(parseEntities(obj), function (html) {
                    $(that.el).html(html);
                    that.bindEventListeners();
                });
            }
            return this;
        },

        bindEventListeners: function () {
            this.updateTweetTime();
            $(this.el).find('a.media').imagePreview();
            $(this.el).find('.actions a').tooltip({placement: 'left'});
            $(this.el).find('a').click(this.interceptMiddleButton);
        },

        updateTweetTime: function () {
            var date = new Date(this.model.get('created_at'));
            var $el = $(this.el).find('small.time');
            var update = function () {
                $el.text(prettyDate(date));
                var timeout = 60;
                if (new Date() - date < 60e3) {
                    timeout = 3;
                }
                setTimeout(update, timeout * 1000);
            };
            update();
        },

        deleteTweet: function () {
            var that = this,
                $modal = $('#areYouSureModal');

            $modal.modal()
                .find('a.btn-primary')
                .unbind('click')
                .click(function () {
                    $modal.modal('hide');
                    twitter.destroy(that.model.id, function () {
                        that.remove();
                    });
                    return false;
                });
            return false;
        },

        toggleFavorite: function () {
            var $fav = $(this.el).find('.actions .favorite');
            if ($fav.hasClass('active')) {
                twitter.unfavorite(this.model.id);
                $fav.removeClass('active');
            } else {
                twitter.favorite(this.model.id);
                $fav.addClass('active');
            }
            return false;
        },

        toggleRetweet: function () {
            var $rt = $(this.el).find('.actions .retweet');
            if ($rt.hasClass('active')) {
                twitter.destroy(this.model.get('retweeted_statuses')[userId]);
                $rt.removeClass('active');
            } else {
                var that = this,
                    $modal = $('#areYouSureModal');

                $modal.modal()
                    .find('a.btn-primary')
                    .unbind('click')
                    .click(function () {
                        $modal.modal('hide');
                        twitter.retweet(that.model.id, function () {
                            $rt.addClass('active');
                        });
                        return false;
                    });
            }
            return false;
        },

        remove: function () {
            $(this.el).slideUp('fast');
        },

        interceptMiddleButton: function (e) {
            var href = $(this).attr('href');
            if (e.which == 2 && /^http/.test(href)) {
                chrome.tabs.create({
                    url: href,
                    active: false
                });
                return false;
            }
            return true;
        }

    });

    return TweetView;
});
