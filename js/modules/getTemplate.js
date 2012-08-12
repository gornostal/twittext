define(function () {

    var iframe = document.createElement('iframe'),
        callbacks = [];

    iframe.src = 'sandboxed/template-renderer.html';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    window.addEventListener('message', function (event) {
        callbacks.forEach(function (item, idx) {
            if (item && item.id == event.data.id) {
                item.callback(event.data.result);
                delete callbacks[idx];
            }
        });
    });

    return function (templateName, template) {
        return function (context, callback) {
            var id = Math.random();
            callbacks.push({
                id: id,
                callback: callback
            });
            iframe.contentWindow.postMessage({
                id: id,
                templateName: templateName,
                template: template,
                context: context
            }, '*');
        };
    };
});
