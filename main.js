"use strict";

import { Extent } from "./Extent.js";
import { readFile, parsePly } from "./filereaders.js";
import { Mesh } from "./Mesh.js";
import { vec2, vec3, vec4 } from "./MV+.js";
import { PausableTimer, ReversableTimer, AnimationTracker } from "./Timer.js";
import { setupWebGL, setupProgram, enableVAO } from "./webgl-setup.js";

import * as Key from "./KeyboardUI.js";
import * as MV from "./MV+.js";


//// Prepare the canvas

const MIN_CANVAS_HEIGHT = 200;
const MIN_CANVAS_WIDTH  = 200;

const canvas = document.querySelector("#webglCanvas");

// Resize the canvas
canvas.height = Math.round(window.innerHeight / 2);
canvas.width = Math.round(document.body.clientWidth);
if (canvas.height < MIN_CANVAS_HEIGHT) canvas.height = MIN_CANVAS_HEIGHT;
if (canvas.width < MIN_CANVAS_WIDTH) canvas.width = MIN_CANVAS_WIDTH;

const ASPECT_RATIO = canvas.width / canvas.height;



//// Set up WebGL, the program, buffers, and shader variables

const gl = setupWebGL(canvas);
if (gl === null) {
    throw new Error("Failed to set up WebGL");
}

const program = setupProgram(gl,
    document.querySelector("#vertexShader").text,
    document.querySelector("#fragmentShader").text);
if (program === null) {
    throw new Error("Failed to set up program");
}

gl.useProgram(program);


const buffers = Object.freeze({
    position: gl.createBuffer(), // vertices
    normal: gl.createBuffer(),   // normal vectors
});

// Set up the shader variables
const shader = Object.freeze({
    position:         gl.getAttribLocation(program, "aPosition"),
    faceNormal:       gl.getAttribLocation(program, "faceNormal"),

    explosionScale:   gl.getUniformLocation(program, "explosionScale"),

    modelMatrix:      gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:       gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix"),
});



//// Global animation state

/**
 * Global animation settings
 *
 * @property {number} explosion_scale   multiplier for explosion size
 * @property {number} explosion_speed   percent of explosion per millisecond
 * @property {number} rotation_speed    degrees of rotation per millisecond
 * @property {number} x_speed           multiplier for movement along X-axis
 * @property {number} y_speed           multiplier for movement along Y-axis
 * @property {number} z_speed           multiplier for movement along Z axis
 */
const settings = Object.seal({
    explosion_scale: 0.1,
    explosion_speed: 0.01,
    rotation_speed: 360/1000,
    x_speed: 0.01,
    y_speed: 0.01,
    z_speed: 0.01
});

function resetSettings() {
    settings.explosion_scale = 0.1;
    settings.explosion_speed = 0.01;
    settings.rotation_speed = 360/1000;
    settings.x_speed = settings.y_speed = settings.z_speed = 0.01;
}

/**
 * Determine current explosion position as function of time
 *
 * This is applied after {@link settings.explosion_speed}
 */
function easeExplosion(t) {
    return (1 - Math.cos(t)) / 2;
}

/**
 * Class tracking state of each animation (translation, rotation, and explosion)
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
class AnimationState {
    constructor() {
        this.id = null; // The ID of the current animation frame

        this.explosion = new AnimationTracker(() => settings.explosion_speed);
        this.xrotation = new AnimationTracker(() => settings.rotation_speed);

        this.xtranslation = new AnimationTracker(() => settings.x_speed);
        this.ytranslation = new AnimationTracker(() => settings.y_speed);
        this.ztranslation = new AnimationTracker(() => settings.z_speed);

        this.animations = [this.explosion,
                           this.xrotation,
                           this.xtranslation,
                           this.ytranslation,
                           this.ztranslation];

        this.translations = [this.xtranslation,
                             this.ytranslation,
                             this.ztranslation];
    }

    cancel() {
        window.cancelAnimationFrame(this.id);
    }

    stopAnimations() {
        this.animations.forEach(a => a.stop());
    }

    stopTranslations() {
        this.translations.forEach(a => a.stop());
    }
}

// Timers for active and paused animation on current mesh
let animationState = new AnimationState();



//// Canvas/GL/Mesh preparation functions

function clearCanvas() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function distance(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) ** 2 +
                     (p1[1] - p2[1]) ** 2 +
                     (p1[2] - p2[2]) ** 2);
}

/**
 * Set up the projection and view matrices based on the mesh
 *
 * The mesh is viewed from distance equal to its depth (z-width), with a 10%
 * margin in all directions.
 */
function setProjection(mesh) {
    let bounds = mesh.extent;

    let viewDistance = bounds.near + bounds.depth;

    // y-FOV required to view entire bounding box from distance = depth
    let fovy = 2 * Math.atan(bounds.height / (2 * bounds.depth));

    let projectionMatrix = MV.perspectiveRad(
        fovy, ASPECT_RATIO, bounds.near, bounds.far);

	let eye = vec3(bounds.midpoint[0],
                   bounds.midpoint[1],
                   viewDistance),
	    at = bounds.midpoint,
	    up = vec3(0, 1, 0);

	var viewMatrix = MV.lookAt(eye, at, up);

    // Add margins around the mesh
    var margins = MV.scalem(0.9, 0.9, 0.9);
    projectionMatrix = MV.mult(margins, projectionMatrix);

    gl.uniformMatrix4fv(shader.projectionMatrix,
                        false,
                        MV.flatten(projectionMatrix));

    gl.uniformMatrix4fv(shader.viewMatrix,
                        false,
                        MV.flatten(viewMatrix));
}

/**
 * Set the normal vectors in the shader for the given mesh
 */
function setNormals(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);

    gl.vertexAttribPointer(shader.faceNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.faceNormal);

    gl.bufferData(gl.ARRAY_BUFFER,
                  MV.flatten(mesh.normals),
                  gl.STATIC_DRAW);
}

/**
 * Set the vertices in the shader for the given mesh
 */
function setVertices(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(shader.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.position);

    gl.bufferData(gl.ARRAY_BUFFER,
                  MV.flatten(mesh.vertices),
                  gl.STATIC_DRAW);
}



/**
 * Prepare webgl and the animations for a new mesh
 */
function animateMesh(mesh) {
    animationState = new AnimationState();
    drawMesh(mesh);
}

/**
 * Draw and animate the shape specified by the arguments
 * @param {Mesh} mesh
 */
function drawMesh(mesh) {
    let bounds = mesh.extent;

    let explosionSize = settings.explosion_scale * Math.max(bounds.width, bounds.height, bounds.depth),
        t_exp = animationState.explosion.position,
        normalScale = easeExplosion(t_exp); // Distance of movement along face normals

    gl.uniform1f(shader.explosionScale, normalScale * explosionSize);

    let rotation = MV.rotateX(animationState.xrotation.position);

    let tr_x = bounds.width  * animationState.xtranslation.position,
        tr_y = bounds.height * animationState.ytranslation.position,
        tr_z = bounds.depth  * animationState.ztranslation.position,
        translation = MV.translate(tr_x, tr_y, tr_z);

    let model = MV.mult(translation, rotation);

    gl.uniformMatrix4fv(shader.modelMatrix, false, MV.flatten(model));

    clearCanvas();

    for (let [size, offset] of mesh.faceoffsets) {
        gl.drawArrays(gl.LINE_LOOP, offset, size);
    }

    animationState.id = window.requestAnimationFrame(() => drawMesh(mesh));
}



//// Control initialization


window.addEventListener("keyup", e => {
    switch (e.key.toUpperCase()) {
    case "Q":
        Key.deactivate("Q");
        break;
    case "F":
        Key.deactivate("F");
        break;
    }
});

/**
 * Actions taken when a translation key is pressed
 *
 * @param {KeyboardEvent} event The triggering keydown event
 * @param {'x'|'y'|'z'} axis The axis to rotate along, "x", "y", or "z".
 * @param {number} scale A multiplier for the speed; should be +1 or -1
 * @param {boolean} stopOthers Whether to stop other translations
 */
function translationControl(event, axis, scale, stopOthers = true) {
    axis = axis.toLowerCase();

    let animation = animationState[`${axis}translation`];

    if (animation === undefined) {
        throw new Error("Program error: invalid axis given or missing animation or speed setting");
    }

    let alreadyRunning = animation.isrunning();

    if (stopOthers) {
        animationState.stopTranslations();
    }

    // assumes both scales are +/- 1, which is true in this program
    if (!(alreadyRunning && animation.scale === scale)) {
        // Start animation unless it was already running in the right diretion
        animation.scale = scale;
        animation.start();
    }
    Key.toggle(event.key);
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
}


window.addEventListener("keydown", e => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
    }

    switch (e.key.toUpperCase()) {
    case "Q":
        animationState = new AnimationState();
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

    case "B":
        toggleControl(event, "explosion");
        break;
    case "R":
        toggleControl(event, "xrotation");
        break;

    case "X":
        translationControl(e, "x", 1);
        break;
    case "C":
        translationControl(e, "x", -1);
        break;
    case "Y":
        translationControl(e, "y", 1);
        break;
    case "U":
        translationControl(e, "y", -1);
        break;
    case "Z":
        translationControl(e, "z", 1);
        break;
    case "A":
        translationControl(e, "z", -1);
        break;
    }
});

document.querySelector("#fileControls input[type='file']")
    .addEventListener("change", e => {
        readFile(e)
            .then(parsePly)
            .then(([vertices, faces]) => {
                if (animationState !== undefined) {
                    animationState.cancel();
                }
                let mesh = new Mesh(vertices, faces);
                setProjection(mesh);
                setNormals(mesh);
                setVertices(mesh);
                animateMesh(mesh);
            })
            .catch(reason => {
                document
                    .querySelector("#fileControls .error-message")
                    .innerText = "parse error; see console for details";
                throw reason;
            });
    });



//// Non-keyboard animation control setup



/**
 * Bind an event listener for a slider that sets a property of an object.
 *
 * Also binds the reset button to restore values to their original values (when
 * this function was called), and sets the slider's current value to that value.
 *
 * @param {String} selector A selector string for the slider
 * @param {Object} object   The object that should have a property set
 * @param {String} property The name of the property to set
 * @param {String} default asdf
 */
function bindSlider(selector, object, property) {
    let defaultvalue = object[property],
        slider = document.querySelector(selector);

    slider.value = defaultvalue;

    document.querySelector("button.reset") .addEventListener("click", e => {
        object[property] = defaultvalue;
        slider.value = defaultvalue;
    });

    slider.addEventListener("input", e => {
        object[property] = e.target.value;
    });
}

bindSlider(".speed-slider.explosion", settings, "explosion_speed");
bindSlider(".speed-slider.x.rotation", settings, "rotation_speed");
bindSlider(".speed-slider.x.translation", settings, "x_speed");
bindSlider(".speed-slider.y.translation", settings, "y_speed");
bindSlider(".speed-slider.z.translation", settings, "z_speed");

clearCanvas();


function points() {
    let k = 1.5/2;
    let vertices = [
        vec3( 1.5,  0,    0),   // 0
        vec3( 0,    1.5,  0),   // 1
        vec3( 0,    0,    1.5), // 2
        vec3(-1.5,  0,    0),   // 3
        vec3( 0,   -1.5,  0),   // 4
        vec3( 0,    0,   -1.5), // 5

        vec3(0,  1,  1), // 6
        vec3(0,  1, -1), // 7
        vec3(0, -1, -1), // 8
        vec3(0, -1,  1), // 9

        vec3( 1, 0,  1), // 10
        vec3( 1, 0, -1), // 11
        vec3(-1, 0,  1), // 12
        vec3(-1, 0, -1), // 13

        vec3( 1,  1, 0), // 14
        vec3( 1, -1, 0), // 15
        vec3(-1,  1, 0), // 16
        vec3(-1, -1, 0), // 17

        vec3( k,  k,  k), // 18
        vec3( k,  k, -k), // 19
        vec3( k, -k,  k), // 20
        vec3( k, -k, -k), // 21
        vec3(-k,  k,  k), // 22
        vec3(-k,  k, -k), // 23
        vec3(-k, -k,  k), // 24
        vec3(-k, -k, -k), // 25
    ];

    let faces = [
        // // Square faces
        // [0, 1, 3, 4],
        // [0, 2, 3, 5],
        // [1, 2, 4, 5],

        // Octahedral faces
        [0, 14, 1, 16, 3, 17, 4, 15],
        [0, 10, 2, 12, 3, 13, 5, 11],
        [2,  6, 1,  7, 5,  8, 4,  9],

        // // Triangular faces
        // [0, 1, 18],
        // [1, 2, 18],
        // [2, 0, 18]

        // // Smaller triangular faces
        // [14, 0, 18],
        // [14, 1, 18],
        // [10, 0, 18],
    ];

    return new Mesh(vertices, faces);
}
let mesh = points(); // samplePoints
setProjection(mesh);
setNormals(mesh);
setVertices(mesh);
animateMesh(mesh);
