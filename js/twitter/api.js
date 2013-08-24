define(['underscore', 'streaming'], function (_, TwitterStreaming) {

    /**
     * @param oauth OAuth with obtained access token
     */
    var TwitterApi = function (oauth) {
        var accessToken = oauth.getAccessToken();
        if (!accessToken) {
            return {};
        }

        return {
            homeTimeline: function (callback, params, error) {
                oauth.sendRequest({
                    url: '1.1/statuses/home_timeline.json',
                    params: _.extend({include_entities: true}, params || {}),
                    success: callback,
                    error: error
                });
            },
            getUserStream: function (onStart) {
                return new TwitterStreaming(oauth, 'https://userstream.twitter.com/2/user.json', {
                    'with': 'followings', // If I leave only parameter 'delimited', data don't come. Mystery...
                    delimited: 'length'
                }, onStart);
            },
            destroy: function (id, callback) {
                oauth.sendRequest({
                    url: '1.1/statuses/destroy/' + id + '.json',
                    method: 'post',
                    success: callback
                });
            },
            favorite: function (id, callback) {
                oauth.sendRequest({
                    url: '1.1/favorites/create/' + id + '.json',
                    method: 'post',
                    success: callback
                });
            },
            unfavorite: function (id, callback) {
                oauth.sendRequest({
                    url: '1.1/favorites/destroy/' + id + '.json',
                    method: 'post',
                    success: callback
                });
            },
            retweet: function (id, callback) {
                oauth.sendRequest({
                    url: '1.1/statuses/retweet/' + id + '.json',
                    method: 'post',
                    success: callback
                });
            },
            send: function (text, callback, error) {
                oauth.sendRequest({
                    url: '1.1/statuses/update.json',
                    method: 'post',
                    params: {
                        status: text,
                        include_entities: true
                    },
                    success: callback,
                    error: error
                });
            }
        };
    };

    return TwitterApi;

});
