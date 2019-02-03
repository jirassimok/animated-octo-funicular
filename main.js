"use strict";

import { readFile, parsePly } from "./filereaders.js";
import { setupWebGL, setupProgram } from "./webgl-setup.js";
import { Extent } from "./Extent.js";
import { Mesh } from "./Mesh.js";
import { vec2, vec3, vec4 } from "./MV+.js";

import * as MV from "./MV+.js";

const MIN_CANVAS_HEIGHT = 200;
const MIN_CANVAS_WIDTH  = 200;

//// Setup WebGL and prepare for input

const canvas = document.querySelector("#webglCanvas");

// Resize the canvas
canvas.height = Math.round(window.innerHeight / 2);
canvas.width = Math.round(document.body.clientWidth);
if (canvas.height < MIN_CANVAS_HEIGHT) canvas.height = MIN_CANVAS_HEIGHT;
if (canvas.width < MIN_CANVAS_WIDTH) canvas.width = MIN_CANVAS_WIDTH;


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



const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

// Set up the shader variables
const shader = Object.freeze({
    position:         gl.getAttribLocation(program, "aPosition"),
    modelMatrix:      gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:       gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix")
});

gl.vertexAttribPointer(shader.position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(shader.position);


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
/**
 * Draw the shape specified by the arguments
 * @param {Mesh} mesh
 */
function drawShape(mesh) {

    gl.bufferData(gl.ARRAY_BUFFER,
                  MV.flatten(mesh.vertices),
                  gl.STATIC_DRAW);

    // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,
    //               new Uint16Array(faces.flat(1)),
    //               gl.STATIC_DRAW);

    let proj = MV.perspective(60, 4/3, -1+Math.sqrt(3), -2);
    gl.uniformMatrix4fv(shader.projectionMatrix, false, MV.flatten(proj));

	let eye = vec3(0.75, 1.25, 2);
	let at = vec3(0.0, 0.0, 0.0);
	let up = vec3(0.0, 1.0, 0.0);

	var vMatrix = MV.lookAt(eye, at, up);

    gl.uniformMatrix4fv(shader.modelMatrix, false, MV.flatten(MV.mat4()));
    gl.uniformMatrix4fv(shader.viewMatrix, false, MV.flatten(vMatrix));

    clearCanvas();

    for (let [size, offset] of mesh.faceoffsets) {
        gl.drawArrays(gl.LINE_LOOP, offset, size);
    }

    // gl.drawElements(gl.LINES, faces.length, gl.UNSIGNED_SHORT, 0);
}


document.querySelector("#fileControls input[type='file']")
    .addEventListener("change", e => {
        readFile(e)
            .then(parsePly)
            .then(([vertices, faces]) => {
                let mesh = new Mesh(vertices, faces);
                console.log(mesh);
                return drawShape(mesh);
            })
            .catch(reason => {
                document
                    .querySelector("#fileControls .error-message")
                    .innerText = "parse error; see console for details";
                throw reason;
            });
    });
