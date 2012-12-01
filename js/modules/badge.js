define([], function () {

    return function () {

        var bgColor = bgColor || [225, 0, 0, 200],
            icon = {
                normal: 'img/icon_19.png',
                unread: 'img/icon_19_unread.png',
                noauth: 'img/icon_19_noauth.png'
            };
        chrome.browserAction.setBadgeBackgroundColor({color: bgColor});

        this.unread = function (count) {
            chrome.browserAction.setIcon({path: icon.unread});
            return chrome.browserAction.setBadgeText({text: count + ''});
        };

        this.normal = function () {
            chrome.browserAction.setIcon({path: icon.normal});
            return chrome.browserAction.setBadgeText({text: ''});
        };

        this.noauth = function () {
            chrome.browserAction.setIcon({path: icon.noauth});
            return chrome.browserAction.setBadgeText({text: ''});
        };

        this.getUnreadCount = function () {
            return parseInt(localStorage.getItem('unreadCount') || 0);
        };

        this.incrementUnread = function (value) {
            value = value || 1;
            var unread = this.getUnreadCount() + value;
            localStorage.setItem('unreadCount', unread >= 0 ? unread : 0);
            var self = this;
            setTimeout(function () {
                // show badge on timeout because popup might be open when new tweet arives
                unread = self.getUnreadCount();
                if (unread > 0) {
                    self.unread(unread >= 20 ? '20+' : unread);
                } else {
                    self.normal();
                }
            }, 100);
        };

        this.resetUnread = function () {
            localStorage.setItem('unreadCount', 0);
            this.normal();
        };

    };

});
