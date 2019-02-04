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
                             ? (window.performance.now() - this.laststarted)
                             : 0);
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
            this._time += window.performance.now() - this.laststarted;
            this.laststarted = null;
        }
    }
}
