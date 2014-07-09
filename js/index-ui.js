function bakeCookies() {
    $.cookie("user", enteredUserName, {
        path: "/eytca/",
        expires: 365
    });
    $.cookie("days", enteredDaysToDisplay, {
        path: "/eytca/",
        expires: 365
    });
    $(location).attr("href", "eytca.html");
}

function validation(usr, days) {
    enteredUserName = usr;
    enteredDaysToDisplay = Number(days);
    console.log((enteredDaysToDisplay / 1) !== enteredDaysToDisplay);
    if (!enteredUserName || !enteredDaysToDisplay || enteredDaysToDisplay > 7 || enteredDaysToDisplay < 1 || enteredUserName === "Channel ID or Username" || enteredDaysToDisplay === "Number of days" || isNaN(enteredDaysToDisplay) ) {
        alert("Please enter a valid Username and number of days to display videos for.");
        $(location).attr("href", "/eytca/");
    } else {
        bakeCookies();
    }
}

$(document).ready(function() {
    $("input[name=chanIDUser]").click(function() {
        $(this).attr("value", "");
        $(document).keydown(function(e){
            if (e.keyCode == 13) {
                validation($("input[name=chanIDUser]").val(), $("input[name=days]").val());
            }
        });
    });

    $("input[name=days]").click(function() {
        $(this).attr("value", "");
        $(document).keydown(function(e){
            if (e.keyCode == 13) {
                validation($("input[name=chanIDUser]").val(), $("input[name=days]").val());
            }
        });
    });

    $("#button").click(function() {
        validation($("input[name=chanIDUser]").val(), $("input[name=days]").val());
    });

    $("#button3").click(function() {
        validation("UCMLxPcY2VqywN478dIS9a_Q", 2);
    });

    var user = $.cookie("user");


    if (user !== undefined) {
        var userAv = $.cookie("userAv");
        $(location).attr("href", '/eytca/eytca.html');
    }
});