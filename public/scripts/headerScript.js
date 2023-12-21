"use strict"

$(() => {
    // toggle the dropdown on button click
    $("#dropdownMenuButton").click(function () {
        $("#dropdownMenu").toggle();
    });

    // close the dropdown when clicking outside of it
    $(document).click(function (event) {
        const dropdownMenu = $("#dropdownMenu");
        const dropdownButton = $("#dropdownMenuButton");

        if (!dropdownMenu.is(event.target) && !dropdownButton.is(event.target) && dropdownMenu.has(event.target).length === 0) {
            dropdownMenu.hide();
        }
    });
});
