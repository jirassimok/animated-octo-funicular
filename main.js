"use strict";

import { Extent } from "./Extent.js";
import { readFile, parsePly } from "./filereaders.js";
import { Mesh } from "./Mesh.js";
import { vec2, vec3, vec4 } from "./MV+.js";
import { PausableTimer, ReversableTimer } from "./Timer.js";
import { setupWebGL, setupProgram, enableVAO } from "./webgl-setup.js";

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
 * @property {number} translation_scale multiplier for translation distances
 */
const settings = Object.seal({
    explosion_scale: 0.1,
    explosion_speed: 0.01,
    rotation_speed: 360/1000,
    translation_scale: 0.01,
});

function resetSettings() {
    settings.explosion_scale = 0.1;
    settings.explosion_speed = 0.01;
    settings.rotation_speed = 360/1000;
    settings.translation_scale = 0.01;
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
 * @property {PausableTimer} xrotation time spent rotating around the X axis
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

        this.explosion = new PausableTimer();
        this.xrotation = new PausableTimer();

        this.xtranslation = new ReversableTimer();
        this.ytranslation = new ReversableTimer();
        this.ztranslation = new ReversableTimer();

        this.animations = [this.explosion,
                           this.xrotation,
                           this.xtranslation,
                           this.ytranslation,
                           this.ztranslation];
    }

    cancel() {
        window.cancelAnimationFrame(this.id);
    }

    stopAnimations() {
        for (let a of this.animations) {
            a.stop();
        }
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

/**
 * Set up the projection and view matrices based on the mesh
 *
 * The mesh is viewed from distance equal to its depth (z-width), with a 10%
 * margin in all directions.
 */
function setProjection(mesh) {
    let bounds = mesh.extent;

    let z = bounds.near + bounds.depth;

    // y-FOV required to view entire bounding box from distance = depth
    let fovy = 2 * Math.atan(bounds.height / (2 * bounds.depth));

    let projectionMatrix = MV.perspectiveRad(
        fovy, ASPECT_RATIO, bounds.near, bounds.far);

	let eye = vec3(bounds.midpoint[0],
                   bounds.midpoint[1],
                   bounds.near + bounds.depth),
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
        t_exp = settings.explosion_speed * animationState.explosion.timeelapsed(),
        normalScale = easeExplosion(t_exp); // Distance of movement along face normals

    gl.uniform1f(shader.explosionScale, normalScale * explosionSize);


    let t_xr = animationState.xrotation.timeelapsed(),
        rotation = MV.rotateX(settings.rotation_speed * t_xr);

    let tr_x = settings.translation_scale * bounds.width  * animationState.xtranslation.timeelapsed(),
        tr_y = settings.translation_scale * bounds.height * animationState.ytranslation.timeelapsed(),
        tr_z = settings.translation_scale * bounds.depth  * animationState.ztranslation.timeelapsed(),
        translation = MV.translate(tr_x, tr_y, tr_z);

    let model = MV.mult(translation, rotation);

    gl.uniformMatrix4fv(shader.modelMatrix, false, MV.flatten(model));

    clearCanvas();

    for (let [size, offset] of mesh.faceoffsets) {
        gl.drawArrays(gl.LINE_LOOP, offset, size);
    }

    animationState.id = window.requestAnimationFrame(() => drawMesh(mesh));
}


window.addEventListener("keydown", e => {
    switch (e.key) {
    case "Q": // fallthrough for shift
    case "q":
        animationState = new AnimationState();
        e.preventDefault();
        break;
    case "F": // fallthrough for shift
    case "f":
        animationState.stopAnimations();
        e.preventDefault();
        break;

    case "B": // fallthrough for shift
    case "b":
        animationState.explosion.toggle();
        e.preventDefault();
        break;
    case "R": // fallthrough for shift
    case "r":
        animationState.xrotation.toggle();
        // default event allowed for reloading
        break;
    case "X": // fallthrough for shift
    case "x":
        animationState.xtranslation.toggleForward();
        e.preventDefault();
        break;
    case "C": // fallthrough for shift
    case "c":
        animationState.xtranslation.toggleReverse();
        e.preventDefault();
        break;
    case "Y": // fallthrough for shift
    case "y":
        animationState.ytranslation.toggleForward();
        e.preventDefault();
        break;
    case "U": // fallthrough for shift
    case "u":
        animationState.ytranslation.toggleReverse();
        e.preventDefault();
        break;
    case "Z": // fallthrough for shift
    case "z":
        animationState.ztranslation.toggleForward();
        e.preventDefault();
        break;
    case "A": // fallthrough for shift
    case "a":
        animationState.ztranslation.toggleReverse();
        e.preventDefault();
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

    slider.addEventListener("change", e => {
        object[property] = e.target.value;
    });
}

bindSlider(".speed-slider.explosion", settings, "explosion_speed");
bindSlider(".speed-slider.x.rotation", settings, "rotation_speed");

clearCanvas();
