# glsl-transition

> Make Transitions Effects with the power of WebGL Shaders (GLSL)

[**Open The Example**](https://gre.github.com/glsl-transition/example)

[Please checkout GLSL.io](http://glsl.io/)


# Getting Started

[![npm install glsl-transition](https://nodei.co/npm/glsl-transition.png?mini=true)](http://npmjs.org/package/glsl-transition)
```javascript
// Using Browserify
var GlslTransition = require("glsl-transition");
```

or the bundle way: [Download glsl-transition.js](https://github.com/gre/glsl-transition/blob/master/dist/glsl-transition.js)
```javascript
// Using requirejs
require(["glsl-transition"], function (GlslTransition) {});
// Using bundle version
var GlslTransition = window.GlslTransition;
```

Example
---

```javascript
var canvasTransition = GlslTransition(canvas);
var awesomeTransition1 = canvasTransition(glslSourceCode);
var awesomeTransition2 = canvasTransition(anotherGlslSourceCode);
var linear = function linear (x) { return x; };
var square = function (x) { return x*x; };

awesomeTransition1({ from: img1, to: img2 }, 500, linear)
  .then(function(){
    return awesomeTransition2({ from: img2, to: img3 }, 1000);
  })
  .then(function(){
    return awesomeTransition1({ from: img3, to: img1 }, 2000, square);
  })
  ...;
```


## The API

```javascript
GlslTransition(canvas, opts)(glsl, uniforms)(uniforms, duration, easing) // => Promise
```

It is important to have these 3-level function calls, both for **optimization** and **usability** purposes.

* The *first call* **creates a Transitions context with a Canvas** and optionally some options. Available options:
  * `contextAttributes`: an object which overrides default Context Attributes to give in `getContext`.

* The *second call* **creates a GLSL Transition for this context** with a **fragment shader** `glsl` source code and optionally some default uniform values.
  * For each `{ key: value }` in that uniform object, `value` will be mapped to the uniform named `key`.

* Finally, the *third call* **performs this transition** for given `uniforms` *(which overrides those given at the second call level)*, for a `duration` in milliseconds and using an `easing` function. The returned value of this transition call is a **Promise** resolved when transition has succeed or rejected if it has failed (rare cases like WebGL Context Lost).

* The result of a successful Promise is a metadata object containing: 
  * `startAt`: milliseconds timestamp of the start time.
  * `endAt`: milliseconds timestamp of the end time.
  * `elapsedTime`: milliseconds effective duration of the transition.
  * `frames`: number of redraw during the transition.

### `uniforms` object and GLSL conventions

the `uniforms` first argument of the transition call is an object statically given to the GLSL fragment.

The library will map JavaScript types to your GLSL fragment. For more infos on bindings, see [gl-shader-core](https://github.com/mikolalysenko/gl-shader-core).

However, **there is some uniform name conventions for the GLSL to be compatible with this library:**

The only 2 requirements is that you need a **"progress" float uniform** and a **"resolution" vec2 uniform**. The `progress` uniform will be changed over the duration time from 0.0 to 1.0. The `resolution` uniform contains the canvas size.

Most of the transition you may define is about moving from an image to another. For that need, the convention we are taking is to name your `uniform sample2D` image variables: **`from` and `to`**.

### `duration` number

duration is the time of the transition in milliseconds.

### `easing` function

The easing function parameter is optional, by default a linear function is used.
This function takes a `t` value in parameter which goes linearly from 0.0 to 1.0 and must returns your easing value.

Don't reinvent the wheel, there is plenty of easing functions library.
Here is mine: [https://github.com/gre/bezier-easing](https://github.com/gre/bezier-easing).

## Error handling

There is two kind of errors detected by the library: "static" errors and "runtime" errors (generally browser-related error).

What I mean by "static" errors are bad usage of the library we can detect when creating a GlslTransition. Here is some example:
 - **Missing or bad arguments**.
 - **The glsl source code has compilation errors**.

I mean by "runtime" errors, errors we can only detect when running the application, and are generally browser-related.
For instance, if **the WebGL is not supported**.

In this library, "static" errors will be thrown by the library whereas "runtime" errors will be wrapped in failure promises so there are safe to use and recover on need.

That library doesn't solve for you any fallback, the idea is that the end user choose how to fallback it.
You can test with `GlslTransition.isSupported` if a transition is likely to be supported.
Another more functional way to do it is also to recover the promise resulting of a transition with the code you want.

Tests
---

[**Open Tests Here**](http://greweb.me/glsl-transition/test)

[![SauceLabs Status](https://saucelabs.com/browser-matrix/glsl-transition.svg)](https://saucelabs.com/u/glsl-transition)

// Oops, SauceLabs doesn't support WebGL yet. but [this may come soon](https://twitter.com/saucelabs/status/418861018400313344)!


## See also

This library took its inspiration from [Zanimo](https://github.com/peutetre/Zanimo) transition, which is a CSS Transitions + Promise library.

You could easily make an abstraction of GLSL and CSS transitions out of **glsl-transition**, [Zanimo](https://github.com/peutetre/Zanimo) and [https://github.com/gre/bezier-easing](https://github.com/gre/bezier-easing) !
