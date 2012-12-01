define([
    'backbone',
    'libs/backbone/localstorage',
    'models/tweet'
], function (Backbone, Store, Tweet) {

    var TweetsCollection = Backbone.Collection.extend({

        model: Tweet,

        localStorage: new Store("tweets"),

        initialize: function () {
            this.bind('add', this.onAdd);
        },

        onAdd: function (item) {
            if (!IS_POPUP) {
                // send a request to the popup collection
                chrome.extension.sendRequest({
                    method: 'add',
                    data: item
                });
            }
        },

        comparator: function (tweet) {
            return -tweet.get('ts');
        }

    });

    return new TweetsCollection();
});
