// Handle the examples videos loading

var Q = require("q");
var Qvideo = require("./qvideo");
var videos;
var v = document.createElement('video');
var canPlayWebm = v.canPlayType && v.canPlayType('video/webm').replace(/no/, '');
var canPlayMp4 = v.canPlayType && v.canPlayType('video/mp4').replace(/no/, '');
if (canPlayMp4 || canPlayWebm) {
  videos = Q.all([
    "./videos/cut1",
    "./videos/cut2",
    "./videos/cut3"
  ].map(function (url) {
    return Qvideo(url+(!canPlayWebm ? ".mp4" : ".webm"), { event: "canplaythrough" });
  }));
}
else {
  console.error(new Error("Can't play any video format (webm | mp4)."));
}

module.exports = videos;
