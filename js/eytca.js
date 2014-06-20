var now, enteredUserName, enteredDaysToDisplay, currentUser, errMsg, nextPage, totalPages, totalResults, requestType, totalSubs, responseString, result, checkTick, moment, gapi;
var html = [];
var chanList = [];
var queueHtml = '';
var currentPage = 0;
var tempSubscriptionsLength = 0;
var currentTime;

//Displays loading text/percentage with jQueryUI.
function loading(val, msg) {
    $("#progressbar").progressbar({
        value: val
    });
    $('div.progress-label').text(msg);
}

function logout() {
    $.removeCookie("user", { path: "/eytca/" });
    $.removeCookie("chan", { path: "/eytca/" });
    $.removeCookie("days", { path: "/eytca/" });
    console.log("Cookies cleared.");
    $(location).attr("href", "/eytca/");
}

//Called with every API request
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

//Object constructor for individual videos.
function Video(title, id, description, thumbnail, date) {
    this.title = title;
    this.id = id;
    this.description = description;
    this.thumbnail = thumbnail;
    this.date = currentTime.diff(moment(date), "hours");
    this.infoArr = function() {    //Called when added to page for video popup info.
        return this.id + ',' +  this.date + ',' +  this.views + ',' +  this.likes + ',' +  this.dislikes;
    };
    //The following properties are added on creation: Duration, views, likes, dislikes.
}

//Object constructor for individual channels.
function Channel(readableName, channelId, avatar) {
    var tempVideos = [];        //Temp array for videos while they are being returned. Becomes this.videos.
    var tempVideoIds = [];      //Temp array of video ids for requesting their info. Includes duration, views, likes, dislikes.
    this.readableName = readableName;
    this.channelId = channelId;
    this.avatar = avatar;
    this.getVideos = function(callback) {    //Gets each channel's videos. Called on creation of object.
        var request = gapi.client.youtube.search.list({
            part: 'snippet',
            channelId: this.channelId,
            publishedAfter: now.format('YYYY-MM-DDTHH:mm:ssZ'),    //Moment.js formatting.
            maxResults: 50,
            order: 'date'
        });
        request.execute(function(response) {
            responseString = JSON.stringify(response, '', 2);
            result = JSON.parse(responseString);
            this.videos = [];
            if (result.error) { catchExceptions(); }
            if (result.items && result.pageInfo && result.pageInfo.totalResults > 0) {
                for (var k = 0; k < result.items.length; k++) {
                    tempVideoIds[k] = result.items[k].id.videoId;
                    tempVideos[k] = new Video(result.items[k].snippet.title, result.items[k].id.videoId, result.items[k].snippet.description, result.items[k].snippet.thumbnails.medium.url, result.items[k].snippet.publishedAt);
                    if (k === result.items.length - 1) {
                        callback();
                    }
                }
            }
        });
    };
    this.getVideos(function() {         //Get Channel's videos, callback function requests all videos info.
        var request = gapi.client.youtube.videos.list({
            part: 'contentDetails, statistics',
            id: tempVideoIds.join(),    //Requests info of all videos simultaneously.
            maxResults: 50,
        });
        request.execute(function(response) {
            responseString = JSON.stringify(response, '', 2);
            result = JSON.parse(responseString);
            for (var x = 0; x < result.items.length; x++) {
                tempVideos[x].duration = result.items[x].contentDetails.duration.replace("PT", "").toLowerCase();
                tempVideos[x].views = result.items[x].statistics.viewCount;
                tempVideos[x].likes = result.items[x].statistics.likeCount;
                tempVideos[x].dislikes = result.items[x].statistics.dislikeCount;
            }
        });
    });
    this.videos = tempVideos;
    this.display = function() {    //Called by User Display method.
        chanList.push('<div id="chan"><a href="#' + this.channelId + '" title="' + this.readableName + ' | ' + this.videos.length + '"><img src="' + this.avatar + '" width="80px" height="80px"/></a></div>');    //Avatar display. Light border if Channel has videos. Hover tooltip includes title and # videos.
        html.push('<div id="chanTitle" align="left"><img src="' + this.avatar + '" width="80px" height="80px"/><span class="title"><h1><a name="' + this.channelId + '"><a href="http://www.youtube.com/channel/' + this.channelId + '" target="_blank">' + this.readableName + '</a></a> has posted <a name="numResults">' + this.videos.length + '</a> new video(s) since ' + now.format('MMMM Do YYYY, h:mm:ss a') + '</h1></span><p><a href="#top">TOP &uarr;</a></div>');
        var i, currentTime, published;
        for (i = 0; i < this.videos.length; i++) {
            currentUser.newVideos++;
            html.push('<div id="video"><a href="#" id="vid" onClick="popup(\'' + this.videos[i].infoArr() + '\');return false;"><img src="' + this.videos[i].thumbnail + '" width="235px"/><span class="videoInfo"><span class="title">' + this.videos[i].title + '</span></a><p>' + this.videos[i].date + ' hours ago | ' + this.videos[i].duration + ' | ' + this.videos[i].views + ' Views | &uarr; ' + this.videos[i].likes + ', &darr; ' + this.videos[i].dislikes + '<br /><a href="#" id="addToQueue" onClick="currentUser.addToQueue(\'' + this.videos[i].title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].id + '\', \'' + this.videos[i].description.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].date + '\');return false;">Add to queue</a><p><span class="desc">' + this.videos[i].description + '</span></span></div>');
        }
    };
}

//Called once the last channel has been returned. Checks if all channels are finished requesting their videos.
function lastSubCheckTick() {
    if (currentUser.subscriptions.length >= currentUser.totalSubs - currentPage) {
        //Sorts channel by name. Requesting the channels to be sorted alphabetically is not reliable.
        currentUser.subscriptions.sort(function(a,b) {return (a.readableName.toLowerCase() > b.readableName.toLowerCase()) ? 1 : ((b.readableName.toLowerCase() > a.readableName.toLowerCase()) ? -1 : 0);} );
        currentUser.display();
        clearInterval(checkTick);
    }
}

function apiRequest(type) {
    var request;
    switch (type) {
    case 'GetUserInfo':    //Called from User on creation.
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
    case 'GetSubscriptions':    //Called from GetSubscriptions User method.
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
    case 'GetAllSubscriptions':    //The maximum results per request is 50.
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
        currentUser.avatar = result.items[0].snippet.thumbnails.high.url;
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
        //Channel creation.
        for (var i = 0; i < result.items.length; i++) {
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

//Video viewer window.
function popup(vid) {
    //queueAjax("get");
    if (vid !== "queue") {
        $.removeCookie("videoPopup", { path: '/eytca/video.html' });
        $.cookie('videoPopup', vid, {
            path: '/eytca/video.html'
        });
    } else {
        $.removeCookie("videoPopup", { path: '/eytca/video.html' });
    }
    if (currentUser.queue.length > 0) {
        $.cookie("currentQueue", currentUser.userId, {
            path: "/eytca/video.html"
        });
    }
    window.open("/eytca/video.html", "fullscreen=yes, scrollbars=auto");
}

//WIP video queue.
/*function queueAjax(updateGet) {
    if (updateGet === "update") {
        //Add video to queue
        $.ajax({
            type: "POST",
            url: "queue.php",
            dataType: "text json",
            data: { username: currentUser.userId, queue: JSON.stringify(currentUser.queue)}
        })
            .done(function( msg ) {
                //Update userobj.queue
                $.get( "queueGet.php", { username: currentUser.userId } )
                    .done(function( data ) {
                        if (data) {
                            currentUser.queue = JSON.parse(data);
                        }
                    });
            });
    } else {
        $.get( "queueGet.php", { username: currentUser.userId } )
        .done(function( data ) {
            if (data) {
                currentUser.queue = JSON.parse(data);
            }
        });
    }
    }*/

//User Object
function User() {
    this.idOrUsername;
    this.idCheck = function() {
        if ($.cookie("user").length === 24 && $.cookie("user").charAt(0) === "U" && $.cookie("user").charAt(1) === "C") {    //User entered their channel id.
            this.idOrUsername = true;
            this.userId = $.cookie("user");
        } else {    //User entered their username.
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
        now = moment().subtract('days', this.numDaysToDisplay);    //Moment.js formatting.
        apiRequest('GetUserInfo');
    };
    this.getSubscriptions = function() {
        loading(45, "Requesting user subscriptions list.");
        apiRequest('GetSubscriptions');
    };
    this.addToQueue = function(title, id, desc, date) {
        this.queue.push([title, id, desc, date]);
        //queueAjax("update");
    };
    this.displayQueue = function() {
        popup("queue");
    };
    this.display = function() {
        $.removeCookie("currentQueue", {
            path: "/eytca/"
         });
        //queueAjax("get");
        for (var i = 0; i < this.subscriptions.length; i++) {
            if (this.subscriptions[i].videos.length > 0) {
                this.subscriptions[i].display();
            } else {
                //Channel has no videos. Avatar border is dark and links to their YouTube channel page.
                chanList.push('<div id="noVids"><a href="http://www.youtube.com/channel/' + this.subscriptions[i].channelId + '" target="_blank" title="' + this.subscriptions[i].readableName + '"><img src="' + this.subscriptions[i].avatar + '" width="80px" height="80px"/></a></div>');
            }
        }
        $(document).tooltip();
        $('#info3').css("background-image", "url('" + this.avatar + "')");
        $('#info3').css("background-size", "100%");
        $('#notice').remove();
        $('#progressbar').remove();
        $('#loading').remove();
        $("#info:hidden").show();
        $("#info3:hidden").show();
        $("#chanList:hidden").show();
        //Append user info to page.
        document.getElementById('info3').innerHTML = '<div id="userInfo"><span class="infoTitle3"><a href="http://www.youtube.com/channel/' + this.userId + '" target="_blank">' + this.readableName + '</a><p>Total Videos: ' + this.newVideos + '| Total Subscriptions: ' + this.subscriptions.length + '</p></div><div id="queue"><a href="" onClick="popup(\'queue\');return false;">Queue</a></div><div id="clearCookies"><a href="/eytca/logout.html">Logout</a></div>';
        document.getElementById('chanList').innerHTML = chanList.join('');
        //Append main content to page.
        document.getElementById('contentArea').innerHTML = html.join('');
        $('#contentArea').show();
    };
}

function onClientLoad() {
    loading(5, "Client Loaded");
    gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
    currentTime = moment();
}

function onYouTubeApiLoad() {
    loading(10, "API Loaded");
    gapi.client.setApiKey('AIzaSyAovj5X_gBnFTX2uJkGwYabTOX5pPGqJQE');
    //User object creation.
    currentUser = new User();
    currentUser.getInfo();
}