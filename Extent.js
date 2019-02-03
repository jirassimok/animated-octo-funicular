"use strict";

import { vec3, ortho } from "./MV+.js";

/**
 * Class representing the extent of a data file's contents.
 */
export class Extent {
    constructor(left, right, bottom, top, near = 1, far = -1) {
        this.left = left;
        this.right = right;
        this.top = top;
        this.bottom = bottom;
        this.near = near;
        this.far = far;
    }

    /**
     * Construct the extent of an array of vectors.
     * @param {number[][]} vecs A non-empty array of vectors
     * @return {Extent}
     *
     * The vectors should all have the same length of at least 2.
     *
     * If the list is empty, an error will occur.
     */
    static fromVecs(vecs) {
        let size = vecs[0].length;

        let extent = new Extent(vecs[0][0], vecs[0][0],
                                vecs[0][1], vecs[0][1],
                                vecs[0][2], vecs[0][2]);

        return vecs.reduce(
            (ext, vec) => {
                ext.left = Math.min(ext.left, vec[0]);
                ext.right = Math.max(ext.right, vec[0]);
                ext.top = Math.max(ext.top, vec[1]);
                ext.bottom = Math.min(ext.bottom, vec[1]);
                if (size > 2) {
                    ext.near = Math.max(ext.near, vec[2]);
                    ext.far = Math.min(ext.far, vec[2]);
                }
                return ext;
            }, extent);
    }

    /** Get the default extent */
    static basic() {
        return new Extent(-1, 1, -1, 1, 1, -1);
    }

    /** Convert to orthographic projection matrix */
    asortho() {
        return ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }

    get midpoint() {
        return vec3((this.left + this.right) / 2,
                    (this.top + this.bottom) / 2,
                    (this.near + this.far) / 2);
    }

    get width() {
        return Math.abs(this.right - this.left);
    }

    get height() {
        return Math.abs(this.top - this.bottom);
    }

    get depth() {
        return Math.abs(this.near - this.far);
    }
}
