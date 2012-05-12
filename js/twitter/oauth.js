define([
    'jquery',
    'libs/oauth/simple',
    'pubsub'
], function ($) {

    var OAuth = function () {

        var TWITTER_BASE_URL = 'https://api.twitter.com/';

        var getOauthUrl = function (type, parameters) {
            var url = TWITTER_BASE_URL + 'oauth/' + type;
            if (typeof parameters == 'object') {
                var params = [], key;
                for (key in parameters) {
                    params.push(key + '=' + parameters[key]);
                }
                url += '?' + params.join('&');
            }

            return url;
        };

        var settings = {
            request_url: getOauthUrl('request_token'),
            authorize_url: getOauthUrl('authorize'),
            access_url: getOauthUrl('access_token'),
            consumer_key: 'lCZdIjyEgRYKu6N9TQEebA',
            consumer_secret: 'UR8ViRIdALHQYNHUetiAJG8lLMEq4shi4zqukbGYE'
        };

        var requestTokenData = {};

        var getRequestToken = function (callback) {
            var url = OAuthSimple().sign({
                path: settings.request_url,
                parameters: {oauth_callback: 'oob'},
                signatures: {
                    api_key: settings.consumer_key,
                    shared_secret: settings.consumer_secret
                }
            }).signed_url;
            $.get(url, function (data) {
                requestTokenData = OAuthSimple()._parseParameterString(data);
                callback(requestTokenData['oauth_token']);
            });
        };

        var authorize = function (callback) {
            if (localStorage.access_token) {
                callback(OAuthSimple()._parseParameterString(localStorage.access_token));
                return;
            }
            getRequestToken(function (oauth_token) {
                // now we have an oauth_token and few other parameters in variable obtainedVars
                var authorizeUrl = getOauthUrl('authorize', {
                    oauth_token: oauth_token
                });

                // show authorization page to our user
                chrome.tabs.create({
                    url: authorizeUrl
                }, function (tab) {
                    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
                        if (changeInfo.status == 'complete' && tab.url.indexOf(getOauthUrl('authorize')) === 0) {
                            // we are on the page with PIN. Try to grab it...
                            chrome.tabs.executeScript(tabId, {
                                code: 'document.getElementsByTagName(\'code\').length && '
                                    + 'chrome.extension.sendRequest({code: document.getElementsByTagName(\'code\')[0].innerHTML});'
                            });
                        }
                    });
                    /**
                     *@todo rewrite
                     */
                    chrome.extension.onRequest.addListener(function (data) {
                        if (data.code) { // got a PIN
                            var url = OAuthSimple().sign({
                                path: settings.access_url,
                                parameters: {
                                    oauth_verifier: data.code,
                                    oauth_token: requestTokenData.oauth_token
                                },
                                signatures: {
                                    api_key: settings.consumer_key,
                                    shared_secret: settings.consumer_secret,
                                    oauth_secret: requestTokenData.oauth_token_secret
                                }
                            }).signed_url;
                            // access token request
                            $.get(url, function (data) {
                                localStorage.access_token = data;
                                var successMsg = 'Congratulations! You have been successfully authenticated.';
                                var code = 'document.getElementsByTagName(\'code\')[0].innerHTML = "' + successMsg
                                    + '"; document.getElementById("code-desc").style.display = "none";'
                                    + 'document.getElementsByTagName(\'code\')[0].style.fontSize = "250%";';
                                chrome.tabs.executeScript(tab.id, {code: code});
                                callback(OAuthSimple()._parseParameterString(data));
                            });
                        }
                    });
                });

            });
        };

        var getAccessToken = function () {
            if (!localStorage.access_token) {
                return false;
            }
            return OAuthSimple()._parseParameterString(localStorage.access_token);
        };

        var getSign = function (request) {
            var accessToken = getAccessToken();
            if (!accessToken) {
                return false;
            }

            return OAuthSimple().sign({
                path: request.url,
                action: request.method || 'GET',
                parameters: $.extend({}, request.params),
                signatures: {
                    api_key: settings.consumer_key,
                    shared_secret: settings.consumer_secret,
                    oauth_token: accessToken.oauth_token,
                    oauth_secret: accessToken.oauth_token_secret
                }
            });
        };

        var sendRequest = function (request) {
            if (!getAccessToken()) {
                return false;
            }

            if (!/:\/\//.test(request.url)) {
                request.url = TWITTER_BASE_URL + request.url;
            }
            var sign = getSign(request);
            $.ajax({
                type: request.method,
                url: request.url,
                timeout: request.timeout || 30e3,
                data: request.params,
                headers: {
                    Authorization: sign.header
                },
                dataType: request.dataType || 'json',
                success: request.success,
                error: function (xhr) {
                    if (xhr.status == 401) {
                        $.publish('error.unauthorized');
                    }
                }
            });
            return true;
        };

        var destroyAccessToken = function () {
            localStorage.removeItem('access_token');
            chrome.extension.sendRequest({
                method: 'unauthorized'
            });
        };

        return {
            authorize: authorize,
            sendRequest: sendRequest,
            getSign: getSign,
            getAccessToken: getAccessToken,
            destroyAccessToken: destroyAccessToken
        };

    };

    return OAuth;
});
