"use strict";

import { ortho } from "./MV+.js";

/**
 * Class representing the extent of a data file's contents.
 */
export class Extent {
    constructor(left, top, right, bottom, near = -1, far = 1) {
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
        return vecs.reduce(
            (ext, vec) => {
                ext.left = Math.min(ext.left, vec[0]);
                ext.right = Math.max(ext.right, vec[0]);
                ext.top = Math.max(ext.top, vec[1]);
                ext.bottom = Math.min(ext.bottom, vec[1]);
                if (size > 2) {
                    ext.near = Math.min(ext.near, vec[2]);
                    ext.far = Math.max(ext.far, vec[2]);
                }
                return ext;
            }, new Extent(0, 1, 1, 0));
    }

    /** Get the default extent */
    static basic() {
        return new Extent(-1, 1, -1, 1, -1, 1);
    }

    /** Convert to orthographic projection matrix */
    asortho() {
        return ortho(this.left, this.right, this.bottom, this.top, this.near, this.far);
    }

    width() {
        return Math.abs(this.right - this.left);
    }

    height() {
        return Math.abs(this.top - this.bottom);
    }

    depth() {
        return Math.abs(this.near - this.far);
    }
}