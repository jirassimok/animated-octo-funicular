/**
 * Keeps track of time passed, and can be paused
 */
export class PausableTimer {
    constructor() {
        this.isrunning = false;
        this.laststarted = null; // when the animation was last resumed
        this._time = 0; // total time animated
    }

    /** @returns total time active, in milliseconds */
    timeElapsed() {
        return this._time + (this.isrunning
                             ? this.timeSinceStart()
                             : 0);
    }

    /** @returns time since the timer was last started */
    timeSinceStart() {
        return window.performance.now() - this.laststarted;
    }

    /**
     * Switch the timer between started and stopped
     * @returns true if the timer was started
     */
    toggle() {
        if (this.isrunning) {
            this.stop();
        }
        else {
            this.start();
        }
        return this.isrunning;
    }

    start() {
        if (!this.isrunning) {
            this.isrunning = true;
            this.laststarted = window.performance.now();
        }
    }

    stop() {
        if (this.isrunning) {
            this.isrunning = false;
            // Add time since last start to total time
            this._time += this.timeSinceStart();
            this.laststarted = null;
        }
    }
}

/**
 * Keeps track of time passed, can be paused, and can be run backwards
 */
export class ReversableTimer extends PausableTimer {
    constructor() {
        super();
        this.reversed = false;
    }

    timeSinceStart() {
        return (1 - 2 * this.reversed) *
            (window.performance.now() - this.laststarted);
    }

    startReverse() {
        super.stop();
        this.reversed = true;
        super.start();
    }

    startForward() {
        super.stop();
        this.reversed = false;
        super.start();
    }

    stopReverse() {
        if (this.reversed) {
            super.stop();
        }
    }

    stopForward() {
        if (!this.reversed) {
            super.stop();
        }
    }

    /**
     * If running forward, stop. Otherwise, run forward.
     */
    toggleForward() {
        if (this.isrunning && !this.reversed) {
            super.stop();
        }
        else {
            this.startForward();
        }
    }

    /**
     * If running backward, stop. Otherwise, run backwards.
     */
    toggleReverse() {
        if (this.isrunning && this.reversed) {
            super.stop();
        }
        else {
            this.startReverse();
        }
    }
}

/**
 * Timer for animations; tracks position in the animation rather than time
 *
 * @property {number} speed A function that will return the animation's speed in
 *                          units per millisecond
 * @property {?number} lastupdated The time the animation was last updated, or
 *                                 null if the animation is not running.
 */
export class AnimationTracker {
    constructor(speed = () => 1) {
        this.speed = speed;
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
            this._position += this.speed() * this.timeSinceUpdate();
            this.lastupdated = window.performance.now();
        }
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
        return (this.lastupdated !== null);
    }
}
