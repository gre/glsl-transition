var GlslTransitionCore = require("glsl-transition-core");
var Q = require("q");
var requestAnimationFrame = require("raf");
var now = require("performance-now");

// We may share and custom this if required
var PROGRESS_UNIFORM = "progress";
var RESOLUTION_UNIFORM = "resolution";

function extend (obj) {
  for(var a=1; a<arguments.length; ++a) {
    var source = arguments[a];
    for (var prop in source)
      if (source[prop] !== void 0) obj[prop] = source[prop];
  }
  return obj;
}

function identity (x) { return x; }

function TransitionAbortedError (message) {
  this.message = message;
  this.stack = (new Error()).stack;
}
TransitionAbortedError.prototype = new Error();
TransitionAbortedError.prototype.name = "TransitionAbortedError";

/**
 * API:
 * GlslTransition(canvas)(glslSource, options)(uniforms, duration, easing) // => Promise
 *
 * The 2 first levels of the API is a thin wrapper to GlslTransitionCore.
 */

/**
 * ~~~ First Call in the API
 * GlslTransition(canvas)
 * Creates a Transitions context with a canvas.
 */
function GlslTransition (canvas/*, opts*/) {

  var currentAnimationD;
  
  function onContextLost () {
    if (currentAnimationD) {
      currentAnimationD.reject(new TransitionAbortedError("WebGL Context Lost"));
      currentAnimationD = null;
    }
  }

  var createTransitionCore = GlslTransitionCore.apply(this, arguments);
  createTransitionCore.onContextLost(onContextLost);

  function createTransition (glsl, defaultUniforms) {
    var transitionCore = createTransitionCore.apply(this, arguments);
    var glslUniforms = transitionCore.getUniforms();
    
    if (typeof defaultUniforms !== "object") defaultUniforms = {};
    if (arguments.length < 1 || arguments.length > 2 || typeof glsl !== "string")
      throw new Error("Bad arguments. usage: T(glsl [, options])");

    for (var name in defaultUniforms) {
      if (name === RESOLUTION_UNIFORM) {
        throw new Error("The '"+name+"' uniform is reserved, you must not use it.");
      }
      if (!(name in glslUniforms)) {
        throw new Error("uniform '"+name+"': This uniform does not exist in your GLSL code.");
      }
    }

    if (!currentAnimationD) transitionCore.load();

    function animate (transitionDuration, transitionEasing, allUniforms) {
      var transitionStart = now();
      var frames = 0;
      var fromWillNeedRefresh = !(allUniforms.from instanceof window.HTMLImageElement);
      var toWillNeedRefresh = !(allUniforms.to instanceof window.HTMLImageElement);
      var d = Q.defer();
      currentAnimationD = d;
      (function render () {
        if (currentAnimationD !== d) return;
        ++ frames;
        var t = now();
        var p = (t-transitionStart)/transitionDuration;
        try {
          if (p<1) {
            requestAnimationFrame(render, canvas);
            if (fromWillNeedRefresh) transitionCore.setUniform("from", allUniforms.from);
            if (toWillNeedRefresh) transitionCore.setUniform("to", allUniforms.to);
            transitionCore.setProgress(transitionEasing(p));
            transitionCore.draw();
          }
          else {
            if (fromWillNeedRefresh) transitionCore.setUniform("from", allUniforms.from);
            if (toWillNeedRefresh) transitionCore.setUniform("to", allUniforms.to);
            transitionCore.setProgress(transitionEasing(1));
            transitionCore.draw();
            d.resolve({ startAt: transitionStart, endAt: t, elapsedTime: t-transitionStart, frames: frames }); // Resolve some meta-data of the successful transition.
            currentAnimationD = null;
          }
        }
        catch (e) {
          d.reject(e);
          currentAnimationD = null;
        }
      }());
      return d.promise;
    }

    /**
     * ~~~ Third Call in the API
     * transition(uniforms, duration, [easing])
     * Perform a transition animation with uniforms paremeters to give in the GLSL, for a given duration and a custom easing function (default is linear).
     */
    function transition (uniforms, duration, easing) {
      if (!easing) easing = identity;

      // Validate static errors: Bad arguments / missing uniforms
      if (arguments.length < 2 || arguments.length > 3 || typeof uniforms !== "object" || typeof duration !== "number" || duration <= 0 || typeof easing !== "function")
        throw new Error("Bad arguments. usage: t(uniforms, duration, easing) -- uniforms is an Object, duration an integer > 0, easing an optional function.");

      var allUniforms = extend({}, defaultUniforms, uniforms);
      allUniforms[PROGRESS_UNIFORM] = easing(0);
      var name;
      for (name in glslUniforms) {
        if (name === RESOLUTION_UNIFORM) continue;
        if (!(name in allUniforms)) {
          throw new Error("uniform '"+name+"': You must provide an initial value.");
        }
      }
      for (name in uniforms) {
        if (name === RESOLUTION_UNIFORM) {
          throw new Error("The '"+name+"' uniform is reserved, you must not use it.");
        }
        if (!(name in glslUniforms)) {
          throw new Error("uniform '"+name+"': This uniform does not exist in your GLSL code.");
        }
      }

      // Validate Runtime errors
      if (!createTransitionCore.getGL()) return Q.reject(new Error("WebGL context is null."));
      if (currentAnimationD) return Q.reject(new Error("another transition is already running."));
      try {
        transitionCore.load();
      }
      catch (e) {
        return Q.reject(e);
      }

      transitionCore.bind();

      // Set all uniforms
      for (name in allUniforms) {
        transitionCore.setUniform(name, allUniforms[name]);
      }
      transitionCore.syncViewport();

      // Perform the transition
      return animate(duration, easing, allUniforms);
    }

    transition.destroy = function () {
      if (transitionCore.isCurrentTransition() && currentAnimationD) {
        currentAnimationD.reject(new TransitionAbortedError("Transition destroyed."));
        currentAnimationD = null;
      }
      transitionCore.destroy();
    };

    transition.core = transitionCore;
    return transition;
  }

  createTransition.core = createTransitionCore;
  createTransition.abort = function () {
    if (currentAnimationD) {
      currentAnimationD.reject(new TransitionAbortedError("Transition aborted by user."));
      currentAnimationD = null;
    }
  };

  return createTransition;
}

GlslTransition.TransitionAbortedError = TransitionAbortedError;
GlslTransition.defaults = GlslTransitionCore.defaults;
GlslTransition.isSupported = GlslTransitionCore.isSupported;

// Also exposes the internal libraries to be usable in the dist version
GlslTransition.GlslTransitionCore = GlslTransitionCore;
GlslTransition.Q = Q;
GlslTransition.requestAnimationFrame = requestAnimationFrame;
GlslTransition.now = now;


module.exports = GlslTransition;
