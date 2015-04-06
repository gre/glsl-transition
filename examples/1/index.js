var baboon = require("baboon-image");
var lena = require("lena");
var createTexture = require("gl-texture2d");
var createTransition = require("../..");
var CubeTransition = { // from "glsl-transitions"
  "glsl" : "#ifdef GL_ES\nprecision highp float;\n#endif\nuniform sampler2D from, to;\nuniform float progress;\nuniform vec2 resolution;\n\nuniform float persp;\nuniform float unzoom;\nuniform float reflection;\nuniform float floating;\n\nvec2 project (vec2 p) {\n  return p * vec2(1.0, -1.2) + vec2(0.0, -floating/100.);\n}\n\nbool inBounds (vec2 p) {\n  return all(lessThan(vec2(0.0), p)) && all(lessThan(p, vec2(1.0)));\n}\n\nvec4 bgColor (vec2 p, vec2 pfr, vec2 pto) {\n  vec4 c = vec4(0.0, 0.0, 0.0, 1.0);\n  pfr = project(pfr);\n  if (inBounds(pfr)) {\n    c += mix(vec4(0.0), texture2D(from, pfr), reflection * mix(1.0, 0.0, pfr.y));\n  }\n  pto = project(pto);\n  if (inBounds(pto)) {\n    c += mix(vec4(0.0), texture2D(to, pto), reflection * mix(1.0, 0.0, pto.y));\n  }\n  return c;\n}\n\n// p : the position\n// persp : the perspective in [ 0, 1 ]\n// center : the xcenter in [0, 1] \\ 0.5 excluded\nvec2 xskew (vec2 p, float persp, float center) {\n  float x = mix(p.x, 1.0-p.x, center);\n  return (\n    (\n      vec2( x, (p.y - 0.5*(1.0-persp) * x) / (1.0+(persp-1.0)*x) )\n      - vec2(0.5-distance(center, 0.5), 0.0)\n    )\n    * vec2(0.5 / distance(center, 0.5) * (center<0.5 ? 1.0 : -1.0), 1.0)\n    + vec2(center<0.5 ? 0.0 : 1.0, 0.0)\n  );\n}\n\nvoid main() {\n  vec2 op = gl_FragCoord.xy / resolution.xy;\n  float uz = unzoom * 2.0*(0.5-distance(0.5, progress));\n  vec2 p = -uz*0.5+(1.0+uz) * op;\n  vec2 fromP = xskew(\n    (p - vec2(progress, 0.0)) / vec2(1.0-progress, 1.0),\n    1.0-mix(progress, 0.0, persp),\n    0.0\n  );\n  vec2 toP = xskew(\n    p / vec2(progress, 1.0),\n    mix(pow(progress, 2.0), 1.0, persp),\n    1.0\n  );\n  if (inBounds(fromP)) {\n    gl_FragColor = texture2D(from, fromP);\n  }\n  else if (inBounds(toP)) {\n    gl_FragColor = texture2D(to, toP);\n  }\n  else {\n    gl_FragColor = bgColor(op, fromP, toP);\n  }\n}",
  "uniforms": { "persp": 0.7, "unzoom": 0.3, "reflection": 0.4, "floating": 3.0 }
};

var transition, from, to;
var shell = require("gl-now")();
shell.on("gl-init", function() {
  var gl = shell.gl;
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  transition = createTransition(gl, CubeTransition.glsl);
  to = createTexture(gl, baboon.transpose(1, 0));
  from = createTexture(gl, lena.transpose(1, 0));
});

shell.on("gl-render", function () {
  transition.render((Date.now() / 1000) % 1, from, to, CubeTransition.uniforms);
});
