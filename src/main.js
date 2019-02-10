/* Extra features:
 *
 * - Pressing F stops all active animations
 * - Pressing Q stops all animations and resets the mesh to its initial position.
 *
 * - Adjustable animation speeds. All of the animations have adjustable speed,
 *   which can be updated without restarting and without causing the animations
 *   to skip.
 * - Adjustable "explosion" magnitude (this will cause the explosion to skip,
 *   because it effects the size of the explosion immediately).
 *
 * - When the checkbox is checked, the mesh may be translated in multiple
 *   directions at the same time.
 *
 * - Anti-lag: animations are based on time passed and position, not frames, so
 *   a delay between frames will not prevent the animation from progressing
 *   normally.
 *
 * - Visual UI: when an animation is active, the corresponding key in the list
 *   of controls is highlighted. The Q and F controls instead highlight when
 *   those keys are pressed.
 */

"use strict";

import { AnimationState } from "./Animations.js";
import { Extent } from "./Extent.js";
import { readFile, parsePly } from "./filereaders.js";
import { Mesh } from "./Mesh.js";
import { vec2, vec3, vec4 } from "./MV+.js";
import { setupWebGL, setupProgram, enableVAO } from "./webgl-setup.js";

import * as Key from "./KeyboardUI.js";
import * as MV from "./MV+.js";


//// Constants

// Initial settings. See the settings object.
const EXPLOSION_SCALE = 0.1,
      EXPLOSION_SPEED = 0.01,
      ROTATION_SPEED = 360/1000,
      X_SPEED = 0.01,
      Y_SPEED = 0.01,
      Z_SPEED = 0.01,
      MULTI_AXIS_MOVEMENT = false;

const X_FIELD_OF_VIEW = 90,
      ASPECT_RATIO = 5/3;

const MIN_CANVAS_HEIGHT = 200;

const PERSPECTIVE_NEAR_PLANE = 0.001,
      PERSPECTIVE_FAR_PLANE = 1000;


//// Prepare the canvas

const canvas = document.querySelector("#webglCanvas");

{
    // Set height to either 200 or as tall as it can be without pushing anything else off-screen
    canvas.height = 0;
    let body = window.getComputedStyle(document.body);
    let height = document.body.scrollHeight + parseInt(body.marginTop) + parseInt(body.marginTop);

    canvas.height = Math.max(MIN_CANVAS_HEIGHT, window.innerHeight - height);

    // Set width to
    canvas.width = (canvas.height * ASPECT_RATIO);
    if (canvas.width > document.body.clientWidth) {
        canvas.width = document.body.clientWidth;
        canvas.height = canvas.width / ASPECT_RATIO;
    }
}


//// Set up WebGL, the program, buffers, and shader variables

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


const buffers = Object.freeze({
    position: gl.createBuffer(), // vertices
    normal: gl.createBuffer(),   // normal vectors
});

// Set up the shader variables
const shader = Object.freeze({
    position:         gl.getAttribLocation(program, "aPosition"),
    faceNormal:       gl.getAttribLocation(program, "faceNormal"),

    explosionScale:   gl.getUniformLocation(program, "explosionScale"),

    modelMatrix:      gl.getUniformLocation(program, "modelMatrix"),
    viewMatrix:       gl.getUniformLocation(program, "viewMatrix"),
    projectionMatrix: gl.getUniformLocation(program, "projectionMatrix"),
});



//// Global animation state

/**
 * Container for configural animation settings
 *
 * @property {number} explosion_scale   multiplier for explosion size
 * @property {number} explosion_speed   percent of explosion per millisecond
 * @property {number} rotation_speed    degrees of rotation per millisecond
 * @property {number} x_speed           multiplier for movement along X-axis
 * @property {number} y_speed           multiplier for movement along Y-axis
 * @property {number} z_speed           multiplier for movement along Z axis
 * @property {boolean} multi_axis_movement whether to allow movement along more
 *                                         than one axis at the same time
 */
class Settings {
    constructor() {
        this.initialize();
        this.uiElements = [];
        Object.seal(this); // prevent addition of new properties
    }

    initialize() {
        this.explosion_scale = EXPLOSION_SCALE;
        this.explosion_speed = EXPLOSION_SPEED;
        this.rotation_speed = ROTATION_SPEED;
        this.x_speed = X_SPEED;
        this.y_speed = Y_SPEED;
        this.z_speed = Z_SPEED;
        this.multi_axis_movement = MULTI_AXIS_MOVEMENT;
    }

    reset() {
        this.initialize();

        for (let [setting, element] of this.uiElements) {
            element.value = this[setting];
        }
    }

    /**
     * Register a UI element to reset when settings reset
     *
     * @param {String} setting The setting associated with the UI element
     * @param {Element} element The element to associate with the setting
     *
     * When settings are reset, the element's {@code value} will be set to the
     * setting's value.
     */
    bindUI(setting, element) {
        this.uiElements.push([setting, element]);
    }
}

/**
 * Global user-configurable settings object
 *
 * @see Settings
 */
const settings = new Settings();

/**
 * Determine current explosion position as function of time
 *
 * This is applied after {@link settings.explosion_speed}
 */
function easeExplosion(t) {
    return (1 - Math.cos(t)) / 2;
}

/**
 * Global animation state
 *
 * @see AnimationState
 */
const animationState = new AnimationState(settings);



//// Canvas/GL/Mesh preparation functions

function clearCanvas() {
    gl.clearColor(0, 0, 0, 1);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function distance(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) ** 2 +
                     (p1[1] - p2[1]) ** 2 +
                     (p1[2] - p2[2]) ** 2);
}

/**
 * Set up the projection and view matrices based on the mesh
 *
 * The mesh is viewed from distance equal to its depth (z-width), with a 10%
 * margin in all directions.
 */
function setProjection(mesh) {
    let bounds = mesh.extent;

    let fov_x = X_FIELD_OF_VIEW * Math.PI / 180,
        fov_y = fov_x / ASPECT_RATIO,
        // Distance required to view entire width/height
        width_distance = bounds.width / (2 * Math.tan(fov_x / 2)),
        height_distance = bounds.height / (2 * Math.tan(fov_y / 2)),
        // Distance camera must be to view full mesh
        camera_z = bounds.near + Math.max(width_distance, height_distance) * 1.1;

    let projectionMatrix = MV.perspectiveRad(
        fov_y, ASPECT_RATIO, PERSPECTIVE_NEAR_PLANE, PERSPECTIVE_FAR_PLANE);

	let eye = vec3(bounds.midpoint[0],
                   bounds.midpoint[1],
                   camera_z),
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
 * Set the normal vectors in the shader for the given mesh
 */
function setNormals(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);

    gl.vertexAttribPointer(shader.faceNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.faceNormal);

    gl.bufferData(gl.ARRAY_BUFFER,
                  MV.flatten(mesh.normals),
                  gl.STATIC_DRAW);
}

/**
 * Set the vertices in the shader for the given mesh
 */
function setVertices(mesh) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(shader.position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shader.position);

    gl.bufferData(gl.ARRAY_BUFFER,
                  MV.flatten(mesh.vertices),
                  gl.STATIC_DRAW);
}



/**
 * Prepare webgl and the animations for a new mesh
 */
function animateMesh(mesh) {
    animationState.reset();
    drawMesh(mesh);
}

/**
 * Draw and animate the shape specified by the arguments
 * @param {Mesh} mesh
 */
function drawMesh(mesh) {
    let bounds = mesh.extent;

    let explosionSize = settings.explosion_scale * bounds.radius,
        t_exp = animationState.explosion.position,
        normalScale = easeExplosion(t_exp); // Distance of movement along face normals

    gl.uniform1f(shader.explosionScale, normalScale * explosionSize);

    let rotation = MV.rotateX(animationState.xrotation.position);

    let tr_x = bounds.radius * animationState.xtranslation.position,
        tr_y = bounds.radius * animationState.ytranslation.position,
        tr_z = bounds.radius * animationState.ztranslation.position,
        translation = MV.translate(tr_x, tr_y, tr_z);

    let model = MV.mult(translation, rotation);

    gl.uniformMatrix4fv(shader.modelMatrix, false, MV.flatten(model));

    clearCanvas();

    for (let [size, offset] of mesh.faceoffsets) {
        gl.drawArrays(gl.LINE_LOOP, offset, size);
    }

    animationState.animate(() => drawMesh(mesh));
}



//// Control initialization


// File upload controls / "main" function
document.querySelector("#fileControls input[type='file']")
    .addEventListener("change", e => {
        // Hide the parse error message if it was present
        document.querySelector("#fileControls .error-message").innerText = "";

        readFile(e)
            .then(parsePly)
            .catch(reason => {
                // If parsing fails, display a message to the user.
                console.error(reason);
                document
                    .querySelector("#fileControls .error-message")
                    .innerText = "parse error; see console for details";
                throw reason;
            })
            .then(([vertices, faces]) => {
                animationState.cancel(); // Stop the ongoing animation
                // Prepare the mesh and mesh-based WebGL variables
                let mesh = new Mesh(vertices, faces);
                setProjection(mesh);
                setNormals(mesh);
                setVertices(mesh);

                animateMesh(mesh); // start the animations
            })
            .catch(console.error);
    });

// Remove highlight from Q and F keys when they are released.x
window.addEventListener("keyup", e => {
    switch (e.key.toUpperCase()) {
    case "Q": // fallthrough
    case "F":
        Key.deactivate(e.key);
        break;
    }
});

/**
 * Actions taken when a translation key is pressed
 *
 * @param {KeyboardEvent} event The triggering keydown event
 * @param {'x'|'y'|'z'} axis The axis to rotate along, "x", "y", or "z".
 * @param {number} scale A multiplier for the speed; should be +1 or -1
 * @param {String} opposingKey The key that produces the opposite translation
 *
 * If {@link settings.multi_axis_movement} is false, stops all other translations.
 */
function translationControl(event, axis, scale, opposingKey) {
    axis = axis.toLowerCase();

    let animation = animationState[`${axis}translation`];

    if (animation === undefined) {
        throw new Error("Program error: invalid axis given or missing animation or speed setting");
    }

    let alreadyRunning = animation.isrunning();

    if (!settings.multi_axis_movement) {
        animationState.stopTranslations();
    }

    // assumes both scales are +/- 1, which is true in this program
    if (!(alreadyRunning && animation.scale === scale)) {
        // Start animation unless it was already running in the right diretion
        animation.scale = scale;
        animation.start();
    }
    else {
        animation.stop();
    }
    Key.toggle(event.key, opposingKey, !settings.multi_axis_movement);
    event.preventDefault();
}

/**
 * Actions taken when a toggle-able control key is pressed
 *
 * @param {KeyboardEvent} event The triggering keydown event
 * @param {String} animation The animation, a property of {@link AnimationState}
 */
function toggleControl(event, animation) {
    if (!animationState.hasOwnProperty(animation)) {
        throw new Error("Program error: invalid animation property");
    }

    animationState[animation].toggle();
    Key.toggle(event.key);
    event.preventDefault();
}

// Keyboard controls
window.addEventListener("keydown", e => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return; // Ignore keys with non-shift modifiers
    }

    switch (e.key.toUpperCase()) {
        // Reset keys
    case "Q":
        animationState.reset();
        Key.deactivateAll();
        Key.activate("Q");
        e.preventDefault();
        break;
    case "F":
        animationState.stopAnimations();
        Key.deactivateClass("toggle");
        Key.activate("F");
        e.preventDefault();
        break;

        // Toggle-able controls
    case "B":
        toggleControl(e, "explosion");
        break;
    case "R":
        toggleControl(e, "xrotation");
        break;

        // Translation controls
    case "X":
        translationControl(e, "x", 1, "C");
        break;
    case "C":
        translationControl(e, "x", -1, "X");
        break;
    case "Y":
        translationControl(e, "y", 1, "U");
        break;
    case "U":
        translationControl(e, "y", -1, "Y");
        break;
    case "Z":
        translationControl(e, "z", 1, "A");
        break;
    case "A":
        translationControl(e, "z", -1, "Z");
        break;
    }
});


//// Configuration control setup

// Bind the multi-axis-movement checkbox
document.querySelector("#multiAxisMovement")
    .addEventListener("change", e => {
        settings.multi_axis_movement = e.target.value;
    });
settings.bindUI("multi_axis_movement", document.querySelector("#multiAxisMovement"));

/**
 * Bind an event listener for a slider that sets a property of an object.
 *
 * Also binds the reset button to restore values to their original values (when
 * this function was called), and sets the slider's current value to that value.
 *
 * @param {String} selector A selector string for the slider
 * @param {Object} object   The object that should have a property set
 * @param {String} property The name of the property to set
 */
function bindSlider(selector, object, property) {
    let defaultvalue = object[property],
        slider = document.querySelector(selector);

    slider.value = defaultvalue;

    settings.bindUI(property, slider);

    document.querySelector("button.reset") .addEventListener("click", e => {
        object[property] = defaultvalue;
        slider.value = defaultvalue;
    });

    slider.addEventListener("input", e => {
        object[property] = e.target.value;
    });
}

bindSlider(".speed-slider.explosion", settings, "explosion_speed");
bindSlider(".speed-slider.x.rotation", settings, "rotation_speed");
bindSlider(".speed-slider.x.translation", settings, "x_speed");
bindSlider(".speed-slider.y.translation", settings, "y_speed");
bindSlider(".speed-slider.z.translation", settings, "z_speed");
bindSlider(".scale-slider.explosion", settings, "explosion_scale");

clearCanvas();
