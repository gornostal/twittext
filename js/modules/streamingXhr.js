define(['underscore', 'jquery'], function (_, $) {

    var streamingXhr = function (options) {

        var defaults = {
                params: {
                    delimited: 'length' // this module can process only delimited response http://goo.gl/BJZx8
                },
                onData: function () {},
                onStart: function () {},
                unauthorized: function () {},
                headers: {}
            },
            streamReconnectBaseTime = 20e3,
            streamReconnectWaitTime = 20e3,
            streamMaxStaleTime = 90e3,
            streamMaxReconnectWait = 600e3,
            xhr,
            lastProgressTime,
            lastLoaded = 0,
            lastChunkLen,
            maxBuffer = 1024 * 500,
            timeoutHandle;

        options = _.extend(defaults, options);


        var xhrEvent = {
            onProgress: function (e) {
                lastProgressTime = new Date().getTime();

                var totalLen = e.loaded;
                if (totalLen > maxBuffer) {
                    abort();
                }
                var data = xhr.responseText;

                while (lastLoaded < totalLen) {
                    if (!lastChunkLen) {
                        lastChunkLen = '';
                        var curChar = data.charAt(lastLoaded);
                        while (curChar != '\n' || lastChunkLen.length === 0) {
                            if (curChar.match(/\d/)) {
                                lastChunkLen += curChar;
                            }
                            lastLoaded += 1;
                            if (lastLoaded >= totalLen) {
                                return;
                            }
                            curChar = data.charAt(lastLoaded);
                        }
                        lastLoaded += 1;
                        lastChunkLen = parseInt(lastChunkLen, 10);
                    }
                    if (lastLoaded + lastChunkLen > totalLen) {
                        // let's just wait for the rest of our data
                        return;
                    }
                    var jsonChunk = data.substring(lastLoaded, lastLoaded + lastChunkLen);
                    var parsedChunk;
                    try {
                        parsedChunk = JSON.parse(jsonChunk);
                    } catch (e) {
                        abort();
                        console.log('chunk ', jsonChunk);
                        throw e;
                    }
                    lastLoaded += lastChunkLen;
                    lastChunkLen = 0;
                    options.onData(parsedChunk);
                }
            },
            onreadystatechange: function () {
                if (xhr.readyState == 2 && xhr.status == 200) {
                    // headers received and status equal to 200
                    // reset reconnect time
                    streamReconnectWaitTime = streamReconnectBaseTime;
                } else if (xhr.readyState == 4) {
                    // content has finished loading

                    // if whe don't have access token or we get error 403
                    if (!options.oauth.getAccessToken() || xhr.status == 403) {
                        clearTimeout(timeoutHandle);
                        if (xhr.status == 401) {
                            if (_.isFunction(options.unauthorized)) {
                                options.unauthorized();
                            }
                        }
                        return false;
                    }

                    if (xhr.status == 200) {
                        streamReconnectWaitTime = streamReconnectBaseTime;
                        start();
                    } else if (xhr.status == 0) {
                        setTimeout(function () {
                            start();
                        }, streamReconnectBaseTime);
                    } else {
                        setTimeout(function () {
                            start();
                        }, streamReconnectWaitTime);
                        if (streamReconnectWaitTime < streamMaxReconnectWait) {
                            streamReconnectWaitTime *= 2;
                        }
                    }
                } else if (xhr.readyState == 3) {
                    var time = new Date().getTime();
                    if (time - lastProgressTime > streamMaxStaleTime) {
                        abort();
                    }
                }
            }
        };

        var abort = function () {
            if (xhr) {
                xhr.removeEventListener("progress", xhrEvent.onProgress, false);
                xhr.abort();
            }
        };

        var start = function () {
            if (xhr && xhr.readyState !== 0 && xhr.readyState !== 4 || !options.oauth.getAccessToken()) {
                // prevent multiple connections
                return false;
            }

            lastLoaded = 0;

            options.headers.Authorization = options.oauth.getSign({
                url: options.url,
                params: options.params
            }).header;

            xhr = new XMLHttpRequest();

            xhr.open('GET', options.url + '?' + $.param(options.params || {}), true);
            for (var name in options.headers) {
                xhr.setRequestHeader(name, options.headers[name]);
            }
            xhr.addEventListener("progress", xhrEvent.onProgress, false);
            xhr.onreadystatechange = xhrEvent.onreadystatechange;
            xhr.send();

            clearTimeout(timeoutHandle);
            var checkStaleConnection = function () {
                var time = new Date().getTime();
                if (time - lastProgressTime > streamMaxStaleTime) {
                    abort();
                }

                timeoutHandle = setTimeout(checkStaleConnection, streamMaxStaleTime / 2);
            };
            timeoutHandle = setTimeout(checkStaleConnection, streamMaxStaleTime / 2);

            _.isFunction(options.onStart) && options.onStart();

            return true;
        };

        return {
            start: start,
            getXhr: function () {
                return xhr;
            },
            abort: abort // abort and then start
        };

    }

    return streamingXhr;
});
