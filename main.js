"use strict";

import { readFile, parsePly } from "./filereaders.js";
import { setupWebGL, setupProgram } from "./webgl-setup.js";
import { Extent } from "./Extent.js";
import { vec2, vec3, vec4 } from "./MV+.js";

import * as MV from "./MV+.js";

const MIN_CANVAS_HEIGHT = 200;
const MIN_CANVAS_WIDTH  = 200;

//// Setup WebGL and prepare for input

let canvas = document.querySelector("#webglCanvas");

// Resize the canvas to a minimum of
canvas.height = Math.round(window.innerHeight / 2);
canvas.width = Math.round(document.body.clientWidth);
if (canvas.height < MIN_CANVAS_HEIGHT) canvas.height = MIN_CANVAS_HEIGHT;
if (canvas.width < MIN_CANVAS_WIDTH) canvas.width = MIN_CANVAS_WIDTH;


let gl = setupWebGL(canvas);
if (gl === null) {
    throw new Error("Failed to set up WebGL");
}

let program = setupProgram(gl,
    document.querySelector("#vertexShader").text,
    document.querySelector("#fragmentShader").text);
if (program === null) {
    throw new Error("Failed to set up program");
}

gl.useProgram(program);

let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

let indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

// Set up the position attribute
let positionAttrib = gl.getAttribLocation(program, "aPosition");
gl.vertexAttribPointer(positionAttrib, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionAttrib);


function clearCanvas() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

const points = [
    vec3(-0.5, -0.5, -0.5),
    vec3(0.5, -0.5, -0.5),
    vec3(0.5, 0.5, -0.5),
    vec3(-0.5, 0.5, -0.5),
    vec3(-0.5, -0.5, 0.5),
    vec3(0.5, -0.5, 0.5),
    vec3(0.5, 0.5, 0.5),
    vec3(-0.5, 0.5, 0.5),
];

const faces = [
    vec3(3, 2, 1),
    vec3(3, 1, 0),
    vec3(6, 7, 4),
    vec3(6, 4, 5),
    vec3(5, 1, 2),
    vec3(5, 2, 6),
    vec3(0, 4, 7),
    vec3(0, 7, 3),
    vec3(6, 2, 3),
    vec3(6, 3, 7),
    vec3(4, 0, 1),
    vec3(4, 1, 5),
];

gl.bufferData(gl.ARRAY_BUFFER,
              MV.flatten(points),
              gl.STATIC_DRAW);

gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
              new Uint16Array(faces.flat(1)),
              gl.STATIC_DRAW);

clearCanvas();

gl.drawElements(gl.TRIANGLES, faces.length, gl.UNSIGNED_SHORT, 0);







document.querySelector("#fileControls input[type='file']")
    .addEventListener("change", e => {
        readFile(e)
            .then(parsePly)
            .then(([v, f]) => {
                console.log(v);
                console.log(f);
            })
            .catch(reason => document
                   .querySelector("#fileControls .error-message")
                   .innerText = "parse error; see console for details");
    });
