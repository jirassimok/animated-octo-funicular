// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"zcw9":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.AnimationTracker = exports.AnimationState = void 0;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Class tracking state of each animation (translation, rotation, and explosion)
 *
 * The current animation state is stored in the variable {@code animationState},
 * which should be the only instance of this class. Do not attempt to save
 * references to its value, as it will change when the state is reset.
 *
 * Explosion and rotation are represented as pausable timers that increase while
 * the animations are running.
 *
 * The translations are represented as bi-directional timers that increase for
 * positive motion and decrease for negative motion.
 *
 * The animations' effects are determined by functions of the timers' values in
 * {@link drawMesh}.
 *
 * @property {PausableTimer} explosion time spent in explosion/pulse animation
 *
 * @property {AnimationTracer} xrotation State of rotation around X-axis
 *
 * @property {ReversableTimer} xtranslation difference between time spent moving
 *                                          in positive and negative X direction
 * @property {ReversableTimer} ytranslation difference between time spent moving
 *                                          in positive and negative Y direction
 * @property {ReversableTimer} ztranslation difference between time spent moving
 *                                          in positive and negative Z direction
 */
var AnimationState =
/*#__PURE__*/
function () {
  /**
   * Create a new animation state obejct using the given settings object.
   *
   * @param {Object} settings The animations' settings.
   *
   * The settings object may be modified to change the animation's settings.
   *
   * To replace the animation state, use the {@code reset} method.
   */
  function AnimationState(settings) {
    _classCallCheck(this, AnimationState);

    this.id = null; // The ID of the current animation frame

    this.settings = settings;
    this.initialize(settings);
  }

  _createClass(AnimationState, [{
    key: "initialize",
    value: function initialize(settings) {
      this.explosion = new AnimationTracker(function () {
        return settings.explosion_speed;
      });
      this.xrotation = new AnimationTracker(function () {
        return settings.rotation_speed;
      });
      this.xtranslation = new AnimationTracker(function () {
        return settings.x_speed;
      });
      this.ytranslation = new AnimationTracker(function () {
        return settings.y_speed;
      });
      this.ztranslation = new AnimationTracker(function () {
        return settings.z_speed;
      });
      this.animations = [this.explosion, this.xrotation, this.xtranslation, this.ytranslation, this.ztranslation];
      this.translations = [this.xtranslation, this.ytranslation, this.ztranslation];
    }
    /** * Reset the global animation state */

  }, {
    key: "reset",
    value: function reset() {
      this.initialize(this.settings);
    }
    /** * Request an animation frame and save its ID */

  }, {
    key: "animate",
    value: function animate(callback) {
      this.id = window.requestAnimationFrame(callback);
    }
  }, {
    key: "cancel",
    value: function cancel() {
      if (this.id !== null) {
        window.cancelAnimationFrame(this.id);
      }
    }
  }, {
    key: "stopAnimations",
    value: function stopAnimations() {
      this.animations.forEach(function (a) {
        return a.stop();
      });
    }
  }, {
    key: "stopTranslations",
    value: function stopTranslations() {
      this.translations.forEach(function (a) {
        return a.stop();
      });
    }
  }]);

  return AnimationState;
}();
/**
 * Timer for animations; tracks position in an animation
 *
 * @property {number} speed A function that will return the animation's speed in
 *                          units per millisecond
 * @property {?number} lastupdated The time the animation was last updated, or
 *                                 null if the animation is not running
 * @property {number} scale A multiplier for the speed, useful for reversing (-1)
 *
 * Whenever the animation is checked, if it is running, the time since the last
 * check is multiplied by its speed and scale, and the result is added to the
 * position.
 *
 * Every millisecond that the animation runs, it moves an amount equal to the
 * product of its speed and scale.
 */


exports.AnimationState = AnimationState;

var AnimationTracker =
/*#__PURE__*/
function () {
  function AnimationTracker() {
    var speed = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {
      return 1;
    };

    _classCallCheck(this, AnimationTracker);

    this.speed = speed;
    this.scale = 1;
    this.lastupdated = null;
    this._position = 0;
  }
  /** @returns time since position was last updated */


  _createClass(AnimationTracker, [{
    key: "timeSinceUpdate",
    value: function timeSinceUpdate() {
      return window.performance.now() - this.lastupdated;
    }
    /** Update the animation's position by its speed */

  }, {
    key: "updatePosition",
    value: function updatePosition() {
      if (this.lastupdated) {
        this._position += this.scale * this.speed() * this.timeSinceUpdate();
        this.lastupdated = window.performance.now();
      }
    } // Main public API

  }, {
    key: "isrunning",
    value: function isrunning() {
      return this.lastupdated !== null;
    }
    /**
     * Get the current position in the animation
     */

  }, {
    key: "start",
    value: function start() {
      if (!this.lastupdated) {
        this.lastupdated = window.performance.now();
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      this.updatePosition();
      this.lastupdated = null;
    }
    /**
     * Toggle the animation and return whether it is running
     */

  }, {
    key: "toggle",
    value: function toggle() {
      if (this.lastupdated) {
        this.stop();
      } else {
        this.start();
      }

      return this.lastupdated !== null;
    }
  }, {
    key: "position",
    get: function get() {
      this.updatePosition();
      return this._position;
    }
  }]);

  return AnimationTracker;
}();

exports.AnimationTracker = AnimationTracker;
},{}],"pSFd":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.radians = radians;
exports.vec2 = vec2;
exports.vec3 = vec3;
exports.vec4 = vec4;
exports.mat2 = mat2;
exports.mat3 = mat3;
exports.mat4 = mat4;
exports.equal = equal;
exports.add = add;
exports.subtract = subtract;
exports.mult = mult;
exports.translate = translate;
exports.rotate = rotate;
exports.rotateX = rotateX;
exports.rotateY = rotateY;
exports.rotateZ = rotateZ;
exports.scalem = scalem;
exports.lookAt = lookAt;
exports.ortho = ortho;
exports.perspectiveDeg = perspectiveDeg;
exports.perspectiveRad = perspectiveRad;
exports.transpose = transpose;
exports.dot = dot;
exports.negate = negate;
exports.cross = cross;
exports.length = length;
exports.normalize = normalize;
exports.mix = mix;
exports.scale = scale;
exports.flatten = flatten;
exports.printm = printm;
exports.det2 = det2;
exports.det3 = det3;
exports.det4 = det4;
exports.det = det;
exports.inverse2 = inverse2;
exports.inverse3 = inverse3;
exports.inverse4 = inverse4;
exports.inverse = inverse;
exports.normalMatrix = normalMatrix;

//////////////////////////////////////////////////////////////////////////////
//
//  Angel.js
//
//////////////////////////////////////////////////////////////////////////////
//
//  Modified for use as an ES6 module.
//  Style improved.
//  Some ES6 features added.
//
//////////////////////////////////////////////////////////////////////////////
function argumentsToArray(args) {
  return [].concat.apply([], Array.prototype.slice.apply(args));
} //----------------------------------------------------------------------------
//
//  Helper functions
//
//----------------------------------------------------------------------------


function radians(degrees) {
  return degrees * Math.PI / 180.0;
} //----------------------------------------------------------------------------
//
//  Vector Constructors
//


function vec2() {
  // argumensToArray allows inputs to be any combination of individual
  // elements and arrays.
  var args = argumentsToArray(arguments);

  switch (args.length) {
    // Intentional fallthrough
    case 0:
      args.push(0);
    // x

    case 1:
      args.push(0);
    // y
  }

  return args.slice(0, 2);
}

function vec3() {
  var args = argumentsToArray(arguments);

  switch (args.length) {
    // Intentional fallthrough
    case 0:
      args.push(0);
    // x

    case 1:
      args.push(0);
    // y

    case 2:
      args.push(0);
    // z
  }

  return args.slice(0, 3);
}

function vec4() {
  var x = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
  var y = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
  var w = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
  var args = argumentsToArray(arguments);

  switch (args.length) {
    // Intentional fallthrough
    case 0:
      args.push(0);
    // x

    case 1:
      args.push(0);
    // y

    case 2:
      args.push(0);
    // z

    case 3:
      args.push(1);
    // w
  }

  return args.slice(0, 4);
} //----------------------------------------------------------------------------
//
//  Matrix Constructors
//


function mat2() {
  var v = argumentsToArray(arguments);
  var m = [];

  switch (v.length) {
    case 0:
      v[0] = 1;

    case 1:
      m = [vec2(v[0], 0.0), vec2(0.0, v[0])];
      break;

    default:
      m.push(vec2(v));
      v.splice(0, 2);
      m.push(vec2(v));
      break;
  }

  m.matrix = true;
  return m;
} //----------------------------------------------------------------------------


function mat3() {
  var v = argumentsToArray(arguments);
  var m = [];

  switch (v.length) {
    case 0:
      v[0] = 1;

    case 1:
      m = [vec3(v[0], 0.0, 0.0), vec3(0.0, v[0], 0.0), vec3(0.0, 0.0, v[0])];
      break;

    default:
      m.push(vec3(v));
      v.splice(0, 3);
      m.push(vec3(v));
      v.splice(0, 3);
      m.push(vec3(v));
      break;
  }

  m.matrix = true;
  return m;
} //----------------------------------------------------------------------------


function mat4() {
  var v = argumentsToArray(arguments);
  var m = [];

  switch (v.length) {
    case 0:
      v[0] = 1;

    case 1:
      m = [vec4(v[0], 0.0, 0.0, 0.0), vec4(0.0, v[0], 0.0, 0.0), vec4(0.0, 0.0, v[0], 0.0), vec4(0.0, 0.0, 0.0, v[0])];
      break;

    default:
      m.push(vec4(v));
      v.splice(0, 4);
      m.push(vec4(v));
      v.splice(0, 4);
      m.push(vec4(v));
      v.splice(0, 4);
      m.push(vec4(v));
      break;
  }

  m.matrix = true;
  return m;
} //----------------------------------------------------------------------------
//
//  Generic Mathematical Operations for Vectors and Matrices
//


function equal(u, v) {
  if (u.length !== v.length) {
    return false;
  }

  if (u.matrix && v.matrix) {
    for (var i = 0; i < u.length; ++i) {
      if (u[i].length !== v[i].length) {
        return false;
      }

      for (var j = 0; j < u[i].length; ++j) {
        if (u[i][j] !== v[i][j]) {
          return false;
        }
      }
    }
  } else if (u.matrix && !v.matrix || !u.matrix && v.matrix) {
    return false;
  } else {
    for (var _i = 0; _i < u.length; ++_i) {
      if (u[_i] !== v[_i]) {
        return false;
      }
    }
  }

  return true;
} //----------------------------------------------------------------------------


function add(u, v) {
  var result = [];

  if (u.matrix && v.matrix) {
    if (u.length !== v.length) {
      throw "add(): trying to add matrices of different dimensions";
    }

    for (var i = 0; i < u.length; ++i) {
      if (u[i].length !== v[i].length) {
        throw "add(): trying to add matrices of different dimensions";
      }

      result.push([]);

      for (var j = 0; j < u[i].length; ++j) {
        result[i].push(u[i][j] + v[i][j]);
      }
    }

    result.matrix = true;
    return result;
  } else if (u.matrix && !v.matrix || !u.matrix && v.matrix) {
    throw "add(): trying to add matrix and non-matrix variables";
  } else {
    if (u.length !== v.length) {
      throw "add(): vectors are not the same dimension";
    }

    for (var _i2 = 0; _i2 < u.length; ++_i2) {
      result.push(u[_i2] + v[_i2]);
    }

    return result;
  }
} //----------------------------------------------------------------------------


function subtract(u, v) {
  var result = [];

  if (u.matrix && v.matrix) {
    if (u.length !== v.length) {
      throw "subtract(): trying to subtract matrices" + " of different dimensions";
    }

    for (var i = 0; i < u.length; ++i) {
      if (u[i].length !== v[i].length) {
        throw "subtract(): trying to subtact matrices" + " of different dimensions";
      }

      result.push([]);

      for (var j = 0; j < u[i].length; ++j) {
        result[i].push(u[i][j] - v[i][j]);
      }
    }

    result.matrix = true;
    return result;
  } else if (u.matrix && !v.matrix || !u.matrix && v.matrix) {
    throw "subtact(): trying to subtact  matrix and non-matrix variables";
  } else {
    if (u.length !== v.length) {
      throw "subtract(): vectors are not the same length";
    }

    for (var _i3 = 0; _i3 < u.length; ++_i3) {
      result.push(u[_i3] - v[_i3]);
    }

    return result;
  }
} //----------------------------------------------------------------------------


function mult() {
  for (var _len = arguments.length, m = new Array(_len), _key = 0; _key < _len; _key++) {
    m[_key] = arguments[_key];
  }

  if (m.length === 0) {
    throw "mult(): trying to multiply no matrices";
  }

  return m.reduce(_mult);
}

function _mult(u, v) {
  var result = [];

  if (u.matrix && v.matrix) {
    if (u.length !== v.length) {
      throw "mult(): trying to add matrices of different dimensions";
    }

    for (var i = 0; i < u.length; ++i) {
      if (u[i].length !== v[i].length) {
        throw "mult(): trying to add matrices of different dimensions";
      }
    }

    for (var _i4 = 0; _i4 < u.length; ++_i4) {
      result.push([]);

      for (var j = 0; j < v.length; ++j) {
        var sum = 0.0;

        for (var k = 0; k < u.length; ++k) {
          sum += u[_i4][k] * v[k][j];
        }

        result[_i4].push(sum);
      }
    }

    result.matrix = true;
    return result;
  }

  if (u.matrix && u.length === v.length) {
    for (var _i5 = 0; _i5 < v.length; _i5++) {
      var _sum = 0.0;

      for (var _j = 0; _j < v.length; _j++) {
        _sum += u[_i5][_j] * v[_j];
      }

      result.push(_sum);
    }

    return result;
  } else {
    if (u.length !== v.length) {
      throw "mult(): vectors are not the same dimension";
    }

    for (var _i6 = 0; _i6 < u.length; ++_i6) {
      result.push(u[_i6] * v[_i6]);
    }

    return result;
  }
} //----------------------------------------------------------------------------
//
//  Basic Transformation Matrix Generators
//


function translate(x, y, z) {
  if (Array.isArray(x) && x.length === 3) {
    z = x[2];
    y = x[1];
    x = x[0];
  }

  var result = mat4();
  result[0][3] = x;
  result[1][3] = y;
  result[2][3] = z;
  return result;
} //----------------------------------------------------------------------------


function rotate(angle, axis) {
  if (!Array.isArray(axis)) {
    axis = [arguments[1], arguments[2], arguments[3]];
  }

  var v = normalize(axis);
  var x = v[0];
  var y = v[1];
  var z = v[2];
  var c = Math.cos(radians(angle));
  var omc = 1.0 - c;
  var s = Math.sin(radians(angle));
  return mat4(vec4(x * x * omc + c, x * y * omc - z * s, x * z * omc + y * s, 0.0), vec4(x * y * omc + z * s, y * y * omc + c, y * z * omc - x * s, 0.0), vec4(x * z * omc - y * s, y * z * omc + x * s, z * z * omc + c, 0.0), vec4());
}

function rotateX(theta) {
  var c = Math.cos(radians(theta));
  var s = Math.sin(radians(theta));
  return mat4(1.0, 0.0, 0.0, 0.0, 0.0, c, -s, 0.0, 0.0, s, c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

function rotateY(theta) {
  var c = Math.cos(radians(theta));
  var s = Math.sin(radians(theta));
  return mat4(c, 0.0, s, 0.0, 0.0, 1.0, 0.0, 0.0, -s, 0.0, c, 0.0, 0.0, 0.0, 0.0, 1.0);
}

function rotateZ(theta) {
  var c = Math.cos(radians(theta));
  var s = Math.sin(radians(theta));
  return mat4(c, -s, 0.0, 0.0, s, c, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0);
} //----------------------------------------------------------------------------


function scalem(x, y, z) {
  if (Array.isArray(x) && x.length === 3) {
    z = x[2];
    y = x[1];
    x = x[0];
  }

  var result = mat4();
  result[0][0] = x;
  result[1][1] = y;
  result[2][2] = z;
  return result;
} //----------------------------------------------------------------------------
//
//  ModelView Matrix Generators
//


function lookAt(eye, at, up) {
  if (!Array.isArray(eye) || eye.length !== 3) {
    throw "lookAt(): first parameter [eye] must be an a vec3";
  }

  if (!Array.isArray(at) || at.length !== 3) {
    throw "lookAt(): second parameter [at] must be an a vec3";
  }

  if (!Array.isArray(up) || up.length !== 3) {
    throw "lookAt(): third parameter [up] must be an a vec3";
  }

  if (equal(eye, at)) {
    return mat4();
  }

  var v = normalize(subtract(at, eye)); // view direction vector

  var n = normalize(cross(v, up)); // perpendicular vector

  var u = normalize(cross(n, v)); // "new" up vector

  v = negate(v);
  return mat4(vec4(n, -dot(n, eye)), vec4(u, -dot(u, eye)), vec4(v, -dot(v, eye)), vec4());
} //----------------------------------------------------------------------------
//
//  Projection Matrix Generators
//


function ortho(left, right, bottom, top) {
  var near = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
  var far = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : -1;

  if (left === right) {
    throw "ortho(): left and right are equal";
  }

  if (bottom === top) {
    throw "ortho(): bottom and top are equal";
  }

  if (near === far) {
    throw "ortho(): near and far are equal";
  }

  var w = right - left;
  var h = top - bottom;
  var d = far - near;
  var result = mat4();
  result[0][0] = 2.0 / w;
  result[1][1] = 2.0 / h;
  result[2][2] = -2.0 / d;
  result[0][3] = -(left + right) / w;
  result[1][3] = -(top + bottom) / h;
  result[2][3] = -(near + far) / d;
  return result;
} //----------------------------------------------------------------------------


function perspectiveDeg(fovy, aspect, near, far) {
  return perspectiveRad(radians(fovy), aspect, near, far);
}

function perspectiveRad(fovy, aspect, near, far) {
  var f = 1.0 / Math.tan(fovy / 2);
  var d = far - near;
  var result = mat4();
  result[0][0] = f / aspect;
  result[1][1] = f;
  result[2][2] = -(near + far) / d;
  result[2][3] = -2 * near * far / d;
  result[3][2] = -1;
  result[3][3] = 0.0;
  return result;
} //----------------------------------------------------------------------------
//
//  Matrix Functions
//


function transpose(m) {
  if (!m.matrix) {
    return "transpose(): trying to transpose a non-matrix";
  }

  var result = [];

  for (var i = 0; i < m.length; ++i) {
    result.push([]);

    for (var j = 0; j < m[i].length; ++j) {
      result[i].push(m[j][i]);
    }
  }

  result.matrix = true;
  return result;
} //----------------------------------------------------------------------------
//
//  Vector Functions
//


function dot(u, v) {
  if (u.length !== v.length) {
    throw "dot(): vectors are not the same dimension";
  }

  var sum = 0.0;

  for (var i = 0; i < u.length; ++i) {
    sum += u[i] * v[i];
  }

  return sum;
} //----------------------------------------------------------------------------


function negate(u) {
  var result = [];

  for (var i = 0; i < u.length; ++i) {
    result.push(-u[i]);
  }

  return result;
} //----------------------------------------------------------------------------


function cross(u, v) {
  if (!Array.isArray(u) || u.length < 3) {
    throw "cross(): first argument is not a vector of at least 3";
  }

  if (!Array.isArray(v) || v.length < 3) {
    throw "cross(): second argument is not a vector of at least 3";
  }

  return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
} //----------------------------------------------------------------------------


function length(u) {
  return Math.sqrt(dot(u, u));
} //----------------------------------------------------------------------------


function normalize(u, excludeLastComponent) {
  if (excludeLastComponent) {
    var last = u.pop();
  }

  var len = length(u);

  if (!isFinite(len)) {
    throw "normalize: vector " + u + " has zero length";
  }

  for (var i = 0; i < u.length; ++i) {
    u[i] /= len;
  }

  if (excludeLastComponent) {
    u.push(last);
  }

  return u;
} //----------------------------------------------------------------------------


function mix(u, v, s) {
  if (typeof s !== "number") {
    throw "mix: the last paramter " + s + " must be a number";
  }

  if (u.length !== v.length) {
    throw "vector dimension mismatch";
  }

  var result = [];

  for (var i = 0; i < u.length; ++i) {
    result.push((1.0 - s) * u[i] + s * v[i]);
  }

  return result;
} //----------------------------------------------------------------------------
//
// Vector and Matrix functions
//


function scale(s, u) {
  if (!Array.isArray(u)) {
    throw "scale: second parameter " + u + " is not a vector";
  }

  var result = [];

  for (var i = 0; i < u.length; ++i) {
    result.push(s * u[i]);
  }

  return result;
} //----------------------------------------------------------------------------
//
//
//


function flatten(v) {
  if (v.matrix === true) {
    v = transpose(v);
  }

  var n = v.length;
  var elemsAreArrays = false;

  if (Array.isArray(v[0])) {
    elemsAreArrays = true;
    n *= v[0].length;
  }

  var floats = new Float32Array(n);

  if (elemsAreArrays) {
    var idx = 0;

    for (var i = 0; i < v.length; ++i) {
      for (var j = 0; j < v[i].length; ++j) {
        floats[idx++] = v[i][j];
      }
    }
  } else {
    for (var _i7 = 0; _i7 < v.length; ++_i7) {
      floats[_i7] = v[_i7];
    }
  }

  return floats;
} //----------------------------------------------------------------------------


var sizeof = {
  'vec2': new Float32Array(flatten(vec2())).byteLength,
  'vec3': new Float32Array(flatten(vec3())).byteLength,
  'vec4': new Float32Array(flatten(vec4())).byteLength,
  'mat2': new Float32Array(flatten(mat2())).byteLength,
  'mat3': new Float32Array(flatten(mat3())).byteLength,
  'mat4': new Float32Array(flatten(mat4())).byteLength
}; // new functions 5/2/2015
// printing

function printm(m) {
  if (m.length === 2) {
    for (var i = 0; i < m.length; i++) {
      console.log(m[i][0], m[i][1]);
    }
  } else if (m.length === 3) {
    for (var _i8 = 0; _i8 < m.length; _i8++) {
      console.log(m[_i8][0], m[_i8][1], m[_i8][2]);
    }
  } else if (m.length === 4) {
    for (var _i9 = 0; _i9 < m.length; _i9++) {
      console.log(m[_i9][0], m[_i9][1], m[_i9][2], m[_i9][3]);
    }
  }
} // determinants


function det2(m) {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0];
}

function det3(m) {
  return m[0][0] * m[1][1] * m[2][2] + m[0][1] * m[1][2] * m[2][0] + m[0][2] * m[2][1] * m[1][0] - m[2][0] * m[1][1] * m[0][2] - m[1][0] * m[0][1] * m[2][2] - m[0][0] * m[1][2] * m[2][1];
}

function det4(m) {
  var m0 = [vec3(m[1][1], m[1][2], m[1][3]), vec3(m[2][1], m[2][2], m[2][3]), vec3(m[3][1], m[3][2], m[3][3])];
  var m1 = [vec3(m[1][0], m[1][2], m[1][3]), vec3(m[2][0], m[2][2], m[2][3]), vec3(m[3][0], m[3][2], m[3][3])];
  var m2 = [vec3(m[1][0], m[1][1], m[1][3]), vec3(m[2][0], m[2][1], m[2][3]), vec3(m[3][0], m[3][1], m[3][3])];
  var m3 = [vec3(m[1][0], m[1][1], m[1][2]), vec3(m[2][0], m[2][1], m[2][2]), vec3(m[3][0], m[3][1], m[3][2])];
  return m[0][0] * det3(m0) - m[0][1] * det3(m1) + m[0][2] * det3(m2) - m[0][3] * det3(m3);
}

function det(m) {
  if (m.matrix !== true) console.log("not a matrix");
  if (m.length === 2) return det2(m);
  if (m.length === 3) return det3(m);
  if (m.length === 4) return det4(m);
} //---------------------------------------------------------
// inverses


function inverse2(m) {
  var a = mat2();
  var d = det2(m);
  a[0][0] = m[1][1] / d;
  a[0][1] = -m[0][1] / d;
  a[1][0] = -m[1][0] / d;
  a[1][1] = m[0][0] / d;
  a.matrix = true;
  return a;
}

function inverse3(m) {
  var a = mat3();
  var d = det3(m);
  var a00 = [vec2(m[1][1], m[1][2]), vec2(m[2][1], m[2][2])];
  var a01 = [vec2(m[1][0], m[1][2]), vec2(m[2][0], m[2][2])];
  var a02 = [vec2(m[1][0], m[1][1]), vec2(m[2][0], m[2][1])];
  var a10 = [vec2(m[0][1], m[0][2]), vec2(m[2][1], m[2][2])];
  var a11 = [vec2(m[0][0], m[0][2]), vec2(m[2][0], m[2][2])];
  var a12 = [vec2(m[0][0], m[0][1]), vec2(m[2][0], m[2][1])];
  var a20 = [vec2(m[0][1], m[0][2]), vec2(m[1][1], m[1][2])];
  var a21 = [vec2(m[0][0], m[0][2]), vec2(m[1][0], m[1][2])];
  var a22 = [vec2(m[0][0], m[0][1]), vec2(m[1][0], m[1][1])];
  a[0][0] = det2(a00) / d;
  a[0][1] = -det2(a10) / d;
  a[0][2] = det2(a20) / d;
  a[1][0] = -det2(a01) / d;
  a[1][1] = det2(a11) / d;
  a[1][2] = -det2(a21) / d;
  a[2][0] = det2(a02) / d;
  a[2][1] = -det2(a12) / d;
  a[2][2] = det2(a22) / d;
  return a;
}

function inverse4(m) {
  var a = mat4();
  var d = det4(m);
  var a00 = [vec3(m[1][1], m[1][2], m[1][3]), vec3(m[2][1], m[2][2], m[2][3]), vec3(m[3][1], m[3][2], m[3][3])];
  var a01 = [vec3(m[1][0], m[1][2], m[1][3]), vec3(m[2][0], m[2][2], m[2][3]), vec3(m[3][0], m[3][2], m[3][3])];
  var a02 = [vec3(m[1][0], m[1][1], m[1][3]), vec3(m[2][0], m[2][1], m[2][3]), vec3(m[3][0], m[3][1], m[3][3])];
  var a03 = [vec3(m[1][0], m[1][1], m[1][2]), vec3(m[2][0], m[2][1], m[2][2]), vec3(m[3][0], m[3][1], m[3][2])];
  var a10 = [vec3(m[0][1], m[0][2], m[0][3]), vec3(m[2][1], m[2][2], m[2][3]), vec3(m[3][1], m[3][2], m[3][3])];
  var a11 = [vec3(m[0][0], m[0][2], m[0][3]), vec3(m[2][0], m[2][2], m[2][3]), vec3(m[3][0], m[3][2], m[3][3])];
  var a12 = [vec3(m[0][0], m[0][1], m[0][3]), vec3(m[2][0], m[2][1], m[2][3]), vec3(m[3][0], m[3][1], m[3][3])];
  var a13 = [vec3(m[0][0], m[0][1], m[0][2]), vec3(m[2][0], m[2][1], m[2][2]), vec3(m[3][0], m[3][1], m[3][2])];
  var a20 = [vec3(m[0][1], m[0][2], m[0][3]), vec3(m[1][1], m[1][2], m[1][3]), vec3(m[3][1], m[3][2], m[3][3])];
  var a21 = [vec3(m[0][0], m[0][2], m[0][3]), vec3(m[1][0], m[1][2], m[1][3]), vec3(m[3][0], m[3][2], m[3][3])];
  var a22 = [vec3(m[0][0], m[0][1], m[0][3]), vec3(m[1][0], m[1][1], m[1][3]), vec3(m[3][0], m[3][1], m[3][3])];
  var a23 = [vec3(m[0][0], m[0][1], m[0][2]), vec3(m[1][0], m[1][1], m[1][2]), vec3(m[3][0], m[3][1], m[3][2])];
  var a30 = [vec3(m[0][1], m[0][2], m[0][3]), vec3(m[1][1], m[1][2], m[1][3]), vec3(m[2][1], m[2][2], m[2][3])];
  var a31 = [vec3(m[0][0], m[0][2], m[0][3]), vec3(m[1][0], m[1][2], m[1][3]), vec3(m[2][0], m[2][2], m[2][3])];
  var a32 = [vec3(m[0][0], m[0][1], m[0][3]), vec3(m[1][0], m[1][1], m[1][3]), vec3(m[2][0], m[2][1], m[2][3])];
  var a33 = [vec3(m[0][0], m[0][1], m[0][2]), vec3(m[1][0], m[1][1], m[1][2]), vec3(m[2][0], m[2][1], m[2][2])];
  a[0][0] = det3(a00) / d;
  a[0][1] = -det3(a10) / d;
  a[0][2] = det3(a20) / d;
  a[0][3] = -det3(a30) / d;
  a[1][0] = -det3(a01) / d;
  a[1][1] = det3(a11) / d;
  a[1][2] = -det3(a21) / d;
  a[1][3] = det3(a31) / d;
  a[2][0] = det3(a02) / d;
  a[2][1] = -det3(a12) / d;
  a[2][2] = det3(a22) / d;
  a[2][3] = -det3(a32) / d;
  a[3][0] = -det3(a03) / d;
  a[3][1] = det3(a13) / d;
  a[3][2] = -det3(a23) / d;
  a[3][3] = det3(a33) / d;
  return a;
}

function inverse(m) {
  if (m.matrix !== true) console.log("not a matrix");
  if (m.length === 2) return inverse2(m);
  if (m.length === 3) return inverse3(m);
  if (m.length === 4) return inverse4(m);
}

function normalMatrix(m, flag) {
  var a = inverse(transpose(m));
  if (flag !== true) return a;else {
    var b = mat3();

    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 3; j++) {
        b[i][j] = a[i][j];
      }
    }

    return b;
  }
}
},{}],"VGQx":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Extent = void 0;

var _MV = require("./MV+.js");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Class representing the extent of a data file's contents.
 */
var Extent =
/*#__PURE__*/
function () {
  function Extent(left, right, bottom, top) {
    var near = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 1;
    var far = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : -1;

    _classCallCheck(this, Extent);

    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.near = near;
    this.far = far;
  }
  /**
   * Construct the extent of an array of vectors.
   * @param {number[][]} vecs A non-empty array of vectors
   * @return {Extent}
   *
   * The vectors should all have the same length of at least 2.
   *
   * If the list is empty, an error will occur.
   */


  _createClass(Extent, [{
    key: "asortho",

    /** Convert to orthographic projection matrix */
    value: function asortho() {
      return (0, _MV.ortho)(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }
  }, {
    key: "midpoint",
    get: function get() {
      return (0, _MV.vec3)((this.left + this.right) / 2, (this.top + this.bottom) / 2, (this.near + this.far) / 2);
    }
  }, {
    key: "width",
    get: function get() {
      return Math.abs(this.right - this.left);
    }
  }, {
    key: "height",
    get: function get() {
      return Math.abs(this.top - this.bottom);
    }
  }, {
    key: "depth",
    get: function get() {
      return Math.abs(this.near - this.far);
    }
  }, {
    key: "radius",
    get: function get() {
      return Math.sqrt(Math.pow(this.height / 2, 2) + Math.pow(this.width / 2, 2) + Math.pow(this.depth / 2, 2));
    }
  }], [{
    key: "fromVecs",
    value: function fromVecs(vecs) {
      var size = vecs[0].length;
      var extent = new Extent(vecs[0][0], vecs[0][0], vecs[0][1], vecs[0][1], vecs[0][2], vecs[0][2]);
      return vecs.reduce(function (ext, vec) {
        ext.left = Math.min(ext.left, vec[0]);
        ext.right = Math.max(ext.right, vec[0]);
        ext.top = Math.max(ext.top, vec[1]);
        ext.bottom = Math.min(ext.bottom, vec[1]);

        if (size > 2) {
          ext.near = Math.max(ext.near, vec[2]);
          ext.far = Math.min(ext.far, vec[2]);
        }

        return ext;
      }, extent);
    }
    /** Get the default extent */

  }, {
    key: "basic",
    value: function basic() {
      return new Extent(-1, 1, -1, 1, 1, -1);
    }
  }]);

  return Extent;
}();

exports.Extent = Extent;
},{"./MV+.js":"pSFd"}],"Bopp":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readFile = readFile;
exports.parsePly = parsePly;

var _MV = require("./MV+.js");

/**
 * Read and draw a file.
 *
 * @param {Event} event The change event for a file input element.
 *
 * @returns {Promise} A promise containing the file's contents.
 */
function readFile(event) {
  return new Promise(function (resolve) {
    var reader = new FileReader();

    reader.onload = function (e) {
      resolve(e.target.result);
    };

    if (event.target.value !== "") {
      reader.readAsText(event.target.files[0]);
    }
  });
}
/**
 * Parse a limited subset of PLY files
 * @param {String} text  The text of a PLY file
 * @returns {[vec3[], number[][]]} The vertices and faces specified by the file.
 *
 * Only parses ASCII.
 *
 * Only parses files with three vertex properties (named x, y, and z; all
 * float32) and one face property (a list of polygon descriptions, a list of 1
 * uint8 and 3 int32s).
 *
 * Accepts comment lines (any line beginning with "comment").
 *
 * Ignores blank lines after the initial 'ply' line.
 */


function parsePly(text) {
  if (!text.match(/^ply(\r|\n|\r\n)/)) {
    parseError("line 1: expected 'ply'");
  }

  var lines = text.toLowerCase().split(/(\r|\n)+/) // split on any newline (gobbles empty lines)
  .filter(function (line) {
    return !line.startsWith("comment");
  }).map(function (line) {
    return line.trim();
  }).filter(function (line) {
    return line !== "";
  });

  if (lines[1] !== "format ascii 1.0") {
    parseError("line 2: expected 'format ascii 1.0'");
  }

  if (!lines[2].startsWith("element vertex ") || lines[3] !== "property float32 x" || lines[4] !== "property float32 y" || lines[5] !== "property float32 z" || !lines[6].startsWith("element face") || lines[7] !== "property list uint8 int32 vertex_indices" || lines[8] !== "end_header") {
    parseError("in lines 3-9: wrong value");
    ; // line format
  }

  var numvertices = parseInt(lines[2].split(" ")[2]);
  var numfaces = parseInt(lines[6].split(" ")[2]);

  if (isNaN(numvertices) || isNaN(numfaces)) {
    parseError("wrong number of vertices (line 3) or number of faces (line 7)");
  }

  lines = lines.slice(9).map(function (line) {
    return line.split(/\s+/);
  });
  var vertices = lines.slice(0, numvertices).map(function (line) {
    return line.map(parseFloat);
  });
  var faces = lines.slice(numvertices).map(function (line) {
    return line.map(function (n) {
      return parseInt(n);
    });
  });

  if (vertices.some(function (vertex) {
    return vertex.some(isNaN);
  }) || faces.some(function (face) {
    return face.some(isNaN);
  })) {
    parseError("error in vertices or faces");
  }

  if (vertices.length !== numvertices || faces.length !== numfaces) {
    parseError("wrong number of vertices or faces"); // wrong number of lines
  }

  if (vertices.some(function (vertex) {
    return vertex.length !== 3;
  })) {
    parseError("wrong number of coordinates in a vertex");
  }

  if (faces.some(function (face) {
    return face[0] !== face.length - 1;
  })) {
    parseError("wrong number of vertices in a face");
  }

  faces = faces.map(function (face) {
    return face.slice(1);
  }); // remove number of vertices

  return [vertices, faces];
}

function parseError(msg) {
  console.log("parse error: ".concat(msg));
  throw "parse error; see console for details";
}
},{"./MV+.js":"pSFd"}],"ezmQ":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Mesh = void 0;

var _MV = require("./MV+.js");

var _Extent = require("./Extent.js");

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/**
 * Represents a mesh of separable faces.
 *
 * Stores the mesh as a list of vertices, a list of normals for the vertices,
 * and a list of (size, offset) pairs representing the faces by their positions
 * in the other two lists.
 *
 * The constructor takes in a list of vertices and an index array of faces.
 */
var Mesh =
/*#__PURE__*/
function () {
  function Mesh(vertices, faces) {
    var _this = this;

    _classCallCheck(this, Mesh);

    this.extent = _Extent.Extent.fromVecs(vertices); // Copy vertices so each face has its own copies

    this._allvertices = Object.freeze(faces.flatMap(function (face) {
      return face.map(function (v) {
        return vertices[v];
      });
    }));
    var faceoffsets = [];
    var offset = 0; // Create list of (size, offset) pairs per face

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = faces.map(function (face) {
        return face.length;
      })[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var size = _step.value;
        faceoffsets.push(Object.freeze([size, offset]));
        offset += size;
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    this._faces = Object.freeze(faceoffsets);
    this._normals = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      var _loop = function _loop() {
        var face = _step2.value;
        var face2 = face.slice(1).concat(face[0]);
        var vertexpairs = face.map(function (_, i) {
          return [vertices[face[i]], vertices[face2[i]]];
        });
        var x = 0,
            y = 0,
            z = 0;
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
          for (var _iterator3 = vertexpairs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
            var _step3$value = _slicedToArray(_step3.value, 2),
                _step3$value$ = _slicedToArray(_step3$value[0], 3),
                x1 = _step3$value$[0],
                y1 = _step3$value$[1],
                z1 = _step3$value$[2],
                _step3$value$2 = _slicedToArray(_step3$value[1], 3),
                x2 = _step3$value$2[0],
                y2 = _step3$value$2[1],
                z2 = _step3$value$2[2];

            x += (y1 - y2) * (z1 + z2);
            y += (z1 - z2) * (x1 + x2);
            z += (x1 - x2) * (y1 + y2);
          }
        } catch (err) {
          _didIteratorError3 = true;
          _iteratorError3 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
              _iterator3.return();
            }
          } finally {
            if (_didIteratorError3) {
              throw _iteratorError3;
            }
          }
        }

        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
          for (var _iterator4 = face[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
            var _ = _step4.value;

            _this._normals.push((0, _MV.normalize)((0, _MV.vec3)(x, y, z)));
          }
        } catch (err) {
          _didIteratorError4 = true;
          _iteratorError4 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
              _iterator4.return();
            }
          } finally {
            if (_didIteratorError4) {
              throw _iteratorError4;
            }
          }
        }
      };

      for (var _iterator2 = faces[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        _loop();
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }
  /**
   * @returns {vec3[]} An array of the vertices in this mesh.
   */


  _createClass(Mesh, [{
    key: "vertices",
    get: function get() {
      return this._allvertices;
    }
    /**
     * @returns {[number, number][]} the (size, offset) pairs for each face
     */

  }, {
    key: "faceoffsets",
    get: function get() {
      return this._faces;
    }
    /**
     * @returns {vec3[]} an array of normals for the vertices
     */

  }, {
    key: "normals",
    get: function get() {
      return this._normals;
    }
  }]);

  return Mesh;
}();

exports.Mesh = Mesh;
},{"./MV+.js":"pSFd","./Extent.js":"VGQx"}],"RtpY":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setupWebGL = setupWebGL;
exports.enableVAO = enableVAO;
exports.setupProgram = setupProgram;

/* WebGL initialization functions. */

/**
 * Display the {@code #errorMessage} element with the given message
 */
function showError(message) {
  var errelt = document.querySelector("#errorMessage");
  errelt.innerHTML = message;
  errelt.style.display = "block";
}
/**
 * Create and compile a shader of the given type
 * @param {WebGLRenderingContext} gl
 * @param shaderType
 * @param {String} programText
 * @returns {?WebGLShader}
 */


function makeShader(gl, shaderType, programText) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, programText);
  gl.compileShader(shader);

  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  } else {
    console.error("Failed to create shader: " + gl.getShaderInfoLog(shader));
    showError(shaderCreationError(shaderType === gl.VERTEX_SHADER ? "vertex" : "fragment"));
    return null;
  }
}
/**
 * Combine shaders into a program
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {?WebGLProgram}
 */


function linkShaders(gl, vertexShader, fragmentShader) {
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  } else {
    console.error("Failed to link shaders." + gl.getProgramInfoLog(program));
    showError(shaderLinkError);
    return null;
  }
}
/**
 * Create and prepare a WebGL context.
 * @param {HTMLCanvasElement} canvas The canvas on which to draw.
 * @returns {?WebGLRenderingContext} The WebGL context..
 *
 * If the WebGL context is created and the required extensions loaded, it will be
 * returned, otherwise,  will be {@code null}.
 */


function setupWebGL(canvas) {
  var gl = canvas.getContext("webgl");

  if (!gl) {
    showError(webGlSetupError);
    return null;
  }

  return gl;
}
/**
 * Activate the vertex array object extension
 */


function enableVAO(gl) {
  var vao = gl.getExtension("OES_vertex_array_object");

  if (vao === null) {
    showError(VAOError);
    return null;
  }

  return vao;
}
/**
 * Prepare a program from the given WebGL context and shader programs.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {DOMString} vertexShaderProgram The text of the vertex shader program.
 * @param {DOMString} fragmentShaderProgram The text of the fragment shader program.
 * @returns {?WebGLProgram} The program.
 *
 * If the shaders fail to compile or link, the returned program will be {@code null}.
 */


function setupProgram(gl, vertexShaderProgram, fragmentShaderProgram) {
  // Set up shaders and program.
  var vertexShader = makeShader(gl, gl.VERTEX_SHADER, vertexShaderProgram);

  if (vertexShader === null) {
    return null;
  }

  var fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fragmentShaderProgram);

  if (fragmentShader === null) {
    return null;
  }

  var program = linkShaders(gl, vertexShader, fragmentShader);

  if (program === null) {
    return null;
  }

  return program;
} //// Error messages


var webGlSetupError = "\n     <p>Error: unable to create WebGL context.</p>\n     <p>Make sure you are using a browser that supports <a href=\"https://get.webgl.\">WebGL</a>.</p>\n";
var VAOError = "\n    <p>\n        Error: unable to load\n    <a href=\"https://developer.mozilla.org/en-US/docs/Web/API/OES_vertex_array_object\">\n        <code>OES_vertex_array_object</code>\n        </a> extension.\n    </p>\n    <p>Please use a browser that supports this extension, such as\n        <a href=\"https://www.google.com/chrome/\">Google Chrome</a> or\n        <a href=\"https://www.mozilla.org/en-US/firefox/n~ew/\">Firefox</a>.\n    </p>\n";
/**
 * Create an error message for either shadr
 * @param {string} shader Either "vertex" or "fragment"
 */

function shaderCreationError(shader) {
  return "<p>Failed to create ".concat(shader, " shader. View the console for more information.</p>");
}

var shaderLinkError = "<p>Failed to link shaders. View the console for more information.</p>";
},{}],"6idV":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.toggle = toggle;
exports.deactivate = deactivate;
exports.deactivateAll = deactivateAll;
exports.deactivateClass = deactivateClass;
exports.deactivateSelector = deactivateSelector;

/**
 * Get a keyboard key in the user interface by key name, as given by
 * {@link KeyboardEvent.key}, case-insensitive.
 */
function uiKey(key) {
  if (typeof key === "string") {
    return document.querySelector("kbd.key.".concat(key.toLowerCase()));
  } else {
    return key;
  }
}
/**
 * Add the activation hightlight to one key and optionally remove it from another
 * @param {String} key The key to highlight
 * @param {?String} offKey A key to un-highlight
 *
 * @see activateKey
 * @see deactivateKey
 */


function activate(key) {
  var offKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  key = uiKey(key);

  if (key) {
    key.classList.add("active");
  }

  if (offKey) {
    deactivate(offKey);
  }
}
/**
 * Toggle the activation highlight for a keyboard control in the UI
 *
 * @param {String} key The key to toggle
 * @param {?String} offKey A key to deactivate if the toggled key is turned on
 * @param {?boolean} disableShared whether to disabled shared keys
 *
 * If the key has the {@code shared} CSS class and {@code disableShared} is
 * true, deactivate all other keys with that class.
 */


function toggle(key) {
  var offKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
  var disableShared = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
  key = uiKey(key);

  if (key) {
    var active = key.classList.toggle("active");

    if (disableShared && key.classList.contains("shared")) {
      deactivateSelector(".shared");
    }

    if (active) {
      activate(key);

      if (offKey) {
        deactivate(offKey);
      }
    }
  }
}
/**
 * Remove the activation highlight from a keyboard control in the UI
 */


function deactivate(key) {
  key = uiKey(key);

  if (key) {
    key.classList.remove("active");
  }
}
/**
 * Remove highlighting from all keys in the user interface
 */


function deactivateAll() {
  deactivateSelector("*");
}
/**
 * Remove highlighting form all keys with the given class
 */


function deactivateClass(classname) {
  deactivateSelector(".".concat(classname));
}
/**
 * Remove highlighting from keys matching a DOM selector
 *
 * Appends {@code .key} to the selector.
 */


function deactivateSelector(selector) {
  document.querySelectorAll("".concat(selector, ".key")).forEach(function (k) {
    return k.classList.remove("active");
  });
}
},{}],"epB2":[function(require,module,exports) {
/* Extra features:
 *
 * - Pressing F stops all active animations
 * - Pressing Q stops all animations and resets the mesh to its initial position.
 *
 * - Adjustable animation speeds. All of the animations have adjustable speed,
 *   which can be updated without restarting and without causing the animations
 *   to skip.
 * - Adjustable "explosion" magnitude (this will cause the explosion to skip,
 *   because it effects the size of the explosion immediately).
 *
 * - When the checkbox is checked, the mesh may be translated in multiple
 *   directions at the same time.
 *
 * - Anti-lag: animations are based on time passed and position, not frames, so
 *   a delay between frames will not prevent the animation from progressing
 *   normally.
 *
 * - Visual UI: when an animation is active, the corresponding key in the list
 *   of controls is highlighted. The Q and F controls instead highlight when
 *   those keys are pressed.
 */
"use strict";

var _Animations = require("./Animations.js");

var _Extent = require("./Extent.js");

var _filereaders = require("./filereaders.js");

var _Mesh = require("./Mesh.js");

var MV = _interopRequireWildcard(require("./MV+.js"));

var _webglSetup = require("./webgl-setup.js");

var Key = _interopRequireWildcard(require("./KeyboardUI.js"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

//// Constants
// Initial settings. See the settings object.
var EXPLOSION_SCALE = 0.1,
    EXPLOSION_SPEED = 0.01,
    ROTATION_SPEED = 360 / 1000,
    X_SPEED = 0.01,
    Y_SPEED = 0.01,
    Z_SPEED = 0.01,
    MULTI_AXIS_MOVEMENT = false;
var X_FIELD_OF_VIEW = 90,
    ASPECT_RATIO = 5 / 3;
var MIN_CANVAS_HEIGHT = 200;
var PERSPECTIVE_NEAR_PLANE = 0.001,
    PERSPECTIVE_FAR_PLANE = 1000; //// Prepare the canvas

var canvas = document.querySelector("#webglCanvas");
{
  // Set height to either 200 or as tall as it can be without pushing anything else off-screen
  canvas.height = 0;
  var body = window.getComputedStyle(document.body);
  var height = document.body.scrollHeight + parseInt(body.marginTop) + parseInt(body.marginTop);
  canvas.height = Math.max(MIN_CANVAS_HEIGHT, window.innerHeight - height); // Set width to

  canvas.width = canvas.height * ASPECT_RATIO;

  if (canvas.width > document.body.clientWidth) {
    canvas.width = document.body.clientWidth;
    canvas.height = canvas.width / ASPECT_RATIO;
  }
} //// Set up WebGL, the program, buffers, and shader variables

var gl = (0, _webglSetup.setupWebGL)(canvas);

if (gl === null) {
  throw new Error("Failed to set up WebGL");
}

var program = (0, _webglSetup.setupProgram)(gl, document.querySelector("#vertexShader").text, document.querySelector("#fragmentShader").text);

if (program === null) {
  throw new Error("Failed to set up program");
}

gl.useProgram(program);
var buffers = Object.freeze({
  position: gl.createBuffer(),
  // vertices
  normal: gl.createBuffer() // normal vectors

}); // Set up the shader variables

var shader = Object.freeze({
  position: gl.getAttribLocation(program, "aPosition"),
  faceNormal: gl.getAttribLocation(program, "faceNormal"),
  explosionScale: gl.getUniformLocation(program, "explosionScale"),
  modelMatrix: gl.getUniformLocation(program, "modelMatrix"),
  viewMatrix: gl.getUniformLocation(program, "viewMatrix"),
  projectionMatrix: gl.getUniformLocation(program, "projectionMatrix")
}); //// Global animation state

/**
 * Container for configural animation settings
 *
 * @property {number} explosion_scale   multiplier for explosion size
 * @property {number} explosion_speed   percent of explosion per millisecond
 * @property {number} rotation_speed    degrees of rotation per millisecond
 * @property {number} x_speed           multiplier for movement along X-axis
 * @property {number} y_speed           multiplier for movement along Y-axis
 * @property {number} z_speed           multiplier for movement along Z axis
 * @property {boolean} multi_axis_movement whether to allow movement along more
 *                                         than one axis at the same time
 */

var Settings =
/*#__PURE__*/
function () {
  function Settings() {
    _classCallCheck(this, Settings);

    this.initialize();
    this.uiElements = [];
    Object.seal(this); // prevent addition of new properties
  }

  _createClass(Settings, [{
    key: "initialize",
    value: function initialize() {
      this.explosion_scale = EXPLOSION_SCALE;
      this.explosion_speed = EXPLOSION_SPEED;
      this.rotation_speed = ROTATION_SPEED;
      this.x_speed = X_SPEED;
      this.y_speed = Y_SPEED;
      this.z_speed = Z_SPEED;
      this.multi_axis_movement = MULTI_AXIS_MOVEMENT;
    }
  }, {
    key: "reset",
    value: function reset() {
      this.initialize();
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.uiElements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _step$value = _slicedToArray(_step.value, 2),
              setting = _step$value[0],
              element = _step$value[1];

          element.value = this[setting];
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
    /**
     * Register a UI element to reset when settings reset
     *
     * @param {String} setting The setting associated with the UI element
     * @param {Element} element The element to associate with the setting
     *
     * When settings are reset, the element's {@code value} will be set to the
     * setting's value.
     */

  }, {
    key: "bindUI",
    value: function bindUI(setting, element) {
      this.uiElements.push([setting, element]);
    }
  }]);

  return Settings;
}();
/**
 * Global user-configurable settings object
 *
 * @see Settings
 */


var settings = new Settings();
/**
 * Determine current explosion position as function of time
 *
 * This is applied after {@link settings.explosion_speed}
 */

function easeExplosion(t) {
  return (1 - Math.cos(t)) / 2;
}
/**
 * Global animation state
 *
 * @see AnimationState
 */


var animationState = new _Animations.AnimationState(settings); //// Canvas/GL/Mesh preparation functions

function clearCanvas() {
  gl.clearColor(0, 0, 0, 1);
  gl.clearDepth(1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2) + Math.pow(p1[2] - p2[2], 2));
}
/**
 * Set up the projection and view matrices based on the mesh
 *
 * The mesh is viewed from distance equal to its depth (z-width), with a 10%
 * margin in all directions.
 */


function setProjection(mesh) {
  var bounds = mesh.extent;
  var fov_x = X_FIELD_OF_VIEW * Math.PI / 180,
      fov_y = fov_x / ASPECT_RATIO,
      // Distance required to view entire width/height
  width_distance = bounds.width / (2 * Math.tan(fov_x / 2)),
      height_distance = bounds.height / (2 * Math.tan(fov_y / 2)),
      // Distance camera must be to view full mesh
  camera_z = bounds.near + Math.max(width_distance, height_distance) * 1.1;
  var projectionMatrix = MV.perspectiveRad(fov_y, ASPECT_RATIO, PERSPECTIVE_NEAR_PLANE, PERSPECTIVE_FAR_PLANE);
  var eye = (0, MV.vec3)(bounds.midpoint[0], bounds.midpoint[1], camera_z),
      at = bounds.midpoint,
      up = (0, MV.vec3)(0, 1, 0);
  var viewMatrix = MV.lookAt(eye, at, up); // Add margins around the mesh

  var margins = MV.scalem(0.9, 0.9, 0.9);
  projectionMatrix = MV.mult(margins, projectionMatrix);
  gl.uniformMatrix4fv(shader.projectionMatrix, false, MV.flatten(projectionMatrix));
  gl.uniformMatrix4fv(shader.viewMatrix, false, MV.flatten(viewMatrix));
}
/**
 * Set the normal vectors in the shader for the given mesh
 */


function setNormals(mesh) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.vertexAttribPointer(shader.faceNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.faceNormal);
  gl.bufferData(gl.ARRAY_BUFFER, MV.flatten(mesh.normals), gl.STATIC_DRAW);
}
/**
 * Set the vertices in the shader for the given mesh
 */


function setVertices(mesh) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.vertexAttribPointer(shader.position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(shader.position);
  gl.bufferData(gl.ARRAY_BUFFER, MV.flatten(mesh.vertices), gl.STATIC_DRAW);
}
/**
 * Prepare webgl and the animations for a new mesh
 */


function animateMesh(mesh) {
  animationState.reset();
  drawMesh(mesh);
}
/**
 * Draw and animate the shape specified by the arguments
 * @param {Mesh} mesh
 */


function drawMesh(mesh) {
  var bounds = mesh.extent;
  var explosionSize = settings.explosion_scale * bounds.radius,
      t_exp = animationState.explosion.position,
      normalScale = easeExplosion(t_exp); // Distance of movement along face normals

  gl.uniform1f(shader.explosionScale, normalScale * explosionSize);
  var rotation = MV.rotateX(animationState.xrotation.position);
  var tr_x = bounds.radius * animationState.xtranslation.position,
      tr_y = bounds.radius * animationState.ytranslation.position,
      tr_z = bounds.radius * animationState.ztranslation.position,
      translation = MV.translate(tr_x, tr_y, tr_z);
  var model = MV.mult(translation, rotation);
  gl.uniformMatrix4fv(shader.modelMatrix, false, MV.flatten(model));
  clearCanvas();
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = mesh.faceoffsets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var _step2$value = _slicedToArray(_step2.value, 2),
          size = _step2$value[0],
          offset = _step2$value[1];

      gl.drawArrays(gl.LINE_LOOP, offset, size);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  animationState.animate(function () {
    return drawMesh(mesh);
  });
} //// Control initialization
// File upload controls / "main" function


document.querySelector("#fileControls input[type='file']").addEventListener("change", function (e) {
  // Hide the parse error message if it was present
  document.querySelector("#fileControls .error-message").innerText = "";
  (0, _filereaders.readFile)(e).then(_filereaders.parsePly).catch(function (reason) {
    // If parsing fails, display a message to the user.
    console.error(reason);
    document.querySelector("#fileControls .error-message").innerText = "parse error; see console for details";
    throw reason;
  }).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        vertices = _ref2[0],
        faces = _ref2[1];

    animationState.cancel(); // Stop the ongoing animation
    // Prepare the mesh and mesh-based WebGL variables

    var mesh = new _Mesh.Mesh(vertices, faces);
    setProjection(mesh);
    setNormals(mesh);
    setVertices(mesh);
    animateMesh(mesh); // start the animations
  }).catch(console.error);
}); // Remove highlight from Q and F keys when they are released.x

window.addEventListener("keyup", function (e) {
  switch (e.key.toUpperCase()) {
    case "Q": // fallthrough

    case "F":
      Key.deactivate(e.key);
      break;
  }
});
/**
 * Actions taken when a translation key is pressed
 *
 * @param {KeyboardEvent} event The triggering keydown event
 * @param {'x'|'y'|'z'} axis The axis to rotate along, "x", "y", or "z".
 * @param {number} scale A multiplier for the speed; should be +1 or -1
 * @param {String} opposingKey The key that produces the opposite translation
 *
 * If {@link settings.multi_axis_movement} is false, stops all other translations.
 */

function translationControl(event, axis, scale, opposingKey) {
  axis = axis.toLowerCase();
  var animation = animationState["".concat(axis, "translation")];

  if (animation === undefined) {
    throw new Error("Program error: invalid axis given or missing animation or speed setting");
  }

  var alreadyRunning = animation.isrunning();

  if (!settings.multi_axis_movement) {
    animationState.stopTranslations();
  } // assumes both scales are +/- 1, which is true in this program


  if (!(alreadyRunning && animation.scale === scale)) {
    // Start animation unless it was already running in the right diretion
    animation.scale = scale;
    animation.start();
  } else {
    animation.stop();
  }

  Key.toggle(event.key, opposingKey, !settings.multi_axis_movement);
  event.preventDefault();
}
/**
 * Actions taken when a toggle-able control key is pressed
 *
 * @param {KeyboardEvent} event The triggering keydown event
 * @param {String} animation The animation, a property of {@link AnimationState}
 */


function toggleControl(event, animation) {
  if (!animationState.hasOwnProperty(animation)) {
    throw new Error("Program error: invalid animation property");
  }

  animationState[animation].toggle();
  Key.toggle(event.key);
  event.preventDefault();
} // Keyboard controls


window.addEventListener("keydown", function (e) {
  if (e.ctrlKey || e.altKey || e.metaKey) {
    return; // Ignore keys with non-shift modifiers
  }

  switch (e.key.toUpperCase()) {
    // Reset keys
    case "Q":
      animationState.reset();
      Key.deactivateAll();
      Key.activate("Q");
      e.preventDefault();
      break;

    case "F":
      animationState.stopAnimations();
      Key.deactivateClass("toggle");
      Key.activate("F");
      e.preventDefault();
      break;
    // Toggle-able controls

    case "B":
      toggleControl(e, "explosion");
      break;

    case "R":
      toggleControl(e, "xrotation");
      break;
    // Translation controls

    case "X":
      translationControl(e, "x", 1, "C");
      break;

    case "C":
      translationControl(e, "x", -1, "X");
      break;

    case "Y":
      translationControl(e, "y", 1, "U");
      break;

    case "U":
      translationControl(e, "y", -1, "Y");
      break;

    case "Z":
      translationControl(e, "z", 1, "A");
      break;

    case "A":
      translationControl(e, "z", -1, "Z");
      break;
  }
}); //// Configuration control setup
// Bind the multi-axis-movement checkbox

document.querySelector("#multiAxisMovement").addEventListener("change", function (e) {
  settings.multi_axis_movement = e.target.value;
});
settings.bindUI("multi_axis_movement", document.querySelector("#multiAxisMovement"));
/**
 * Bind an event listener for a slider that sets a property of an object.
 *
 * Also binds the reset button to restore values to their original values (when
 * this function was called), and sets the slider's current value to that value.
 *
 * @param {String} selector A selector string for the slider
 * @param {Object} object   The object that should have a property set
 * @param {String} property The name of the property to set
 */

function bindSlider(selector, object, property) {
  var defaultvalue = object[property],
      slider = document.querySelector(selector);
  slider.value = defaultvalue;
  settings.bindUI(property, slider);
  document.querySelector("button.reset").addEventListener("click", function (e) {
    object[property] = defaultvalue;
    slider.value = defaultvalue;
  });
  slider.addEventListener("input", function (e) {
    object[property] = e.target.value;
  });
}

bindSlider(".speed-slider.explosion", settings, "explosion_speed");
bindSlider(".speed-slider.x.rotation", settings, "rotation_speed");
bindSlider(".speed-slider.x.translation", settings, "x_speed");
bindSlider(".speed-slider.y.translation", settings, "y_speed");
bindSlider(".speed-slider.z.translation", settings, "z_speed");
bindSlider(".scale-slider.explosion", settings, "explosion_scale");
clearCanvas();
},{"./Animations.js":"zcw9","./Extent.js":"VGQx","./filereaders.js":"Bopp","./Mesh.js":"ezmQ","./MV+.js":"pSFd","./webgl-setup.js":"RtpY","./KeyboardUI.js":"6idV"}]},{},["epB2"], null)
//# sourceMappingURL=main.1f19ae8e.map