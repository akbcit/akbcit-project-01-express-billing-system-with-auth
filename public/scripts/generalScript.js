"use strict"

$(() => {
    // Add classes based on the status text
    $('.status-text').each(function() {
        if ($(this).text().trim() === 'Yes') {
            $(this).addClass('status-yes');
        } else {
            $(this).addClass('status-no');
        }
    });
});
