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
    timeelapsed() {
        return this._time + (this.isrunning
                             ? this.timesincestart()
                             : 0);
    }

    /** @returns time since the timer was last started */
    timesincestart() {
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
            this._time += this.timesincestart();
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

    timesincestart() {
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
