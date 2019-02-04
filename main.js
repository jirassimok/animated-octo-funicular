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


/**
 * Class tracking state of each animation (translation, rotation, and explosion)
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

    let explosion_scale = 0.01, // percent of explosion per ms
        rotation_speed = 360/1000, // rotation per ms
        translation_scale = 0.001; // translation per ms as percent of dimension

    let explosionSize = Math.max(bounds.width, bounds.height, bounds.depth) * 0.1,
        t_exp = explosion_scale * animationState.explosion.timeelapsed(), // time in animation
        normalScale = (1 - Math.cos(t_exp)) / 2; // Distance of movement along face normals

    gl.uniform1f(shader.explosionScale, normalScale * explosionSize);


    let t_xr = animationState.xrotation.timeelapsed(),
        rotation = MV.rotateX(rotation_speed * t_xr);

    let tr_x = translation_scale * bounds.width  * animationState.xtranslation.timeelapsed(),
        tr_y = translation_scale * bounds.height * animationState.ytranslation.timeelapsed(),
        tr_z = translation_scale * bounds.depth  * animationState.ztranslation.timeelapsed(),
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
        break;
    case "F": // fallthrough for shift
    case "f":
        animationState.stopAnimations();
        break;

    case "B": // fallthrough for shift
    case "b":
        animationState.explosion.toggle();
        break;
    case "R": // fallthrough for shift
    case "r":
        animationState.xrotation.toggle();
        break;
    case "X": // fallthrough for shift
    case "x":
        animationState.xtranslation.toggleForward();
        break;
    case "C": // fallthrough for shift
    case "c":
        animationState.xtranslation.toggleReverse();
        break;
    case "Y": // fallthrough for shift
    case "y":
        animationState.ytranslation.toggleForward();
        break;
    case "U": // fallthrough for shift
    case "u":
        animationState.ytranslation.toggleReverse();
        break;
    case "Z": // fallthrough for shift
    case "z":
        animationState.ztranslation.toggleForward();
        break;
    case "A": // fallthrough for shift
    case "a":
        animationState.ztranslation.toggleReverse();
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
