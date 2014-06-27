var playlists;
function replaceVideo(video) {
        document.getElementById('vid').innerHTML = '<div id="vid"><iframe width="1280" height="720" src="' + playlists[video].url + '" frameborder="0" allowfullscreen></iframe><br /><h1><a href="' + playlists[video].url + '" target="_blank">View on YouTube</a></h1></div>';
}
$(document).ready(function(){
    playlists = JSON.parse($.cookie("playlists"));
    $.removeCookie('playlists', { path: "/eytca/playlists.html" });
    for (var i = 0; i < playlists.length; i++) {
        playlistHtml += '<div id="video"><a href="#" id="vid" onClick="replaceVideo(' + [i] + ', ' + true + ');return false;"><span class="videoInfo"><span class="title">'
         + playlists[i].title + '</span><br /><img src="' + playlists[i].thumbnail + '" width="295px"/></a><p><a href="http://www.youtube.com/channel/' + playlists[i].ownerId + '" target="_blank">' + playlists[i].owner
          + '</a><br /><p><span class="desc">' + playlists[i].description + '</span></span></div>';
        if (i === playlists.length-1) {
            document.getElementById('contentArea').innerHTML += playlistHtml;
        }
    }
    $('#contentArea').show();
    playlistHtml = "";
});