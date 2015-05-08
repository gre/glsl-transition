var raf = require("raf");
var createTexture = require("gl-texture2d");
var createTransition = require("../..");
var GlslTransitions = require("glsl-transitions").sort(function (a, b) {
  return b.stars - a.stars;
});
var videos = require("./videos");

videos.then(function (videos) {

  var canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.width = 600;
  canvas.height = 400;
  var gl = canvas.getContext("webgl");
  if (!gl) throw new Error("webgl context is not supported.");

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  var from = createTexture(gl, videos[0]);
  var to = createTexture(gl, videos[1]);
  var transitionItem, transition;

  var duration = 1500;

  videos.forEach(function (video) {
    video.loop = true;
    video.play();
  });

  raf(function loop (t) {
    raf(loop);
    var i = Math.floor(t / duration) % videos.length;
    var j = (i + 1) % videos.length;
    from.setPixels(videos[i]);
    to.setPixels(videos[j]);
    var progress = (t % duration) / duration;
    if (transition) transition.render(progress, from, to, transitionItem.uniforms);
  });

  function setTransition (i) {
    transitionItem = GlslTransitions[i];
    if (transition) transition.dispose();
    transition = createTransition(gl, transitionItem.glsl);
  }

  var select = document.createElement("select");
  select.style.width = "600px";
  GlslTransitions.forEach(function (t) {
    var option = document.createElement("option");
    option.textContent = t.name;
    select.appendChild(option);
  });
  select.addEventListener("change", function () {
    setTransition(select.selectedIndex);
  });
  setTransition(select.selectedIndex);

  document.body.innerHTML = "";
  document.body.appendChild(select);
  document.body.appendChild(canvas);
}).done();
document.body.innerHTML = "Loading...";
