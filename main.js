"use strict";

import { readFile, parsePly } from "./filereaders.js";

document.querySelector("#fileControls input[type='file']")
    .addEventListener("change", e => {
        readFile(e)
            .then(parsePly)
            .then(([v, f]) => {
                console.log(v);
                console.log(f);
            })
            .catch(reason => document
                   .querySelector("#fileControls .error-message")
                   .innerText = "parse error; see console for details");
    });
