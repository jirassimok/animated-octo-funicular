"use strict";

import { Extent } from "./Extent.js";

export class Mesh {
    constructor(vertices, faces) {
        this.extent = Extent.fromVecs(vertices);

        this._vertices = Object.freeze(vertices.map(Object.freeze));

        let faceoffsets = [];
        let offset = 0;

        // Create list of (size, offset) pairs per face
        for (let size of faces.map(face => face.length)) {
            faceoffsets.push(Object.freeze([size, offset]));
            offset += size;
        }

        this._faceoffsets = Object.freeze(faceoffsets);

        this._faces = Object.freeze(faces.map(Object.freeze));
    }


    /**
     * @returns {vec3[]} An array of the vertices in this mesh.
     */
    get vertices() {
        return this._vertices;
    }

    get faces() {
        return this._faces;
    }

    /**
     * @returns the (size, offset) pairs for each face
     */
    get faceoffsets() {
        return this._faceoffsets;
    }
}
