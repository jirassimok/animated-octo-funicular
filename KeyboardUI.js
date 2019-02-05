/**
 * Get a keyboard key in the user interface by key name, as given by
 * {@link KeyboardEvent.key}, case-insensitive.
 */
function uiKey(key) {
    return document.querySelector(`kbd.key.${key.toLowerCase()}`);
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
 * If the key has the {@code shared} CSS class, deactivate all other keys with
 * that class.
 */
export function toggle(key) {
    key = uiKey(key);
    if (key) {
        if (key.classList.contains("shared")) {
            deactivateSelector(".shared");
        }
        key.classList.toggle("active");
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
