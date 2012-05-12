define([
    'jquery',
    'underscore',
    'backbone',
    'oauth',
    'text!templates/options.html',
    'modules/badge',
    'collections/tweets'
], function ($, _, Backbone, OAuth, optionsTemplate, Badge, tweets) {

    var oauth = new OAuth();

    var OptionsView = Backbone.View.extend({

        el: 'body',

        template: _.template(optionsTemplate),

        events: {
            'click a.sign-out': 'signOut',
            'click a.sign-in': 'signIn'
        },

        render: function () {
            var token = oauth.getAccessToken();
            $('#ph').html(this.template(token || {screen_name: null}));
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
