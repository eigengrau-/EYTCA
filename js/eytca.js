var now, enteredUserName, enteredDaysToDisplay, currentUser, errMsg, nextPage, totalPages, totalResults, requestType, totalSubs, responseString, result, checkTick, moment, gapi;
var html = [];
var chanList = [];
var queueHtml = '';
var currentPage = 0;
var tempSubscriptionsLength = 0;

function loading(val, msg) {
    $("#progressbar").progressbar({
        value: val
    });
    $('div.progress-label').text(msg);
}

function logout() {
    $(location).attr("href", "logout.html");
}

function catchExceptions() {
    if (typeof result.pageInfo !== "undefined") {
        if (result.pageInfo.resultsPerPage !== 50 && result.pageInfo.totalResults === 0) {
            alert('Error: Account/Videos not found. Redirecting back to the homepage.');
            logout();
        }
    }
    if (typeof result.error !== "undefined") {
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

function Video(title, id, description, thumbnail, date) {
    this.title = title;
    this.id = id;
    this.description = description;
    this.thumbnail = thumbnail;
    this.date = date;
}

function Channel(readableName, channelId, avatar) {
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
        this.videos = [];
        responseString = JSON.stringify(response, '', 2);
        result = JSON.parse(responseString);
        if (result.error) {catchExceptions();}
        if (result.pageInfo.totalResults > 0 && result.items !== undefined) {
            var k;
            for (k = 0; k < result.items.length; k++) {
                tempVideos[k] = new Video(result.items[k].snippet.title, result.items[k].id.videoId, result.items[k].snippet.description, result.items[k].snippet.thumbnails.medium.url, result.items[k].snippet.publishedAt);
            }
        }
    };
    this.getVideos();
    this.videos = tempVideos;
    this.display = function() {
        chanList.push('<div id="chan"><a href="#' + this.channelId + '" title="' + this.readableName + '"><img src="' + this.avatar + '" width="80px" height="80px"/></a></div>');
        html.push('<div id="chanTitle" align="left"><img src="' + this.avatar + '" width="50px"/><span class="title"><h1><a name="' + this.channelId + '"><a href="http://www.youtube.com/channel/' + this.channelId + '" target="_blank">' + this.readableName + '</a></a> has posted <a name="numResults">' + this.videos.length + '</a> new video(s) since ' + now.format('MMMM Do YYYY, h:mm:ss a') + '</h1></span><p><a href="#top">TOP &uarr;</a></div>');
        var i, currentTime, published;
        for (i = 0; i < this.videos.length; i++) {
            currentUser.newVideos++;
            currentTime = moment();
            published = moment(this.videos[i].date);
            html.push('<div id="video"><a href="#" id="vid" onClick="popup(\'' + this.videos[i].id + '\');return false;"><img src="' + this.videos[i].thumbnail + '" width="235px"/><span class="videoInfo"><span class="title">' + this.videos[i].title + '</span></a><p>' + currentTime.diff(published, "hours") + ' hours ago | <a href="#" id="addToQueue" onClick="currentUser.addToQueue(\'' + this.videos[i].title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].id + '\', \'' + this.videos[i].description.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].thumbnail + '\', \'' + published.format('MMMM Do YYYY, h:mm:ss a') + '\');return false;">Add to queue</a><p><span class="desc">' + this.videos[i].description + '</span></span></div>');
        }
    };
}

function lastSubCheckTick() {
    if (currentUser.subscriptions.length >= currentUser.totalSubs - currentPage) {
        currentUser.subscriptions.sort(function(a,b) {return (a.readableName.toLowerCase() > b.readableName.toLowerCase()) ? 1 : ((b.readableName.toLowerCase() > a.readableName.toLowerCase()) ? -1 : 0);} );
        currentUser.display();
        clearInterval(checkTick);
    }
}

function apiRequest(type) {
    var request;
    switch (type) {
    case 'GetUserInfo':
        if (currentUser.idOrUsername === false) {
            request = gapi.client.youtube.channels.list({
                part: 'snippet',
                forUsername: currentUser.readableName
            });
            requestType = 'GetUserInfo';
            request.execute(onSearchResponse);
        } else if (currentUser.idOrUsername === true) {
            request = gapi.client.youtube.channels.list({
                part: 'snippet',
                id: currentUser.userId
            });
            requestType = 'GetUserInfo';
            request.execute(onSearchResponse);
        }
        break;
    case 'GetSubscriptions':
        request = gapi.client.youtube.subscriptions.list({
            part: 'snippet',
            fields: 'items/snippet,nextPageToken,pageInfo',
            channelId: currentUser.userId,
            maxResults: 50,
            order: 'alphabetical'
        });
        requestType = 'GetSubscriptions';
        request.execute(onSearchResponse);
        break;
    case 'GetAllSubscriptions':
        loading(65, "Retrieving videos.");
        request = gapi.client.youtube.subscriptions.list({
            part: 'snippet',
            fields: 'items/snippet,nextPageToken',
            pageToken: nextPage,
            channelId: currentUser.userId,
            maxResults: 50,
            order: 'alphabetical'
        });
        loading(85, "Retrieving videos.");
        requestType = 'GetSubscriptions';
        request.execute(onSearchResponse);
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
        if (result.error) {catchExceptions();}
        currentUser.userId = result.items[0].id;
        currentUser.avatar = result.items[0].snippet.thumbnails.
    high.url;
        currentUser.readableName = result.items[0].snippet.title;
        currentUser.getSubscriptions();
        break;
    case 'GetSubscriptions':
        responseString = JSON.stringify(response, '', 2);
        result = JSON.parse(responseString);
        if (result.error) {catchExceptions();}
        currentPage++;
        if (currentUser.totalSubs === 0) {
            currentUser.totalSubs = result.pageInfo.totalResults;
        }
        var i;
        for (i = 0; i < result.items.length; i++) {
            currentUser.subscriptions[currentUser.subscriptions.length] = new Channel(result.items[i].snippet.title, result.items[i].snippet.resourceId.channelId, result.items[i].snippet.thumbnails.default.url);
        }
        if (result.nextPageToken !== undefined) {
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

function popup(vid) {
    $.removeCookie("currentQueue", {
        path: "/eytca/"
    });
    if (vid !== "queue") {
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
        var i;
        for (i = 0; i < currentUser.queue.length; i++) {
            queueHtml += '<div id="video"><a href="" id="vid" onClick="popup(\'' + currentUser.queue[i][1] + '\');return false;"><img src="' + currentUser.queue[i][3] + '" width="235px"/><span class="videoInfo"><span class="title">' + currentUser.queue[i][0] + '</span></a><p>' + currentUser.queue[i][4] + '<p><span class="desc">' + currentUser.queue[i][2] + '</span></span></div>';
        }
        $.cookie("currentQueue", queueHtml, {
            path: "/eytca/"
        });
    }
    window.open("/eytca/video.html", "fullscreen=yes, scrollbars=auto");
}

function User() {
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
    };
    this.display = function() {
        var i;
        for (i = 0; i < this.subscriptions.length; i++) {
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
        document.getElementById('info3').innerHTML = '<div id="userInfo"><span class="infoTitle3"><a href="http://www.youtube.com/channel/' + this.userId + '" target="_blank">' + this.readableName + '</a><p>Total Videos: ' + this.newVideos + '| Total Subscriptions: ' + this.subscriptions.length + '</p></div><div id="queue"><a href="" onClick="popup(\'queue\');return false;">Queue</a></div><div id="clearCookies"><a href="/eytca/logout.html">Logout</a></div>';
        $('#info3').css("background-image", "url('" + this.avatar + "')");
        $('#info3').css("background-size", "100%");
        document.getElementById('chanList').innerHTML = chanList.join('');
        document.getElementById('contentArea').innerHTML = html.join('');
    };
}

function onClientLoad() {
    loading(5, "Client Loaded");
    gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
}

function onYouTubeApiLoad() {
    loading(10, "API Loaded");
    gapi.client.setApiKey('AIzaSyAovj5X_gBnFTX2uJkGwYabTOX5pPGqJQE');
    currentUser = new User();
    currentUser.getInfo();
}