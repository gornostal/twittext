define([], function () {

    /**
     * Make some modifications to tweet object
     */
    return function (item, userId) {
        if (item.retweeted_status) {
            var orig = item;
            item = item.retweeted_status;
            item.retweeted = orig.retweeted || (orig.user.id == userId);
            item.retweeted_by = orig.user;
            item.retweeted_statuses = {};
            item.retweeted_statuses[orig.user.id] = orig.id_str;
            item.post_id = orig.id_str; // need it for loading tweets on scroll
            item.ts = Math.round(new Date(orig.created_at).getTime() / 1000);
        } else {
            item.retweeted_by = null;
            item.retweeted_statuses = {};
            item.ts = Math.round(new Date(item.created_at).getTime() / 1000);
        }

        item.id = item.id_str;
        item.post_id = item.id_str;
        item.is_mine = item.user.id == userId;

        return item;
    };

});
