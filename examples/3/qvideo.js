var Q = require("q");
var Qajax = require("qajax");

// Video loading with promise.
// using an ajax request as a workaround to help some browsers...

function Qvideo (url, options) {

  return Qajax(url, { responseType: "blob" }).then(function (xhr) {
    if (typeof options !== "object") options={};
    if (!options.event) options.event = "canplaythrough";
    var d = Q.defer();
    var video;
    try {
      video = new window.Video();
    } catch (e) {
      video = document.createElement('video');
    }

    video.src = window.URL.createObjectURL(xhr.response);
    video.addEventListener(options.event, function onLoadEvent () {
      video.removeEventListener(options.event, onLoadEvent);
      d.resolve(video);
    }, false);
    video.onerror = function (e) {
      console.error(e&&e.stack||e);
      d.reject(new Error("Video "+url+" failed to load: "+e));
    };
    video.load();
    return d.promise;
  });
}

module.exports = Qvideo;
