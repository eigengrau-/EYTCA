var queue;
function replaceVideo(video) {
    document.getElementById('vid').innerHTML = '<div id="vid"><iframe width="1280" height="720" src="//www.youtube.com/embed/' + queue[video][0] + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1>'
     + queue[video][1] + ' hours ago &bull; ' + queue[video][2] + ' Views &bull; &uarr; ' + queue[video][3] + ', &darr; ' + queue[video][4] + ' &bull; <a href="http://www.youtube.com/watch?v=' + queue[video][0]
      + '" target="_blank">View on YouTube</a></h1></div>';
}
function removeFromQueue(video) {
    if (video === "all") {
        queue = [];
    } else {
        queue.splice(video, 1);
    }
    $.cookie("queue", JSON.stringify(this.queue), {
        path: "/eytca/",
        expires: 365
    });
    location.reload();
}
$(document).ready(function(){
    if ($.cookie("videoPopup")) {
        var videoMod = $.cookie("videoPopup").split(',');
        $("div.videoHeader").html(videoMod[5]);
        document.title = "EYTCA: " + videoMod[5];
        document.getElementById('vid').innerHTML = '<div id="vid"><iframe width="1280" height="720" src="//www.youtube.com/embed/' + videoMod[0]
         + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1><a href="http://www.youtube.com/channel/' + videoMod[9] + '" target="_blank">' + videoMod[8] + '</a> &bull; ' + videoMod[1] + ' hours ago &bull; '
          + videoMod[2] + ' Views &bull; &uarr; ' + videoMod[3] + ', &darr; ' + videoMod[4] + ' &bull; <a href="http://www.youtube.com/watch?v=' + videoMod[0] + '" target="_blank">View on YouTube</a></h1></div>';
    }
    if ($.cookie("queue") && $.cookie("queue") !== "[]") {
        queue = JSON.parse($.cookie("queue"));
        queueHtml = "";
        for (var i = 0; i < queue.length; i++) {
            queueHtml += '<div id="video"><div id="remove" onClick="removeFromQueue(' + [i] + ')">X</div><a href="" id="vid" onClick="replaceVideo(\'' + [i] + '\');return false;"><span class="videoInfo"><span class="title">'
             + queue[i][5] + '</span><br /><img src="https://i.ytimg.com/vi/' + queue[i][0] + '/mqdefault.jpg" width="295px"/></a><p><a href="http://www.youtube.com/channel/' + queue[i][9] + '" target="_blank">' + queue[i][8]
              + '</a><br />' + queue[i][1] + ' hours ago &bull; ' + queue[i][7] + ' &bull; ' + queue[i][2] + ' Views &bull; &uarr; ' + queue[i][3] + ', &darr; ' + queue[i][4] + '<br /><p><span class="desc">' + queue[i][6]
               + '</span></span></div>';
            if (i === queue.length-1) {
                document.getElementById('contentArea').innerHTML += queueHtml;
            }
        }
        $('#contentArea').show();
    }
    videoMod = "";
});