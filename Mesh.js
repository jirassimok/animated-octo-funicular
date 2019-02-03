"use strict";

import { Extent } from "./Extent.js";

export class Mesh {
    constructor(vertices, faces) {
        this.extent = Extent.fromVecs(vertices);

        // Copy vertices so each face has its own copies
        this.allvertices = Object.freeze(
            faces.flatMap(
                face => face.map(
                    v => vertices[v])));

        this._facesizes = Object.freeze(
            faces.map(face => face.length));

        this._faceoffsets = new Array(faces.length);

        // Save offset of each face in the vertex array
        this._faceoffsets[0] = 0;
        for (let i = 1; i < faces.length; ++i) {
            this._faceoffsets[i] = this._faceoffsets[i-1] + this._facesizes[i];
        }
    }

    /**
     * @returns {vec3[]} An array of the vertices in this mesh.
     */
    get vertices() {
        return this.allvertices;
    }

    // /**
    //  * @return {[number, number][]} An array of pairs of numbers of vertices an offsets in a face
    //  */
    // get faces() {
    //     return 
    // }

    get numfaces() {
        return this._facesizes.length;
    }

    facesize(i) {
        return this._facesizes[i];
    }

    faceoffset(i) {
        return this._faceoffsets[i];
    }
}

/*
For each face:

I need each vertex in 

 */
