var queueHtml, playlistHtml, now, enteredUserName, enteredDaysToDisplay, currentUser, errMsg, nextPage, totalPages, totalResults, requestType, totalSubs, responseString, result, checkTick, moment, gapi, currentTime;
var html = [];
var chanList = [];

//Displays loading text/percentage with jQueryUI.
function loading(val, msg) {
    $('.progress-label').text(msg);
    $("#progressbar").progressbar( "option", "value", val )
}

function logout() {
    $.removeCookie("user", { path: "/eytca/" });
    $.removeCookie("days", { path: "/eytca/" });
    console.log("Cookies cleared.");
    $(location).attr("href", "/eytca/");
}

//Called with every API request
function errorHandling() {
    if (!result) {
        alert("No response given.")
        logout();
    }
    if (typeof result.error !== "undefined") {
        alert('Error: ' + result.error.data[0].reason + '. Redirecting back to the homepage.');
        logout();
    }
}

//Object constructor for individual videos.
function Video(title, id, description, thumbnail, date, owner, ownerId) {
    this.title = title;
    this.id = id;
    this.description = description;
    this.thumbnail = thumbnail;
    this.date = currentTime.diff(moment(date), "hours");
    this.owner = owner;
    this.ownerId = ownerId;
    var _this = this;
    //The following properties are added on creation: Duration, views, likes, dislikes.
}

function Playlist(title, id, description, thumbnail, owner, ownerId) {
    this.title = title;
    this.id = id;
    this.url = "http://www.youtube.com/embed/videoseries?list=" + this.id;
    this.description = description;
    this.thumbnail = thumbnail;
    this.owner = owner;
    this.ownerId = ownerId;
}

//Object constructor for individual channels.
function Channel(readableName, channelId, avatar) {
    var tempVideoIds = [];      //Temp array of video ids for requesting their info.
    this.videos = [];
    this.readableName = readableName;
    this.channelId = channelId;
    this.avatar = avatar;
    this.playlists = [];
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
            if (result.error) { errorHandling(); }
            if (result.items && result.pageInfo && result.pageInfo.totalResults > 0) {
                for (var k = 0; k < result.items.length; k++) {
                    tempVideoIds[k] = result.items[k].id.videoId;
                    _this.videos[k] = new Video(result.items[k].snippet.title, result.items[k].id.videoId, result.items[k].snippet.description, result.items[k].snippet.thumbnails.medium.url, result.items[k].snippet.publishedAt, _this.readableName, _this.channelId);
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
            maxResults: 50
        });
        request.execute(function(result) {
            if (result.items) {
                for (var x = 0; x < result.items.length; x++) {
                    _this.videos[x].duration = result.items[x].contentDetails.duration.replace("PT", "").toLowerCase();
                    _this.videos[x].views = result.items[x].statistics.viewCount;
                    _this.videos[x].likes = result.items[x].statistics.likeCount;
                    _this.videos[x].dislikes = result.items[x].statistics.dislikeCount;
                }
            }
        });
    });
    this.display = function(key) {    //Called by User Display method.
        var multiple = (this.videos.length > 1 ? "s" : "");
        chanList.push('<div id="chan"><a href="#' + this.channelId + '" title="' + this.readableName + ' &bull; ' + this.videos.length + '"><img src="' + this.avatar + '" width="80px" height="80px"/></a></div>');    //Avatar display. Light border if Channel has videos. Hover tooltip includes title and # videos.
        html.push('<div id="chan' + this.channelId + '" class="chanTitle" align="center"><span class="title"><h1><a name="' + this.channelId + '"><a href="http://www.youtube.com/channel/' + this.channelId + '" target="_blank"><img src="' + this.avatar
         + '" width="80px" height="80px"/>' + this.readableName + '</a></a> &bull; <a name="numResults">' + this.videos.length + '</a> video' + multiple + ' since '+ now.format('MMMM Do') + ' &bull; </h1><a href="#" id="vid" onClick="popup(\'playlists\', \''+ key + '\', \''+ this.channelId + '\');return false;">View Playlists</a></span><br /><a href="#top">&uarr; TOP &uarr;</a></div>');
        for (var i = 0; i < this.videos.length; i++) {
            currentUser.newVideos++;
            html.push('<div id="vid' + currentUser.newVideos + '" class="video"><a href="#" id="vid" onClick="popup(\'' + i + '\', \''+ key + '\', \''+ this.channelId + '\');return false;"><span class="title">' + this.videos[i].title + '</span><br /><img src="' + this.videos[i].thumbnail
             + '" width="295px"/></a><p>' + this.videos[i].date + ' hours ago &bull; ' + this.videos[i].duration + ' &bull; ' + this.videos[i].views + ' Views &bull; &uarr; ' + this.videos[i].likes + ', &darr; ' + this.videos[i].dislikes
              + '<br /><a href="#" id="addToQueue" onClick="currentUser.addToQueue(\'' + i + '\', \''+ key + '\');return false;">Add to queue</a><p><span class="desc">' + this.videos[i].description + '</span></div>');
        }
    };
    this.getPlaylists = function(callback) {
        if (_this.playlists.length === 0) {
            var request = gapi.client.youtube.playlists.list({
                part: 'snippet',
                maxResults: 50,
                channelId: _this.channelId
            });
            request.execute(function(result) {
                if (result.error) { errorHandling(); }
                if (result.items && result.pageInfo && result.pageInfo.totalResults > 0) {
                    for (var k = 0; k < result.items.length; k++) {
                        _this.playlists[k] = new Playlist(result.items[k].snippet.title, result.items[k].id, result.items[k].snippet.description, result.items[k].snippet.thumbnails.high.url, _this.readableName, _this.channelId);
                        if (k === result.items.length-1) {
                            callback();
                        }
                    }
                }
            });
        } else {
            callback();
        }
    };
}

function closeDialog() {
    $("#contentWindow").dialog("close");
}


//Clean up plox
function popup(key, chan, chanId) {
    if (key === "playlists") {
        playlistHtml = '<div id="removeDialog" class="remove" onClick="closeDialog()"><h1>Close</h1></div><br /><br /><div id="vid"></div>';
        currentUser.subscriptions[chan].getPlaylists(function () {
            var playlists = currentUser.subscriptions[chan].playlists;
            for (var i = 0; i < currentUser.subscriptions[chan].playlists.length; i++) {
                playlistHtml += '<div id="queue' + i + '" class="videoPlaylist"><a href="#" id="vid" onClick="currentUser.replaceVideo(' + i + ',' + chan + ', \'playlist\');return false;"><span class="videoInfo"><span class="title">'
                 + playlists[i].title + '</span><br /><img src="' + playlists[i].thumbnail + '" width="295px"/></a><p><a href="http://www.youtube.com/channel/' + playlists[i].ownerId + '" target="_blank">' + playlists[i].owner
                  + '</a><br /><p><span class="desc">' + playlists[i].description + '</span></span></div>';
                if (i === currentUser.subscriptions[chan].playlists.length-1) {
                    $("#contentWindow").dialog({
                        resizable: false,
                        draggable: true,
                        position: {
                            my: "center top",
                            at: "center bottom",
                            of: "#chan"+chanId
                        },
                        open: function() {
                            document.getElementById("contentWindow").innerHTML = playlistHtml;
                        },
                        autoOpen: true
                    });
                    $("#contentWindow").css({
                        'display' : 'inline-block',
                        'overflow-y' : 'scroll',
                        'height' : '870px'
                    });
                }
            }
        });
        return;
    }
    var videoMod = currentUser.subscriptions[chan].videos[key];
    queueHtml = '<div id="removeDialog" class="remove" onClick="closeDialog()"><h1>Close</h1></div><div id="vid"><iframe width="853" height="480" src="//www.youtube.com/embed/' + videoMod.id + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1><a href="http://www.youtube.com/channel/' + videoMod.ownerId + '" target="_blank">' + videoMod.owner + '</a> &bull; ' + videoMod.date + ' hours ago &bull; ' + videoMod.duration + ' Views &bull; &uarr; ' + videoMod.likes + ', &darr; ' + videoMod.dislikes + ' &bull; <a href="http://www.youtube.com/watch?v=' + videoMod.id + '" target="_blank">View on YouTube</a></h1></div>';
    if (currentUser.queue.length > 0) {
        for (var i = 0; i < currentUser.queue.length; i++) {
            var queue = currentUser.subscriptions[currentUser.queue[i][1]].videos[currentUser.queue[i][0]];
            queueHtml += '<div id="queue' + i + '" class="video"><div id="remove" onClick="currentUser.removeFromQueue(' + i + ')">X</div><a href="" id="vid" onClick="currentUser.replaceVideo(' + currentUser.queue[i][0] + ',' + currentUser.queue[i][1] + ', \'video\');return false;"><span class="videoInfo"><span class="title">'
             + queue.title + '</span><br /><img src="https://i.ytimg.com/vi/' + queue.id + '/mqdefault.jpg" width="295px"/></a><p><a href="http://www.youtube.com/channel/' + queue.ownerId + '" target="_blank">' + queue.owner
              + '</a><br />' + queue.date + ' hours ago &bull; ' + queue.duration + ' &bull; ' + queue.views + ' Views &bull; &uarr; ' + queue.likes + ', &darr; ' + queue.dislikes + '<br /><p><span class="desc">' + queue.description + '</span></span></div>';
            if (i === currentUser.queue.length-1) {
                $("#contentWindow").dialog({
                    resizable: false,
                    draggable: true,
                    position: {
                        my: "center top",
                        at: "center bottom",
                        of: "#chan"+chanId
                    },
                    open: function() {
                        document.getElementById("contentWindow").innerHTML = queueHtml;
                    },
                    autoOpen: true
                });
                $(".ui-dialog").css("width", "auto");
                $("#contentWindow").css({
                    'display' : 'inline-block',
                    'overflow' : 'auto',
                    'height' : 'auto'
                });
            }
        }
    } else {
        $("#contentWindow").dialog({
            resizable: false,
            draggable: true,
            position: {
                my: "center top",
                at: "center bottom",
                of: "#chan"+chanId
            },
            autoOpen: true,
            open: function() {
                document.getElementById("contentWindow").innerHTML = queueHtml;
            }
        });
        $(".ui-dialog").css("width", "auto");
        $("#contentWindow").css({
            'display' : 'inline-block',
            'overflow' : 'auto',
            'height' : 'auto'
        });
    }
}

//User Object
function User() {
    this.viewport = $(window).width();
    this.nextPage;
    this.numDaysToDisplay = $.cookie("days");
    this.subscriptions = [];
    this.queue = [];
    this.newVideos = 0;
    this.totalSubs = 0;
    this.currentPage = 0;
    var _this = this;
    this.idCheck = function() {
        if ($.cookie("user").match(/UC+(?=\w{22})/) !== null) {    //User entered their channel id.
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
            if (result.error) {errorHandling();}
            if (result.pageInfo.totalResults === 0) {
                alert("User not found.");
                logout();
            }
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
            if (result.error) {errorHandling();}
            if (result.items === 0) {
                alert("Subscriptions not found.");
                logout();
            }
            if (_this.totalSubs === 0) {_this.totalSubs = result.pageInfo.totalResults;}
            loading(80, 'Parsing ' + _this.totalSubs + ' subscriptions');
            //Channel creation.
            for (var i = 0; i < result.items.length; i++) {
                _this.subscriptions[_this.subscriptions.length] = new Channel(result.items[i].snippet.title, result.items[i].snippet.resourceId.channelId, result.items[i].snippet.thumbnails.high.url);
            }
            if (result.nextPageToken !== _this.nextPage && result.nextPageToken !== undefined) {
                _this.nextPage = result.nextPageToken;
                _this.getSubscriptions(true);
            } else {
                checkTick = setInterval(_this.lastSubCheckTick, 1000);
            }
        });
    };
    this.addToQueue = function(video, chan) {
        _this.queue.push([video, chan]);
    };
    this.removeFromQueue = function(key) {
        _this.queue.splice(key, 1);
        $("#queue" + key).remove();
    };
    this.replaceVideo = function(key, chan, type) {
        if (type === "playlist") {
            var videoMod = currentUser.subscriptions[chan].playlists[key];
            $("#contentWindow div#vid").replaceWith('<div id="vid"><iframe width="853" height="480" src="' + videoMod.url + '" frameborder="0" allowfullscreen></iframe><br /><h1>' + videoMod.title + ' &bull; <a href="http://www.youtube.com/channel/' + videoMod.ownerId + '" target="_blank">' + videoMod.owner + '</a> &bull; <a href="' + videoMod.url + '" target="_blank">View on YouTube</a></h1></div>');
        } else if (type === "video"){
            var videoMod = currentUser.subscriptions[chan].videos[key];
            $("#contentWindow div#vid").replaceWith('<div id="vid"><iframe width="853" height="480" src="//www.youtube.com/embed/' + videoMod.id + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1><a href="http://www.youtube.com/channel/' + videoMod.ownerId + '" target="_blank">' + videoMod.owner + '</a> &bull; ' + videoMod.date + ' hours ago &bull; ' + videoMod.duration + ' Views &bull; &uarr; ' + videoMod.likes + ', &darr; ' + videoMod.dislikes + ' &bull; <a href="http://www.youtube.com/watch?v=' + videoMod.id + '" target="_blank">View on YouTube</a></h1></div>');
        }
}
    this.display = function() {
        var tempChanCount = 0;
        for (var i = 0; i < this.subscriptions.length; i++) {
            if (this.subscriptions[i].videos.length > 0) {
                this.subscriptions[i].display(tempChanCount);
            } else {
                //Channel has no videos. Avatar border is dark and links to their YouTube channel page.
                chanList.push('<div id="noVids"><a href="http://www.youtube.com/channel/' + this.subscriptions[i].channelId + '" target="_blank" title="' + this.subscriptions[i].readableName + '"><img src="' + this.subscriptions[i].avatar
                 + '" width="80px" height="80px"/></a></div>');
            }
            tempChanCount++;
        }
        $(document).tooltip();

        /*$('#container').css("width", 68.85416666666667/100*_this.viewport + 'px');*/
        $('#info3').css("background-image", "url('" + this.avatar + "')");
        $('#info3').css("background-size", "100%");
        $('#header').remove();
        $("#info:hidden").show();
        $("#info3:hidden").show();
        $("#chanList:hidden").show();
        //Append user info to page.
        document.getElementById('info3').innerHTML = '<div id="userInfo"><span class="infoTitle3"><span class="title"><a href="http://www.youtube.com/channel/' + this.userId + '" target="_blank">' + this.readableName + '</a></span><p>Total Videos: ' + this.newVideos
         + '| Total Subscriptions: ' + this.totalSubs + '</p></div><div id="clearCookies"><a href="" onClick="logout();return false;">Logout</a></div>';
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
    $("#progressbar").progressbar({ max: 100 });
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