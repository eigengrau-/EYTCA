var queueHtml, now, enteredUserName, enteredDaysToDisplay, currentUser, errMsg, nextPage, totalPages, totalResults, requestType, totalSubs, responseString, result, checkTick, moment, gapi, currentTime;
var html = [];
var chanList = [];

//Displays loading text/percentage with jQueryUI.
function loading(val, msg) {
    $("#progressbar").progressbar({
        value: val
    });
    $('div.progress-label').text(msg);
}

function logout() {
    $.removeCookie("user", { path: "/eytca/" });
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
    var _this = this;
    this.infoArr = function() {    //Called when added to page for video popup info.
        return _this.id + ',' +  _this.date + ',' +  _this.views + ',' +  _this.likes + ',' +  _this.dislikes + ',' + _this.title;
    };
    //The following properties are added on creation: Duration, views, likes, dislikes.
}
//Object constructor for individual channels.
function Channel(readableName, channelId, avatar) {
    var tempVideoIds = [];      //Temp array of video ids for requesting their info.
    this.videos = [];
    this.readableName = readableName;
    this.channelId = channelId;
    this.avatar = avatar;
    var _this = this;
    this.getVideos = function(callback) {    //Gets each channel's videos. Called on creation of object.
        var request = gapi.client.youtube.search.list({
            part: 'snippet',
            channelId: _this.channelId,
            publishedAfter: now.format('YYYY-MM-DDTHH:mm:ssZ'),    //Moment.js formatting.
            maxResults: 50,
            order: 'date'
        });
        request.execute(function(result) {
            if (result.error) { catchExceptions(); }
            if (result.items && result.pageInfo && result.pageInfo.totalResults > 0) {
                for (var k = 0; k < result.items.length; k++) {
                    tempVideoIds[k] = result.items[k].id.videoId;
                    _this.videos[k] = new Video(result.items[k].snippet.title, result.items[k].id.videoId, result.items[k].snippet.description, result.items[k].snippet.thumbnails.medium.url, result.items[k].snippet.publishedAt);
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
        request.execute(function(result) {
            for (var x = 0; x < result.items.length; x++) {
                _this.videos[x].duration = result.items[x].contentDetails.duration.replace("PT", "").toLowerCase();
                _this.videos[x].views = result.items[x].statistics.viewCount;
                _this.videos[x].likes = result.items[x].statistics.likeCount;
                _this.videos[x].dislikes = result.items[x].statistics.dislikeCount;
            }
        });
    });
    this.display = function() {    //Called by User Display method.
        chanList.push('<div id="chan"><a href="#' + this.channelId + '" title="' + this.readableName + ' | ' + this.videos.length + '"><img src="' + this.avatar + '" width="80px" height="80px"/></a></div>');    //Avatar display. Light border if Channel has videos. Hover tooltip includes title and # videos.
        html.push('<div id="chanTitle" align="left"><img src="' + this.avatar + '" width="80px" height="80px"/><span class="title"><h1><a name="' + this.channelId + '"><a href="http://www.youtube.com/channel/' + this.channelId + '" target="_blank">' + this.readableName + '</a></a> has posted <a name="numResults">' + this.videos.length + '</a> new video(s) since ' + now.format('MMMM Do YYYY, h:mm:ss a') + '</h1></span><p><a href="#top">TOP &uarr;</a></div>');
        for (var i = 0; i < this.videos.length; i++) {
            currentUser.newVideos++;
            html.push('<div id="video"><a href="#" id="vid" onClick="popup(\'' + this.videos[i].infoArr() + '\');return false;"><img src="' + this.videos[i].thumbnail + '" width="235px"/><span class="videoInfo"><span class="title">' + this.videos[i].title + '</span></a><p>' + this.videos[i].date + ' hours ago | ' + this.videos[i].duration + ' | ' + this.videos[i].views + ' Views | &uarr; ' + this.videos[i].likes + ', &darr; ' + this.videos[i].dislikes + '<br /><a href="#" id="addToQueue" onClick="currentUser.addToQueue(\'' + this.videos[i].title.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].id + '\', \'' + this.videos[i].description.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ") + '\', \'' + this.videos[i].date + '\', \'' + this.videos[i].duration + '\', \'' + this.videos[i].views + '\', \'' + this.videos[i].likes + '\', \'' + this.videos[i].dislikes + '\');return false;">Add to queue</a><p><span class="desc">' + this.videos[i].description + '</span></span></div>');
        }
    };
}

//Video viewer window.
function popup(vid) {
    $.cookie('videoPopup', vid, {
        path: '/eytca/video.html'
    });
    window.open("/eytca/video.html", "fullscreen=yes, scrollbars=auto");
}
//User Object
function User() {
    this.nextPage;
    this.numDaysToDisplay = $.cookie("days");
    this.subscriptions = [];
    this.queue = [];
    this.newVideos = 0;
    this.totalSubs = 0;
    this.currentPage = 0;
    this.nextPage;
    var _this = this;
    this.idCheck = function() {
        if ($.cookie("user").length === 24 && $.cookie("user").charAt(0) === "U" && $.cookie("user").charAt(1) === "C") {    //User entered their channel id.
            _this.userId = $.cookie("user");
            return true;
        } else {    //User entered their username.
            _this.readableName = $.cookie("user");
            return false;
        }
    };
    this.idOrUsername = this.idCheck();
    this.getInfo = function() {
        loading(30, 'Requesting user info');
        now = moment().subtract('days', _this.numDaysToDisplay);    //Moment.js formatting.
        if (_this.idOrUsername) {
            request = gapi.client.youtube.channels.list({
                part: 'snippet',
                id: _this.userId
            });
        } else {
            request = gapi.client.youtube.channels.list({
                part: 'snippet',
                forUsername: _this.readableName
            });
        }
        request.execute(function(result) {
            loading(40, 'Response recieved');
            if (result.error) {catchExceptions();}
            _this.userId = result.items[0].id;
            _this.avatar = result.items[0].snippet.thumbnails.high.url;
            _this.readableName = result.items[0].snippet.title;
            loading(50, 'Hello ' + _this.readableName + '!');
            _this.getSubscriptions();
        });
    };
    this.getInfo();
    this.getSubscriptions = function(nextPage) {
        loading(60, 'Requesting user\'s subscriptions');
        if (nextPage) {
            request = gapi.client.youtube.subscriptions.list({
                part: 'snippet',
                fields: 'items/snippet,nextPageToken',
                pageToken: _this.nextPage,
                channelId: _this.userId,
                maxResults: 50,
                order: 'alphabetical'
            });
        } else {
            request = gapi.client.youtube.subscriptions.list({
                part: 'snippet',
                fields: 'items/snippet,nextPageToken,pageInfo',
                channelId: _this.userId,
                maxResults: 50,
                order: 'alphabetical'
            });
            requestType = 'GetSubscriptions';
        }
        request.execute(function(result) {
            loading(70, 'Response recieved');
            _this.currentPage++;
            if (result.error) {catchExceptions();}
            if (_this.totalSubs === 0) {_this.totalSubs = result.pageInfo.totalResults;}
            loading(80, 'Parsing ' + _this.totalSubs + ' subscriptions');
            //Channel creation.
            for (var i = 0; i < result.items.length; i++) {
                _this.subscriptions[_this.subscriptions.length] = new Channel(result.items[i].snippet.title, result.items[i].snippet.resourceId.channelId, result.items[i].snippet.thumbnails.default.url);
            }
            if (result.nextPageToken !== _this.nextPage && result.nextPageToken !== undefined) {
                _this.nextPage = result.nextPageToken;
                _this.getSubscriptions(true);
            } else {
                checkTick = setInterval(_this.lastSubCheckTick, 1000);
            }
        });
    };
    this.addToQueue = function(title, id, desc, date, duration, views, likes, dislikes) {
        this.queue.push([title, id, desc, date, duration, views, likes, dislikes]);
        $.cookie("queue", JSON.stringify(this.queue), {
            path: "/eytca/",
            expires: 365
        });
    };
    this.display = function() {
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
        $('#header').remove();
        $("#info:hidden").show();
        $("#info3:hidden").show();
        $("#chanList:hidden").show();
        //Append user info to page.
        document.getElementById('info3').innerHTML = '<div id="userInfo"><span class="infoTitle3"><a href="http://www.youtube.com/channel/' + this.userId + '" target="_blank">' + this.readableName + '</a><p>Total Videos: ' + this.newVideos + '| Total Subscriptions: ' + this.totalSubs + '</p></div><div id="clearCookies"><a href="" onClick="logout();return false;">Logout</a></div>';
        document.getElementById('chanList').innerHTML = chanList.join('');
        //Append main content to page.
        document.getElementById('contentArea').innerHTML = html.join('');
        $('#contentArea').show();
    };
    //Called once the last channel has been returned. Checks if all channels are finished requesting their videos.
    this.lastSubCheckTick = function() {
        if (_this.subscriptions.length >= _this.totalSubs - _this.currentPage) {
            loading(100, 'Loaded');
            //Sorts channel by name. Requesting the channels to be sorted alphabetically is not reliable.
            _this.subscriptions.sort(function(a,b) {return (a.readableName.toLowerCase() > b.readableName.toLowerCase()) ? 1 : ((b.readableName.toLowerCase() > a.readableName.toLowerCase()) ? -1 : 0);} );
            _this.display();
            clearInterval(checkTick);
        }
    };
}

function onClientLoad() {
    loading(10, "Client Loaded");
    gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
    currentTime = moment();
}

function onYouTubeApiLoad() {
    loading(20, "API Loaded");
    gapi.client.setApiKey('AIzaSyAovj5X_gBnFTX2uJkGwYabTOX5pPGqJQE');
    //User object creation.
    currentUser = new User();
}