/**
 * Get a keyboard key in the user interface by key name, as given by
 * {@link KeyboardEvent.key}, case-insensitive.
 */
function uiKey(key) {
    if (typeof key === "string") {
        return document.querySelector(`kbd.key.${key.toLowerCase()}`);
    }
    else {
        return key;
    }
}

/**
 * Add the activation hightlight to one key and optionally remove it from another
 * @param {String} key The key to highlight
 * @param {?String} offKey A key to un-highlight
 *
 * @see activateKey
 * @see deactivateKey
 */
export function activate(key, offKey = null) {
    key = uiKey(key);
    if (key) {
        key.classList.add("active");
    }

    if (offKey) {
        deactivate(offKey);
    }
}

/**
 * Toggle the activation highlight for a keyboard control in the UI
 *
 * @param {String} key The key to toggle
 * @param {?String} offKey A key to deactivate if the toggled key is turned on
 * @param {?boolean} disableShared whether to disabled shared keys
 *
 * If the key has the {@code shared} CSS class and {@code disableShared} is
 * true, deactivate all other keys with that class.
 */
export function toggle(key, offKey = null, disableShared = true) {
    key = uiKey(key);
    if (key) {
        let active = key.classList.toggle("active");
        if (disableShared && key.classList.contains("shared")) {
            deactivateSelector(".shared");
        }
        if (active) {
            activate(key);
            if (offKey) {
                deactivate(offKey);
            }
        }
    }
}

/**
 * Remove the activation highlight from a keyboard control in the UI
 */
export function deactivate(key) {
    key = uiKey(key);
    if (key) {
        key.classList.remove("active");
    }
}

/**
 * Remove highlighting from all keys in the user interface
 */
export function deactivateAll() {
    deactivateSelector("*");
}

/**
 * Remove highlighting form all keys with the given class
 */
export function deactivateClass(classname) {
    deactivateSelector(`.${classname}`);
}

/**
 * Remove highlighting from keys matching a DOM selector
 *
 * Appends {@code .key} to the selector.
 */
export function deactivateSelector(selector) {
    document.querySelectorAll(`${selector}.key`).forEach(k => k.classList.remove("active"));
}
