require.config({
    paths: {
        jquery: 'libs/jquery/jquery-min',
        pubsub: 'libs/jquery/pubsub',
        underscore: 'libs/underscore/underscore-min',
        backbone: 'libs/backbone/backbone',
        text: 'libs/require/text',
        popup: 'extension/popup',
        background: 'modules/background',
        twitter: 'twitter/api',
        entities: 'twitter/entities',
        streaming: 'twitter/streaming',
        oauth: 'twitter/oauth',
        bootstrap: 'libs/twitter/bootstrap',
        twitterText: 'twitter/text'
    }
});

if (/popup/.test(document.location.pathname)) { // is popup

    window.IS_POPUP = true;
    require(['views/popup'], function (PopupView) {
        new PopupView();
    });

} else if (/options\.html/.test(document.location.pathname)) { // options page

    require(['views/options'], function (OptionsView) {
        new OptionsView().render();
    });

} else { // is background

    window.IS_POPUP = false;
    require(['background'], function (Background) {
        new Background();
    });

}
