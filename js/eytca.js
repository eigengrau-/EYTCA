var now, enteredUserName, enteredDaysToDisplay, currentUser, errMsg, nextPage, totalPages, totalResults, requestType, totalSubs, responseString, result, checkTick, moment, gapi;
var html = [];
var chanList = [];
var queueHtml = '';
var currentPage = 0;
var newVideos = 0;
var tempNumSubs = 0;
var tempSubscriptionsLength = 0;

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
    $("#infoHome:hidden").slideDown("slow");
    $("input[name=chanIDUser]").click(function() {
        $(this).attr("value", "");
    });
    $("input[name=days]").click(function() {
        $(this).attr("value", "");
    });
    $("#button").click(function() {
        enteredUserName = $("input[name=chanIDUser]").val();
        enteredDaysToDisplay = $("input[name=days]").val();
        var enteredDaysToDisplayCheck = isNaN(enteredDaysToDisplay);
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
        var enteredDaysToDisplayCheck = isNaN(enteredDaysToDisplay);
        if (!enteredUserName || !enteredDaysToDisplay || enteredDaysToDisplay > 7 || enteredDaysToDisplay < 1 || enteredUserName === "Channel ID or Username" || enteredDaysToDisplay === "Number of days") {
            alert("Please enter a valid Channel ID/Username and number of days to display videos for.");
            $(location).attr("href", "/eytca/");
        } else {
            bakeCookies();
        }
    });
});

function logout() {
    $(location).attr("href", "logout.html");
}

function loading(val, msg) {
    $("#progressbar").progressbar({
        value: val
    });
    $('div.progress-label').text(msg);
}

function popup(vid) {
    $.removeCookie("currentQueue", {
        path: "/eytca/"
        });
    if (vid != "queue") {
        $.cookie("videoPopup", vid, {
        path: "/eytca/"
        });
    } else {
        $.removeCookie("videoPopup", {
        path: "/eytca/"
        });
    }
    if (currentUser.queue.length > 0) {
        queueHtml = '';
        for (var i = 0; i < currentUser.queue.length; i++) {
            queueHtml += '<div id="video"><a href="" id="vid" onClick="popup(\'' + currentUser.queue[i][1] + '\');return false;"><img src="' + currentUser.queue[i][3] + '" width="235px"/><span class="videoInfo"><span class="title">' + currentUser.queue[i][0] + '</span></a><p>' + currentUser.queue[i][4] + '<p><span class="desc">' + currentUser.queue[i][2] + '</span></span></div>';
        }
        $.cookie("currentQueue", queueHtml, {
        path: "/eytca/"
        });
    }
    window.open("/eytca/video.html", "_blank", "width=1298,height=750,menubar=0,scrollbars=0,status=0,toolbar=0,");
}

function user(name, days) {
    this.idOrUsername;
    this.idCheck = function() {
        if ($.cookie("user").length === 24 && $.cookie("user").charAt(0) === "U" && $.cookie("user").charAt(1) === "C") {
            this.idOrUsername = true;
            this.userId = $.cookie("user");
        } else {
            this.idOrUsername = false;
            this.readableName = $.cookie("user");
        }
    };
    this.idCheck();
    this.numDaysToDisplay = $.cookie("days");
    this.subscriptions = [];
    this.queue = [];
    this.newVideos = 0;
    this.subscriptionsPages = 1;
    this.totalSubs = 0;
    this.getInfo = function() {
        loading(35, "Retrieving user information.");
        now = moment().subtract('days', this.numDaysToDisplay);
        apiRequest('GetUserInfo');
    };
    this.getSubscriptions = function() {
        loading(45, "Requesting user subscriptions list.");
        apiRequest('GetSubscriptions');
    };
    this.addToQueue = function(title, id, desc, thumb, date) {
        this.queue.push([title, id, desc, thumb, date]);
    };
    this.displayQueue = function() {
        popup("queue");
    }
    this.display = function() {
        for (var i = 0; i < this.subscriptions.length; i++) {
            if (this.subscriptions[i].videos.length > 0) {
                this.subscriptions[i].display();
            } else {
                chanList.push('<div id="noVids"><a href="http://www.youtube.com/channel/' + this.subscriptions[i].channelId + '" target="_blank" title="' + this.subscriptions[i].readableName + '"><img src="' + this.subscriptions[i].avatar + '" width="80px" height="80px"/></a></div>');
            }
        }
        $(document).tooltip();
        $('#notice').remove();
        $('#progressbar').remove();
        $('#loading').remove();
        $("#info:hidden").show();
        $("#info3:hidden").show();
        $("#chanList:hidden").show();
        $('#contentArea').show();
        document.getElementById('info3').innerHTML = '<p><img src="' + this.avatar + '" width="88px"/><p><span class="infoTitle3"><a href="http://www.youtube.com/channel/' + this.userId + '" target="_blank">' + this.readableName + '</a><p>Total Videos: ' + newVideos + '| Total Subscriptions: ' + this.subscriptions.length + '<p><div id="queue" onClick="popup(\'queue\');return false;">Queue</div><p><div id="clearCookies"><a href="/eytca/logout.html">Logout</a></div>';
        document.getElementById('chanList').innerHTML = chanList.join('');
        document.getElementById('contentArea').innerHTML = html.join('');
    };
}

function channel(readableName, channelId, avatar) {
    var tempVideos = [];
    this.readableName = readableName;
    this.channelId = channelId;
    this.avatar = avatar;
    this.getVideos = function() {
        var request = gapi.client.youtube.search.list({
            part: 'snippet',
            channelId: this.channelId,
            publishedAfter: now.format('YYYY-MM-DDTHH:mm:ssZ'),
            maxResults: 50,
            order: 'date'
        });
        requestType = 'GetVideos';
        request.execute(this.onSearchResponse);
    };
    this.onSearchResponse = function(response) {
        this.videos = new Array();
        responseString = JSON.stringify(response, '', 2);
        result = JSON.parse(responseString);
        catchExceptions();
        if (result.pageInfo.totalResults > 0 && result.items !== undefined) {
            for (var k = 0; k < result.items.length; k++) {
                tempVideos[k] = new video(result.items[k].snippet.title, result.items[k].id.videoId, result.items[k].snippet.description, result.items[k].snippet.thumbnails.medium.url, result.items[k].snippet.publishedAt);
                if (k == result.items.length - 1) {
                    tempNumSubs++;
                }
            }
        } else {
            tempNumSubs++;
        }
    };
    this.getVideos();
    this.videos = tempVideos;
    this.display = function() {
        chanList.push('<div id="chan"><a href="#' + this.channelId + '" title="' + this.readableName + '"><img src="' + this.avatar + '" width="80px" height="80px"/></a></div>');
        html.push('<div id="chanTitle" align="left"><img src="' + this.avatar + '" width="50px"/><span class="title"><h1><a name="' + this.channelId + '"><a href="http://www.youtube.com/channel/' + this.channelId + '" target="_blank">' + this.readableName + '</a></a> has posted <a name="numResults">' + this.videos.length + '</a> new video(s) since ' + now.format('MMMM Do YYYY, h:mm:ss a') + '</h1></span><p><a href="#top">TOP &uarr;</a></div>');
        for (var i = 0; i < this.videos.length; i++) {
            newVideos++;
            var currentTime = moment();
            var published = moment(this.videos[i].date);
            html.push('<div id="video"><a href="#" id="vid" onClick="popup(\'' + this.videos[i].id + '\');return false;"><img src="' + this.videos[i].thumbnail + '" width="235px"/><span class="videoInfo"><span class="title">' + this.videos[i].title + '</span></a><p>' + published.format('MMMM Do YYYY, h:mm:ss a') + ' | ' + currentTime.diff(published, "hours") + ' hours ago | <a href="#" id="addToQueue" onClick="currentUser.addToQueue(\'' + this.videos[i].title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].id + '\', \'' + this.videos[i].description.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].thumbnail + '\', \'' + published.format('MMMM Do YYYY, h:mm:ss a') + '\');return false;">Add to queue</a><p><span class="desc">' + this.videos[i].description + '</span></span></div>');
        }
    };
}

function video(title, id, description, thumbnail, date) {
    this.title = title;
    this.id = id;
    this.description = description;
    this.thumbnail = thumbnail;
    this.date = date;
}

function onClientLoad() {
    loading(5, "Client Loaded");
    gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
}

function onYouTubeApiLoad() {
    loading(10, "API Loaded");
    gapi.client.setApiKey('AIzaSyCR5In4DZaTP6IEZQ0r1JceuvluJRzQNLE');
    currentUser = new user();
    currentUser.getInfo();
}

function apiRequest(type) {
    switch (type) {
    case 'GetUserInfo':
        if (currentUser.idOrUsername === false) {
            var request = gapi.client.youtube.channels.list({
                part: 'snippet',
                forUsername: currentUser.readableName
            });
            requestType = 'GetUserInfo';
            request.execute(onSearchResponse);
        } else if (currentUser.idOrUsername === true) {
            var request = gapi.client.youtube.channels.list({
                part: 'snippet',
                id: currentUser.userId
            });
            requestType = 'GetUserInfo';
            request.execute(onSearchResponse);
        }
        break;
    case 'GetSubscriptions':
        var request = gapi.client.youtube.subscriptions.list({
            part: 'snippet',
            fields: 'items/snippet,nextPageToken,pageInfo',
            channelId: currentUser.userId,
            maxResults: 50,
            order: 'alphabetical'
        });
        currentPage = 1;
        requestType = 'GetSubscriptions';
        request.execute(onSearchResponse);
        break;
    case 'GetAllSubscriptions':
        loading(65, "Retrieving videos.");
        var request = gapi.client.youtube.subscriptions.list({
            part: 'snippet',
            fields: 'items/snippet,nextPageToken',
            pageToken: nextPage,
            channelId: currentUser.userId,
            maxResults: 50,
            order: 'alphabetical'
        });
        currentPage += 1;
        if (currentPage !== 1 + totalPages) {
            loading(85, "Retrieving videos.");
            requestType = 'GetSubscriptions';
            request.execute(onSearchResponse);
        } else {
            totalSubs = currentUser.subscriptions.length;
            tempNumSubs = totalSubs;
        }
        break;
    default:
        alert('No response given.');
    }
}

function onSearchResponse(response) {
    switch (requestType) {
    case 'GetUserInfo':
        responseString = JSON.stringify(response, '', 2);
        result = JSON.parse(responseString);
        catchExceptions();
        currentUser.userId = result.items[0].id;
        currentUser.avatar = result.items[0].snippet.thumbnails.
    default.url;
        currentUser.readableName = result.items[0].snippet.title;
        currentUser.getSubscriptions();
        break;
    case 'GetSubscriptions':
        responseString = JSON.stringify(response, '', 2);
        result = JSON.parse(responseString);
        catchExceptions();
        for (var i = 0; i < result.items.length; i++) {
            currentUser.totalSubs++;
            currentUser.subscriptions[tempSubscriptionsLength] = new channel(result.items[i].snippet.title, result.items[i].snippet.resourceId.channelId, result.items[i].snippet.thumbnails.
        default.url);
            tempSubscriptionsLength = currentUser.subscriptions.length;
        }
        if (result.nextPageToken !== undefined && result.items.length == 49) {
            nextPage = result.nextPageToken;
            apiRequest('GetAllSubscriptions');
        } else {
            checkTick = setInterval(lastSubCheckTick, 1000);
        }
        break;
    default:
        alert('No response given.');
    }
}

function lastSubCheckTick() {
    if (tempNumSubs >= currentUser.totalSubs - 1) {
        currentUser.display();
        clearInterval(checkTick);
    }
}

function catchExceptions() {
    if (typeof result.pageInfo != "undefined") {
        if (result.pageInfo.resultsPerPage !== 50 && result.pageInfo.totalResults === 0) {
            alert('Error: Account/Videos not found. Redirecting back to the homepage.');
            logout();
        }
    }
    if (typeof result.error != "undefined") {
        var errReason = result.error.data[0].reason;
        switch (errReason) {
        case "accountClosed":
            errMsg = "Subscriptions could not be retrieved because the subscriber's account is closed.";
            break;
        case "accountSuspended":
            errMsg = "Subscriptions could not be retrieved because the subscriber's account is suspended.";
            break;
        case "subscriptionForbidden":
            errMsg = "The requester is not allowed to access the requested subscriptions.";
            break;
        case "subscriberNotFound":
            errMsg = "The subscriber identified with the request cannot be found.";
            break;
        case "invalidSearchFilter":
            errMsg = "The request contains an invalid combination of search filters and/or restrictions.";
            break;
        case "invalidVideoId":
            errMsg = "The relatedToVideo parameter specified an invalid video ID.";
            break;
        case "forbidden":
            errMsg = "Access forbidden. The request may not be properly authorized.";
            break;
        case "quotaExceeded":
            errMsg = "The request cannot be completed because you have exceeded your quota.";
            break;
        case "incompatibleParameters":
            errMsg = "The request specifies two or more parameters that cannot be used in the same request.";
            break;
        case "invalidFilters":
            errMsg = "The request specifies an invalid filter parameter.";
            break;
        case "invalidPageToken":
            errMsg = "The request specifies an invalid page token.";
            break;
        case "missingRequiredParameter":
            errMsg = "The request is missing a required parameter.";
            break;
        case "unexpectedParameter":
            errMsg = "The request specifies an unexpected parameter.";
            break;
        case "accountDelegationForbidden":
            errMsg = "The authenticated user cannot act on behalf of the specified Google account.";
            break;
        case "authenticatedUserAccountClosed":
            errMsg = "The YouTube account of the authenticated user is closed. In case the authenticated user is acting on behalf of another Google account, then this error refers to the latter.";
            break;
        case "authenticatedUserAccountSuspended":
            errMsg = "The YouTube account of the authenticated user is suspended. In case the authenticated user is acting on behalf of another Google account, then this error refers to the latter.";
            break;
        case "authenticatedUserNotChannel":
            errMsg = "For this request the authenticated user must resolve to a channel, but does not. If your request is authenticated and uses the onBehalfOfContentOwner delegation parameter, then you should also set the onBehalfOfContentOwnerChannel parameter.";
            break;
        case "channelClosed":
            errMsg = "The channel identified in the request has been closed.";
            break;
        case "channelNotFound":
            errMsg = "The channel identified in the request cannot be found.";
            break;
        case "channelSuspended":
            errMsg = "The channel identified in the request has been suspended.";
            break;
        case "cmsUserAccountNotFound":
            errMsg = "The CMS user is not allowed to act on behalf of the specified content owner.";
            break;
        case "insufficientCapabilities":
            errMsg = "The CMS user has insufficient capabilities.";
            break;
        case "insufficientPermissions":
            errMsg = "The scopes associated with the OAuth 2.0 token provided for the request are insufficient for accessing the requested data.";
            break;
        case "contentOwnerAccountNotFound":
            errMsg = "The specified content owner account was not found.";
            break;
        default:
            errMsg = "Other";
        }
        alert('Error: ' + result.error.data[0].message + '. ' + errMsg + ' Redirecting back to the homepage.');
        logout();
    }
}
