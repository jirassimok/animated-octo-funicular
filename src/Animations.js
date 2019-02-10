/**
 * Class tracking state of each animation (translation, rotation, and explosion)
 *
 * The current animation state is stored in the variable {@code animationState},
 * which should be the only instance of this class. Do not attempt to save
 * references to its value, as it will change when the state is reset.
 *
 * Explosion and rotation are represented as pausable timers that increase while
 * the animations are running.
 *
 * The translations are represented as bi-directional timers that increase for
 * positive motion and decrease for negative motion.
 *
 * The animations' effects are determined by functions of the timers' values in
 * {@link drawMesh}.
 *
 * @property {PausableTimer} explosion time spent in explosion/pulse animation
 *
 * @property {AnimationTracer} xrotation State of rotation around X-axis
 *
 * @property {ReversableTimer} xtranslation difference between time spent moving
 *                                          in positive and negative X direction
 * @property {ReversableTimer} ytranslation difference between time spent moving
 *                                          in positive and negative Y direction
 * @property {ReversableTimer} ztranslation difference between time spent moving
 *                                          in positive and negative Z direction
 */
export class AnimationState {
    /**
     * Create a new animation state obejct using the given settings object.
     *
     * @param {Object} settings The animations' settings.
     *
     * The settings object may be modified to change the animation's settings.
     *
     * To replace the animation state, use the {@code reset} method.
     */
    constructor(settings) {
        this.id = null; // The ID of the current animation frame
        this.settings = settings;
        this.initialize(settings);
    }

    initialize(settings) {
        this.explosion = new AnimationTracker(() => settings.explosion_speed);
        this.xrotation = new AnimationTracker(() => settings.rotation_speed);

        this.xtranslation = new AnimationTracker(() => settings.x_speed);
        this.ytranslation = new AnimationTracker(() => settings.y_speed);
        this.ztranslation = new AnimationTracker(() => settings.z_speed);

        this.animations = [this.explosion,
                           this.xrotation,
                           this.xtranslation,
                           this.ytranslation,
                           this.ztranslation];

        this.translations = [this.xtranslation,
                             this.ytranslation,
                             this.ztranslation];
    }

    /** * Reset the global animation state */
    reset() {
        this.initialize(this.settings);
    }

    /** * Request an animation frame and save its ID */
    animate(callback) {
        this.id = window.requestAnimationFrame(callback);
    }

    cancel() {
        window.cancelAnimationFrame(this.id);
    }

    stopAnimations() {
        this.animations.forEach(a => a.stop());
    }

    stopTranslations() {
        this.translations.forEach(a => a.stop());
    }
}

/**
 * Timer for animations; tracks position in an animation
 *
 * @property {number} speed A function that will return the animation's speed in
 *                          units per millisecond
 * @property {?number} lastupdated The time the animation was last updated, or
 *                                 null if the animation is not running
 * @property {number} scale A multiplier for the speed, useful for reversing (-1)
 *
 * Whenever the animation is checked, if it is running, the time since the last
 * check is multiplied by its speed and scale, and the result is added to the
 * position.
 *
 * Every millisecond that the animation runs, it moves an amount equal to the
 * product of its speed and scale.
 */
export class AnimationTracker {
    constructor(speed = () => 1) {
        this.speed = speed;
        this.scale = 1;
        this.lastupdated = null;
        this._position = 0;
    }

    /** @returns time since position was last updated */
    timeSinceUpdate() {
        return window.performance.now() - this.lastupdated;
    }

    /** Update the animation's position by its speed */
    updatePosition() {
        if (this.lastupdated) {
            this._position += this.scale * this.speed() * this.timeSinceUpdate();
            this.lastupdated = window.performance.now();
        }
    }

    // Main public API

    isrunning() {
        return this.lastupdated !== null;
    }

    /**
     * Get the current position in the animation
     */
    get position() {
        this.updatePosition();
        return this._position;
    }

    start() {
        if (!this.lastupdated) {
            this.lastupdated = window.performance.now();
        }
    }

    stop() {
        this.updatePosition();
        this.lastupdated = null;
    }

    /**
     * Toggle the animation and return whether it is running
     */
    toggle() {
        if (this.lastupdated) {
            this.stop();
        }
        else {
            this.start();
        }
        return this.lastupdated !== null;
    }
}
