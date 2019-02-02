"use strict";

import { vec3 } from "./MV+.js";

/**
 * Read and draw a file.
 *
 * @param {Event} event The change event for a file input element.
 *
 * @returns {Promise} A promise containing the file's contents.
 */
export function readFile(event) {
    return new Promise(resolve => {
        let reader = new FileReader();
        reader.onload = e => {
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
 * @returns {[vec2[], number[][]]} The vertices and faces specified by the file.
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
export function parsePly(text) {

    if (!text.match(/^ply(\r|\n|\r\n)/)) {
        parseError("line 1: expected 'ply'");
    }

    let lines = text.toLowerCase()
        .split(/(\r|\n)+/) // split on any newline (gobbles empty lines)
        .filter(line => !line.startsWith("comment"))
        .map(line => line.trim())
        .filter(line => line !== "");

    if (lines[1] !== "format ascii 1.0") {
        parseError("line 2: expected 'format ascii 1.0'");
    }

    if (!lines[2].startsWith("element vertex ") ||
        lines[3] !== "property float32 x" ||
        lines[4] !== "property float32 y" ||
        lines[5] !== "property float32 z" ||
        !lines[6].startsWith("element face") ||
        lines[7] !== "property list uint8 int32 vertex_indices" ||
        lines[8] !== "end_header") {
        parseError("in lines 3-9: wrong value"); ; // line format
    }

    let numvertices = parseInt(lines[2].split(" ")[2]);
    let numfaces = parseInt(lines[6].split(" ")[2]);

    if (isNaN(numvertices) || isNaN(numfaces)) {
        parseError("wrong number of vertices (line 3) or number of faces (line 7)");
    }

    lines = lines.slice(9)
        .map(line => line.split(/\s+/));

    let vertices = lines.slice(0, numvertices)
        .map(line => line.map(parseFloat));

    let faces = lines.slice(numvertices)
        .map(line =>
             line.map(n => parseInt(n)));

    if (vertices.some(vertex => vertex.some(isNaN))
        || faces.some(face => face.some(isNaN))) {
        parseError("error in vertices or faces");
    }

    if (vertices.length !== numvertices || faces.length !== numfaces) {
        parseError("wrong number of vertices or faces"); // wrong number of lines
    }

    if (faces.some(face => face[0] !== face.length - 1)) {
        parseError("wrong number of vertices in a face");
    }

    faces = faces.map(face => face.slice(1)); // remove number of vertices

    return [vertices, faces];
}

function parseError(msg) {
    console.log(`parse error: ${msg}`);
    throw "parse error; see console for details";
}
