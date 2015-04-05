var createShader  = require("gl-shader");

var vertexShader = 'attribute vec2 position; void main() { gl_Position = vec4(2.0*position-1.0, 0.0, 1.0);}';

function GlslTransition (gl, fragmentShader) {
  if (!(this instanceof GlslTransition))  return new GlslTransition(gl, fragmentShader);
  this.gl = gl;
  this.shader = createShader(gl, vertexShader, fragmentShader);
  this.buffer = gl.createBuffer();
}

module.exports = GlslTransition;

GlslTransition.prototype = {
  dispose: function () {
    this.shader.dispose();
    this.gl.deleteBuffer(this.buffer);
    this.shader = null;
    this.buffer = null;
  },

  render: function (progress, from, to, extraUniforms) {
    var gl = this.gl;
    var shader = this.shader;
    var unit = 0;
    shader.bind();
    this._checkViewport();
    shader.uniforms.progress = progress;
    shader.uniforms.from = from.bind(unit++);
    shader.uniforms.to = to.bind(unit++);
    for (var key in extraUniforms) {
      var value = extraUniforms[key];
      if (value && value.bind) {
        shader.uniforms[key] = value.bind(unit++);
      }
      else if (shader.uniforms[key] !== value) {
        shader.uniforms[key] = value;
      }
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },

  _checkViewport: function () {
    var gl = this.gl;
    var canvas = gl.canvas;
    var w = canvas.width, h = canvas.height;
    if (this._w!==w || this._h!==h) {
      this._syncViewport(w, h);
      this._w = w;
      this._h = h;
    }
  },

  _syncViewport: function (w, h) {
    var gl = this.gl;
    var shader = this.shader;
    var buffer = this.buffer;
    var x1 = 0, x2 = w, y1 = 0, y2 = h;
    shader.uniforms.resolution = new Float32Array([ w, h ]);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    shader.attributes.position.pointer();
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      x1, y1,
      x2, y1,
      x1, y2,
      x1, y2,
      x2, y1,
      x2, y2
    ]), gl.STATIC_DRAW);
    gl.viewport(x1, y1, x2, y2);
  }
};
