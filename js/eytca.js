var popupWindow, now, enteredUserName, enteredDaysToDisplay, currentUser, errMsg, nextPage, totalPages, totalResults, requestType, totalSubs, responseString, result, checkTick, moment, gapi, currentTime;
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
    $.removeCookie("queue", { path: "/eytca/" });
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
    this.trimTitle = function() {
        if (_this.title.length > 80 ) {
            var tempTitle = _this.title;
            _this.title = tempTitle.slice(0, 77) + "...";
        }
    }
    this.trimTitle();
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
    _this.getVideos(function() {         //Get Channel's videos, callback function requests all videos info.
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
        var multiple = (_this.videos.length > 1 ? "s" : "");
        chanList.push('<div id="chan"><a href="#' + _this.channelId + '" title="' + _this.readableName + ' &bull; ' + _this.videos.length + '"><img src="' + _this.avatar + '"/></a></div>');    //Avatar display. Light border if Channel has videos. Hover tooltip includes title and # videos.
        for (var i = 0; i < _this.videos.length; i++) {
            var multipleDate;
            if (_this.videos[i].date > 1) {
                multipleDate =  _this.videos[i].date + " hours ago";
            } else if (_this.videos[i].date === 0) {
                multipleDate = "< 1 hour ago";
            } else {
                multipleDate =  _this.videos[i].date + " hour ago";
            }
            currentUser.newVideos++;
            if (i === 0) {
                html.push('<div id="chan' + _this.channelId + '"><span class="chanTitle"><span class="title"><h1><a name="' + _this.channelId + '"><a href="http://www.youtube.com/channel/' + _this.channelId + '" target="_blank"><img src="' + _this.avatar
                + '"/>' + _this.readableName + '</a></a> &bull; <a name="numResults">' + _this.videos.length + '</a> video' + multiple + ' since '+ now.format('MMMM Do') + ' &bull; </h1><a href="javascript: popupWindow = new Popup(\'playlists\', \''+ key + '\', \''+ _this.channelId + '\');" id="vid">View Playlists</a></span><br /><a href="#top">&uarr; TOP &uarr;</a></span>');
            }
            html.push('<div id="vid' + currentUser.newVideos + '" class="video" title="' + _this.videos[i].description + '"><a href="javascript: popupWindow = new Popup(\'' + i + '\', \''+ key + '\', \''+ _this.channelId + '\');" id="vid"><span class="title">' + _this.videos[i].title + '</span><br /><img src="' + _this.videos[i].thumbnail
             + '" /></a><p>' + multipleDate + ' &bull; ' + _this.videos[i].duration + ' &bull; ' + _this.videos[i].views + ' Views <br /> &uarr; ' + _this.videos[i].likes + ', &darr; ' + _this.videos[i].dislikes
              + '<br /><a href="javascript: currentUser.addToQueue(\'' + i + '\', \''+ key + '\', \''+ _this.videos[i].id + '\');" id="addToQueue">Add to queue</a></div>');
            if (i === _this.videos.length - 1) {
                html.push('</div>');
            }
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

//Video popup object
function Popup(key, chan, chanId) {
    this.key = key;
    this.chan = chan;
    this.chanId = chanId;
    this.playlistHtml;
    this.queueHtml;
    this.playlists;
    this.videoMod;
    this.queue;
    var _this = this;
    this.closeDialog = function() {
        $("#contentWindow").dialog("destroy");
    };
    this.replaceVideo = function(key, chan, type) {    //Replaced currently displayed video with one from the queue.
        if (type === "playlist") {
            _this.videoMod = currentUser.subscriptions[chan].playlists[key];
            $("#contentWindow div#vid").replaceWith('<div id="vid"><iframe width="100%" height="80%" src="' + _this.videoMod.url + '" frameborder="0" allowfullscreen></iframe><br /><h1>' + _this.videoMod.title + ' &bull; <a href="http://www.youtube.com/channel/' + _this.videoMod.ownerId + '" target="_blank">' + _this.videoMod.owner + '</a> &bull; <a href="' + _this.videoMod.url + '" target="_blank">View on YouTube</a></h1></div>');
        } else if (type === "video"){
            _this.videoMod = currentUser.subscriptions[chan].videos[key];
            $('.ui-dialog-titlebar').html('<div id="removeDialog" class="remove" onClick="popupWindow.closeDialog()"><h1>X</h1></div> <span class="title">' + _this.videoMod.title + '</span>');
            $("#contentWindow div#vid").replaceWith('<div id="vid"><iframe width="100%" height="80%" src="//www.youtube.com/embed/' + _this.videoMod.id + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1><a href="http://www.youtube.com/channel/' + _this.videoMod.ownerId + '" target="_blank">' + _this.videoMod.owner + '</a> &bull; ' + _this.videoMod.date + ' hours ago &bull; ' + _this.videoMod.duration + ' Views &bull; &uarr; ' + _this.videoMod.likes + ', &darr; ' + _this.videoMod.dislikes + ' &bull; <a href="http://www.youtube.com/watch?v=' + _this.videoMod.id + '" target="_blank">View on YouTube</a></h1></div>');
        }
    };
    this.openWindow = function() {
        if ($(".ui-dialog").length > 0 ) {
            _this.closeDialog();
        }
        $("#contentWindow").dialog({
            resizable: false,
            draggable: true,
            position: {
                my: "center top",
                at: "center bottom",
                of: "#chan" + chanId
            },
            autoOpen: true,
            open: function() {
                $('.ui-dialog-titlebar').empty();
                if (key === "playlists") {
                    document.getElementById("contentWindow").innerHTML = _this.playlistHtml;
                    $('.ui-dialog-titlebar').append('<div id="removeDialog" class="remove" onClick="popupWindow.closeDialog()"><h1>X</h1></div>');
                    $("#contentWindow").css({
                        'display' : 'inline-block',
                        'overflow-y' : 'scroll',
                        'height' : '870px'
                    });
                } else {
                    document.getElementById("contentWindow").innerHTML = _this.queueHtml;
                    $('.ui-dialog-titlebar').append('<div id="removeDialog" class="remove" onClick="popupWindow.closeDialog()"><h1>X</h1></div> <span class="title">' + _this.videoMod.title + '</span>');
                    $("#contentWindow").css({
                        'display' : 'inline-block',
                        'overflow' : 'auto',
                        'height' : 'auto'
                    });
                }
            }
        });
        $(window).scrollTop($('.ui-dialog').offset().top);    //Scroll to opened dialog.
    };
    this.init = function(callback) {
        if (key === "playlists") {
            _this.playlistHtml = '<div id="vid"></div>';
            currentUser.subscriptions[_this.chan].getPlaylists(function () {
                _this.playlists = currentUser.subscriptions[_this.chan].playlists;
                for (var i = 0; i < currentUser.subscriptions[_this.chan].playlists.length; i++) {
                    _this.playlistHtml += '<div id="queue' + i + '" class="videoPlaylist" title="' + _this.playlists[i].description + '"><a href="javascript: popupWindow.replaceVideo(' + i + ',' + _this.chan + ', \'playlist\')" id="vid"><span class="videoInfo"><span class="title">'
                     + _this.playlists[i].title + '</span><br /><img src="' + _this.playlists[i].thumbnail + '" /></a><p><a href="http://www.youtube.com/channel/' + _this.playlists[i].ownerId + '" target="_blank">' + _this.playlists[i].owner
                      + '</a></span></div>';
                    if (i === currentUser.subscriptions[_this.chan].playlists.length - 1) {
                        popupWindow.openWindow();
                    }
                }
            });
        } else {
            _this.videoMod = currentUser.subscriptions[_this.chan].videos[_this.key];
            _this.queueHtml = '<div id="vid"><iframe width="100%" height="80%" src="//www.youtube.com/embed/' + _this.videoMod.id + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1><a href="http://www.youtube.com/channel/' + _this.videoMod.ownerId + '" target="_blank">' + _this.videoMod.owner + '</a> &bull; ' + _this.videoMod.date + ' hours ago &bull; ' + _this.videoMod.duration + ' Views &bull; &uarr; ' + _this.videoMod.likes + ', &darr; ' + _this.videoMod.dislikes + ' &bull; <a href="http://www.youtube.com/watch?v=' + _this.videoMod.id + '" target="_blank">View on YouTube</a></h1></div>';
            if (currentUser.queue.length > 0) {
                for (var i = 0; i < currentUser.queue.length; i++) {
                    _this.queue = currentUser.subscriptions[currentUser.queue[i][1]].videos[currentUser.queue[i][0]];
                    _this.queueHtml += '<div id="queue' + i + '" class="videoQueue" title="'+ _this.queue.description +'"><div id="remove" onClick="currentUser.removeFromQueue(' + i + ')">X</div><a href="" id="vid" onClick="popupWindow.replaceVideo(' + currentUser.queue[i][0] + ',' + currentUser.queue[i][1] + ', \'video\');return false;"><span class="title">'
                     + _this.queue.title + '</span><br /><img src="https://i.ytimg.com/vi/' + _this.queue.id + '/mqdefault.jpg" /></a><p><a href="http://www.youtube.com/channel/' + _this.queue.ownerId + '" target="_blank">' + _this.queue.owner
                      + '</a><br />' + _this.queue.date + ' hours ago &bull; ' + _this.queue.duration + ' &bull; ' + _this.queue.views + ' Views &bull; &uarr; ' + _this.queue.likes + ', &darr; ' + _this.queue.dislikes + '<br /></div>';
                }
                _this.openWindow();
            } else {
                _this.openWindow();
            }
        }
    };
    this.init();
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
    this.temp;
    this.addToQueue = function(video, chan, vidID) {
        _this.queue.push([video, chan, vidID]);
        $.cookie("queue", JSON.stringify(_this.queue), {
            path: "/eytca/",
            expires: 365
        });
    };
    this.removeFromQueue = function(key) {
        _this.queue.splice(key, 1);
        $("#queue" + key).remove();
        $.cookie("queue", JSON.stringify(_this.queue), {
            path: "/eytca/",
            expires: 365
        });
    };
    this.verifyQueue = function() {
        if ($.cookie("queue")) {
            var tempQueue = JSON.parse($.cookie("queue"));
            console.log(tempQueue);
            for (var i = 0; i < tempQueue.length; i++) {
                //Not detecting expired videos still
                if (_this.subscriptions[tempQueue[i][0]].videos[tempQueue[i][1]] === undefined || _this.subscriptions[tempQueue[i][0]].videos[tempQueue[i][1]].id != tempQueue[i][2]) {
                    console.log("Expired video(s) removed from queue: " + tempQueue[i]);
                    tempQueue.splice(i, 1);
                }
            }
            _this.queue = tempQueue;
            $.cookie("queue", JSON.stringify(_this.queue), {
                path: "/eytca/",
                expires: 365
            });
        }
    }
    this.display = function() {
        var tempChanCount = 0;
        for (var i = 0; i < _this.subscriptions.length; i++) {
            if (_this.subscriptions[i].videos.length > 0) {
                _this.subscriptions[i].display(tempChanCount);
            } else {
                //Channel has no videos. Avatar border is dark and links to their YouTube channel page.
                chanList.push('<div id="noVids"><a href="http://www.youtube.com/channel/' + _this.subscriptions[i].channelId + '" target="_blank" title="' + _this.subscriptions[i].readableName + '"><img src="' + _this.subscriptions[i].avatar
                 + '" /></a></div>');
            }
            tempChanCount++;
        }
        //Append user info to page.
        document.getElementById('info3').innerHTML = '<div id="userInfo"><span class="infoTitle3"><span class="title"><a href="http://www.youtube.com/channel/' + _this.userId + '" target="_blank">' + _this.readableName + '</a></span><p>Total Videos: ' + _this.newVideos
         + '| Total Subscriptions: ' + _this.totalSubs + '</p></div><div id="clearCookies"><a href="" onClick="logout();return false;">Logout</a></div>';
        document.getElementById('chanList').innerHTML = chanList.join('');
        //Append main content to page.
        document.getElementById('contentArea').innerHTML = html.join('');
        _this.verifyQueue();
        $(document).tooltip({ tooltipClass: "custTooltip", position: { my: "center top", at: "center bottom" } });
        $('#info3').css("background-image", "url('" + _this.avatar + "')");
        $('#info3').css("background-size", "100%");
        $('#header').remove();
        $("#info:hidden").show();
        $("#info3:hidden").show();
        $("#chanList:hidden").show();
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
    gapi.client.load('youtube', 'v3', function() {
        loading(20, "API Loaded");
        gapi.client.setApiKey('AIzaSyBPXzLUhHv5pQZMz9VpSl7pJps-0efWks4');
        //User object creation.
        currentUser = new User();
    });
    currentTime = moment();
}