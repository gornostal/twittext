define(['underscore'], function (_) {

    var parsers = [],
        media = [];

    var prepare = {
        urls: function (text, entry, hasMedia) {
            _.each(entry, function (o) {
                var fn = (function (obj) {
                    var search = text.slice(o.indices[0], o.indices[1]);
                    return function (text) {
                        return text.replace(search, "<a class='external' title='"
                            + obj.expanded_url + "' target='_blank' href='"
                            + obj.url + "'>" + obj.display_url + "</a>");
                    };
                }(o));
                parsers.push(fn);

                if (!hasMedia) {
                    // check if this tweet has unknown media for twitter
                    var code, thumbnail, large;

                    // Instagram
                    // http://instagram.com/developer/embedding/
                    var res = /:\/\/instagr\.am\/p\/([^\/]+)/.exec(o.expanded_url);
                    if (res && res[1]) {
                        code = res[1];
                        thumbnail = 'http://instagr.am/p/' + code + '/media/?size=t';
                        large = 'http://instagr.am/p/' + code + '/media/?size=l';

                        media.push("<a class='media' target='_blank'" + "data-full='"
                            + large + "' href='" + o.url + "'>" + "<img src='" + thumbnail + "'/></a>");
                        return;
                    }

                    // Twitpic
                    // http://dev.twitpic.com/docs/thumbnails/
                    res = /:\/\/twitpic\.com\/([^\/]+)/.exec(o.expanded_url);
                    if (res && res[1]) {
                        code = res[1];
                        thumbnail = 'http://twitpic.com/show/mini/' + code;
                        large = 'http://twitpic.com/show/full/' + code;
                        media.push("<a class='media' target='_blank'" + "data-full='"
                            + large + "' href='" + o.url + "'>" + "<img src='" + thumbnail + "'/></a>");
                        return;
                    }
                }
            });
        },
        user_mentions: function (text, entry) {
            _.each(entry, function (o) {
                var search = text.slice(o.indices[0], o.indices[1]);
                var fn = (function (obj) {
                    return function (text) {
                        return text.replace(search, "<a class='mention' title='" + obj.name
                            + "' target='_blank' href='https://twitter.com/"
                            + obj.screen_name + "'><s>@</s><b>" + obj.screen_name + "</b></a>");
                    };
                }(o));
                parsers.push(fn);
            });
        },
        hashtags: function (text, entry) {
            _.each(entry, function (o) {
                var search = text.slice(o.indices[0], o.indices[1]);
                var fn = (function (obj) {
                    return function (text) {
                        return text.replace(search, "<a target='_blank' href='https://twitter.com/search?q=%23"
                            + obj.text + "'>#" + obj.text + "</a>");
                    };
                }(o));
                parsers.push(fn);
            });
        },
        media: function (text, entry) {
            prepare.urls(text, entry, true);
            _.each(entry, function (o) {
                if (o.type == 'photo') {
                    media.push("<a class='media' target='_blank'"
                        + "data-full='" + o.media_url_https + ":large' href='"
                        + o.url + "'>" + "<img src='" + o.media_url_https + ":thumb'/></a>");
                }
            });
        }
    };

    var parse = function (text) {
        _.each(parsers, function (parser) {
            text = parser(text);
        });

        return text + (media.length ? '<span class="m-wrp">' + media.join('') + '</span>' : '');
    };

    return function (obj) {
        parsers = [];
        media = [];
        var text = obj.text;

        var entities = obj.entities;
        if (obj.retweeted_status) {
            text = obj.retweeted_status.text;
            entities = obj.retweeted_status.entities;
        }

        _.each(entities, function (entry, name) {
            if (_.isArray(entry) && entry.length && _.isFunction(prepare[name])) {
                prepare[name](text, entry);
            }
        });

        // replace \n with <br />
        text = text.replace(/\n/mg, '<br />');

        if (obj.retweeted_status) {
            obj.retweeted_status.text = parse(text);
        } else {
            obj.text = parse(text);
        }

        return obj;
    };
});
