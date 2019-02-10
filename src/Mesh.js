"use strict";

import { vec3, normalize } from "./MV+.js";
import { Extent } from "./Extent.js";

/**
 * Represents a mesh of separable faces.
 *
 * Stores the mesh as a list of vertices, a list of normals for the vertices,
 * and a list of (size, offset) pairs representing the faces by their positions
 * in the other two lists.
 *
 * The constructor takes in a list of vertices and an index array of faces.
 */
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

        this._normals = [];

        for (let face of faces) {
            let face2 = face.slice(1).concat(face[0]);
            let vertexpairs = face.map((_, i) => [vertices[face[i]],
                                                  vertices[face2[i]]]);
            let x = 0,
                y = 0,
                z = 0;

            for (let [[x1, y1, z1], [x2, y2, z2]] of vertexpairs) {
                x += (y1 - y2) * (z1 + z2);
                y += (z1 - z2) * (x1 + x2);
                z += (x1 - x2) * (y1 + y2);
            }

            for (let _ of face) {
                this._normals.push(normalize(vec3(x, y, z)));
            }
        }
    }

    /**
     * @returns {vec3[]} An array of the vertices in this mesh.
     */
    get vertices() {
        return this._allvertices;
    }

    /**
     * @returns {[number, number][]} the (size, offset) pairs for each face
     */
    get faceoffsets() {
        return this._faces;
    }

    /**
     * @returns {vec3[]} an array of normals for the vertices
     */
    get normals() {
        return this._normals;
    }
}
