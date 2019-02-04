"use strict";

import { readFile, parsePly } from "./filereaders.js";
import { setupWebGL, setupProgram, enableVAO } from "./webgl-setup.js";
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

const ASPECT_RATIO = canvas.width / canvas.height;


const gl = setupWebGL(canvas);
if (gl === null) {
    throw new Error("Failed to set up WebGL");
}

const vao = enableVAO(gl);
if (vao == null) {
    throw new Error("Failed to activate VAO extension");
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
    faceNormal:       gl.getAttribLocation(program, "faceNormal"),

    explosionScale:   gl.getUniformLocation(program, "explosionScale"),

    modelMatrix:      gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:       gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix"),
});

gl.vertexAttribPointer(shader.position, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(shader.position);


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

    gl.uniformMatrix4fv(shader.modelMatrix, false, MV.flatten(MV.mat4()));

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
                setProjection(mesh);
                return drawShape(mesh);
            })
            .catch(reason => {
                document
                    .querySelector("#fileControls .error-message")
                    .innerText = "parse error; see console for details";
                throw reason;
            });
    });
