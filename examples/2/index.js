var Q = require("q");
var Qimage = require("qimage");
var raf = require("raf");
var GlslTransitions = require("glsl-transitions").sort(function (a, b) {
  return b.stars - a.stars;
});
var createTexture = require("gl-texture2d");
var createTransition = require("../..");

Q.all([
  Qimage.anonymously("http://i.imgur.com/N8a9CkZ.jpg"),
  Qimage.anonymously("http://i.imgur.com/MQtLWbD.jpg")
]).spread(function (fromImage, toImage) {
  var canvas = document.createElement("canvas");
  canvas.style.display = "block";
  canvas.width = 600;
  canvas.height = 400;
  var gl = canvas.getContext("webgl");
  if (!gl) throw new Error("webgl context is not supported.");
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  var from = createTexture(gl, fromImage);
  var to = createTexture(gl, toImage);
  var transitionItem, transition;

  raf(function loop (t) {
    raf(loop);
    if (transition) {
      var progress = (t/1500) % 2;
      if (progress > 1) progress = 2 - progress; // backwards
      transition.render(progress, from, to, transitionItem.uniforms);
    }
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
