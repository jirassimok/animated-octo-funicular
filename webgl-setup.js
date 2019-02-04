/* WebGL initialization functions. */

/**
 * Display the {@code #errorMessage} element with the given message
 */
function showError(message) {
    let errelt = document.querySelector("#errorMessage");
    errelt.innerHTML = message;
    errelt.style.display = "block";
}

/**
 * Create and compile a shader of the given type
 * @param {WebGLRenderingContext} gl
 * @param shaderType
 * @param {String} programText
 * @returns {?WebGLShader}
 */
function makeShader(gl, shaderType, programText) {
    let shader = gl.createShader(shaderType);
    gl.shaderSource(shader, programText);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        return shader;
    }
    else {
        console.error("Failed to create shader: " + gl.getShaderInfoLog(shader));
        showError(shaderCreationError(shaderType === gl.VERTEX_SHADER ? "vertex" : "fragment"));
        return null;
    }
}

/**
 * Combine shaders into a program
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vertexShader
 * @param {WebGLShader} fragmentShader
 * @returns {?WebGLProgram}
 */
function linkShaders(gl, vertexShader, fragmentShader) {
    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
        return program;
    } else {
        console.error("Failed to link shaders." + gl.getProgramInfoLog(program));
        showError(shaderLinkError);
        return null;
    }
}

/**
 * Create and prepare a WebGL context.
 * @param {HTMLCanvasElement} canvas The canvas on which to draw.
 * @returns {?WebGLRenderingContext} The WebGL context..
 *
 * If the WebGL context is created and the required extensions loaded, it will be
 * returned, otherwise,  will be {@code null}.
 */
export function setupWebGL(canvas) {
    let gl = canvas.getContext("webgl");

    if (!gl) {
        showError(webGlSetupError);
        return null;
    }

    return gl;
}

/**
 * Activate the vertex array object extension
 */
export function enableVAO(gl) {
    let vao = gl.getExtension("OES_vertex_array_object");

    if (vao === null) {
        showError(VAOError);
        return null;
    }

    return vao;
}

/**
 * Prepare a program from the given WebGL context and shader programs.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {DOMString} vertexShaderProgram The text of the vertex shader program.
 * @param {DOMString} fragmentShaderProgram The text of the fragment shader program.
 * @returns {?WebGLProgram} The program.
 *
 * If the shaders fail to compile or link, the returned program will be {@code null}.
 */
export function setupProgram(gl, vertexShaderProgram, fragmentShaderProgram) {
    // Set up shaders and program.

    let vertexShader = makeShader(gl, gl.VERTEX_SHADER, vertexShaderProgram);
    if (vertexShader === null) {
        return null;
    }
    let fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fragmentShaderProgram);
    if (fragmentShader === null) {
        return null;
    }
    let program = linkShaders(gl, vertexShader, fragmentShader);
    if (program === null) {
        return null;
    }

    return program;
}

//// Error messages

let webGlSetupError = `
     <p>Error: unable to create WebGL context.</p>
     <p>Make sure you are using a browser that supports <a href="https://get.webgl.">WebGL</a>.</p>
`;

let VAOError = `
    <p>
        Error: unable to load
    <a href="https://developer.mozilla.org/en-US/docs/Web/API/OES_vertex_array_object">
        <code>OES_vertex_array_object</code>
        </a> extension.
    </p>
    <p>Please use a browser that supports this extension, such as
        <a href="https://www.google.com/chrome/">Google Chrome</a> or
        <a href="https://www.mozilla.org/en-US/firefox/n~ew/">Firefox</a>.
    </p>
`;

/**
 * Create an error message for either shadr
 * @param {string} shader Either "vertex" or "fragment"
 */
function shaderCreationError(shader) {
    return `<p>Failed to create ${shader} shader. View the console for more information.</p>`;
}

let shaderLinkError = "<p>Failed to link shaders. View the console for more information.</p>";
