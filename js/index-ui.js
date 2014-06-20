function bakeCookies() {
    $.cookie("user", enteredUserName, {
        path: "/eytca/"
    });
    $.cookie("days", enteredDaysToDisplay, {
        path: "/eytca/"
    });
    $(location).attr("href", "eytca.html");
}

$(document).ready(function() {

    $("input[name=chanIDUser]").click(function() {
        $(this).attr("value", "");
    });

    $("input[name=days]").click(function() {
        $(this).attr("value", "");
    });

    $("#button").click(function() {
        enteredUserName = $("input[name=chanIDUser]").val();
        enteredDaysToDisplay = $("input[name=days]").val();
        if (!enteredUserName || !enteredDaysToDisplay || enteredDaysToDisplay > 7 || enteredDaysToDisplay < 1 || enteredUserName === "Channel ID or Username" || enteredDaysToDisplay === "Number of days") {
            alert("Please enter a valid Username and number of days to display videos for.");
            $(location).attr("href", "/eytca/");
        } else {
            bakeCookies();
        }
    });

    $("#button3").click(function() {
        enteredUserName = "UCMLxPcY2VqywN478dIS9a_Q";
        enteredDaysToDisplay = 2;
        if (!enteredUserName || !enteredDaysToDisplay || enteredDaysToDisplay > 7 || enteredDaysToDisplay < 1 || enteredUserName === "Channel ID or Username" || enteredDaysToDisplay === "Number of days") {
            alert("Please enter a valid Channel ID/Username and number of days to display videos for.");
            $(location).attr("href", "/eytca/");
        } else {
            bakeCookies();
        }
    });
    var user = $.cookie("user");
    if (user !== undefined) {
        var userAv = $.cookie("userAv");
        $(location).attr("href", '/eytca/eytca.html');
    }
});