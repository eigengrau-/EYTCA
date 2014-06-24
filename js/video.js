var queue;
function replaceVideo(video) {
    document.getElementById('vid').innerHTML = '<div id="vid"><iframe width="1280" height="720" src="//www.youtube.com/embed/' + queue[video][1] + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1>'
     + queue[video][3] + ' hours ago | ' + queue[video][5] + ' Views | &uarr; ' + queue[video][6] + ', &darr; ' + queue[video][7] + ' | <a href="http://www.youtube.com/watch?v=' + queue[video][1]
      + '" target="_blank">View on YouTube</a></h1></div>';
}
function removeFromQueue(video) {
    queue.splice(video, 1);
    $.cookie("queue", JSON.stringify(this.queue), {
        path: "/eytca/",
        expires: 365
    });
    location.reload();
}
$(document).ready(function(){
    if ($.cookie("videoPopup")) {
        var videoMod = $.cookie("videoPopup").split(",");
        document.title = "EYTCA: " + videoMod[5];
        document.getElementById('vid').innerHTML = '<div id="vid"><iframe width="1280" height="720" src="//www.youtube.com/embed/' + videoMod[0] + '?version=3&vq=hd1080" frameborder="0" allowfullscreen></iframe><br /><h1>'
         + videoMod[1] + ' hours ago | ' + videoMod[2] + ' Views | &uarr; ' + videoMod[3] + ', &darr; ' + videoMod[4] + ' | <a href="http://www.youtube.com/watch?v=' + videoMod[0] + '" target="_blank">View on YouTube</a></h1></div>';
    }
    if ($.cookie("queue") && $.cookie("queue") !== "[]") {
        queue = JSON.parse($.cookie("queue"));
        for (i = 0; i < queue.length; i++) {
            queueHtml += '<div id="video"><a href="" id="vid" onClick="replaceVideo(\'' + [i] + '\');return false;"><img src="https://i.ytimg.com/vi/' + queue[i][1] + '/mqdefault.jpg" width="235px"/><span class="videoInfo"><span class="title">'
             + queue[i][0] + '</span></a><p>' + queue[i][3] + ' hours ago | ' + queue[i][4] + ' | ' + queue[i][5] + ' Views | &uarr; ' + queue[i][6] + ', &darr; ' + queue[i][7] + '<br /><a href="#" onClick="removeFromQueue('
              + [i] + ')">Remove</a><p><span class="desc">' + queue[i][2] + '</span></span></div>';
        }
        document.getElementById('contentArea').innerHTML = '<p>Queue: ' + queueHtml;
        $('#contentArea').show();
    }
    videoMod = "";
});