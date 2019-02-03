"use strict";

import { Extent } from "./Extent.js";

export class Mesh {
    constructor(vertices, faces) {
        this.extent = Extent.fromVecs(vertices);

        // Copy vertices so each face has its own copies
        this._allvertices = Object.freeze(
            faces.flatMap(
                face => face.map(
                    v => vertices[v])));

        let faceoffsets = [];
        let offset = 0;

        // Create list of (size, offset) pairs per face
        for (let size of faces.map(face => face.length)) {
            faceoffsets.push(Object.freeze([size, offset]));
            offset += size;
        }

        this._faces = Object.freeze(faceoffsets);
    }

    /**
     * @returns {vec3[]} An array of the vertices in this mesh.
     */
    get vertices() {
        return this._allvertices;
    }

    /**
     * @returns the (size, offset) pairs for each face
     */
    get faceoffsets() {
        return this._faces;
    }
}
