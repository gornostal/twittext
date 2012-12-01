define([
    'jquery',
    'bootstrap'
], function ($) {

    var sizes = {};

    var preview = function () {
        var $tweet = $(this).parents('.tweet'),
            fullImage = $(this).data('full');

        $(this).click(function () {
            var $modal = $('#ip'),
                iWidth = 400,
                iHeight = 300,
                ratio = iWidth / iHeight,
                $preloader = $modal.find('img.preload');

            $modal.find('a.image').attr('href', $(this).attr('href'));
            $modal.find('a.image img').not('.preload').remove();
            $preloader.show();
            $modal.find('.tweet-holder').html($tweet.clone().attr('id', ''));
            $modal.modal();

            if (!sizes[fullImage]) {
                $('<img>').attr('src', fullImage).load(
                    function () {
                        var width = $(this).width(),
                            height = $(this).height();

                        $preloader.hide();
                        sizes[fullImage] = {
                            width: (width / height > ratio ? iWidth : null ),
                            height: (width / height <= ratio ? iHeight : null )
                        };

                        $(this).css(sizes[fullImage]);
                        $modal.find('a.image').append($(this).clone().removeClass('img-preload'));
                    }).addClass('img-preload').appendTo($('body'));
            } else {
                $preloader.hide();
                $modal.find('a.image').append($('<img>')
                    .attr('src', fullImage).css(sizes[fullImage]));
            }

            return false;
        });
    };

    $.fn.imagePreview = function () {
        $(this).each(preview);
    };

});
