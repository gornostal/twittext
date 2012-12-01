define(['underscore'], function (_) {
    
    // replacement for urls
    var urlReplacement = (function(){
        var r=[]; 
        for (var i = 0; i < 20; i++) {
            r[i]='x';
        } 
        return r.join('');
    }());
    urlReplacement = '$1' + urlReplacement;
    
    // @todo: Improve regex. Now it gives evry inaccurate calculation
    return function (text) {
        var hasUrls = false,
            maxLength = 140,
            valid = false,
            remain = maxLength,
            regex = /(^|\s|\()(www\.[a-z0-9\-\.]+\.[a-z]+|http(s?):\/\/)[a-z0-9.\/\?\=\-\&_\%\#|\(\)]+/ig;
        
        text = text.replace(regex, urlReplacement);
        
        remain -= text.length;
        if (remain >= 0 && remain < maxLength) {
            valid = true;
        }
        
        return {
            length: text.length,
            remain: remain,
            valid: valid,
            hasUrls: hasUrls
        };
    };
});
