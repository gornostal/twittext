define([
    'jquery',
    'underscore',
    'backbone',
    'oauth',
    'text!templates/options.html',
    'modules/badge',
    'collections/tweets',
    'modules/getTemplate'
], function ($, _, Backbone, OAuth, optionsTemplate, Badge, tweets, getTemplate) {

    var oauth = new OAuth(),
        template = getTemplate('optionsTemplate', optionsTemplate);

    var OptionsView = Backbone.View.extend({

        el: 'body',

        events: {
            'click a.sign-out': 'signOut',
            'click a.sign-in': 'signIn'
        },

        render: function () {
            var token = oauth.getAccessToken();
            template(token || {screen_name: null}, function (html) {
                $('#ph').html(html);
            });
        },

        signOut: function () {
            oauth.destroyAccessToken();
            tweets.localStorage.destroyAll();
            this.render();
            new Badge().noauth();
            return false;
        },

        signIn: function () {
            var that = this;
            chrome.extension.sendRequest({
                method: 'authorize'
            }, function () {
                that.render();
            });
            return false;
        }

    });

    return OptionsView;
});
