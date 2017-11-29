"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx_1 = require("rxjs/Rx");
var SegmentCollection = /** @class */ (function () {
    function SegmentCollection() {
        this.segments = new Array();
        this.observables = new Array();
    }
    SegmentCollection.getInstance = function () {
        if (!SegmentCollection.instance) {
            SegmentCollection.instance = new SegmentCollection();
        }
        return SegmentCollection.instance;
    };
    /**
     * internal method
     */
    SegmentCollection.prototype.toSequencedObservable = function () {
        var len = this.observables.length;
        if (len >= 1) {
            var source = this.observables[0];
            for (var index = 1; index <= len - 1; index++) {
                source = source.concat(this.observables[index]);
            }
            return source;
        }
        else {
            throw new Error("There are no observables to sequence.  Check your configuration.");
        }
    };
    /**
     * internal method
     */
    SegmentCollection.prototype.push = function (segment) {
        this.segments.push(segment);
        this.observables.push(segment.getObservable());
        this.lastTimeSegment = segment;
    };
    /**
     * internal method
     */
    SegmentCollection.prototype.getLastSegment = function () {
        return this.lastTimeSegment;
    };
    return SegmentCollection;
}());
exports.SegmentCollection = SegmentCollection;
/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor   Sequencer must be instantiated with a value for period that is read in milliseconds.  This value becomes static and global to its segments.
 * @returns   an instance.
 */
var Sequencer = /** @class */ (function () {
    function Sequencer(config) {
        Sequencer.period = config.period;
    }
    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    Sequencer.prototype.add = function (ctor, config) {
        var segment = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    };
    // TODO: this method is complete boilder-plate code.  I need to consider Sequencer
    // as a subclass (or composite) of TimeSegment.
    // TODO: consider if intervals is '0'.
    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    Sequencer.prototype.group = function (intervals) {
        var segments = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            segments[_i - 1] = arguments[_i];
        }
        var segment;
        var _loop_1 = function (index) {
            segments.forEach(function (value) {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = new value.ctor(value.config);
                    segment.interval = { current: index + 1, total: intervals };
                    SegmentCollection.getInstance().push(segment);
                }
            });
        };
        for (var index = 0; index < intervals; index++) {
            _loop_1(index);
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return SegmentCollection.getInstance().getLastSegment();
    };
    /**
     * Starts internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    Sequencer.prototype.start = function () {
        this.pauser.next(false);
    };
    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    Sequencer.prototype.pause = function () {
        this.pauser.next(true);
    };
    /**
     * Returns an Observable<TimeEmission> versus, subscribe() which returns a Subscription.  Typically subscribe()
     * is used.
     * @returns Observable<TimeEmission>.
     */
    Sequencer.prototype.publish = function () {
        var _this = this;
        if (!this.source) {
            this.source = SegmentCollection.getInstance().toSequencedObservable();
            this.pauser = new Rx_1.Subject();
            this.pauser.next(true);
            this.publication = this.pauser.switchMap(function (paused) { return (paused == true) ? Rx_1.Observable.never() : _this.source; });
        }
        return this.publication;
    };
    /**
     * Pass in callback functions to "subscribe" to an Observable emitting.  This is the only means of making an
     * observation of emission.
     *
     * @returns Subscription.
     */
    Sequencer.prototype.subscribe = function (next, error, complete) {
        return this.publish().subscribe(next, error, complete);
    };
    return Sequencer;
}());
exports.Sequencer = Sequencer;
//# sourceMappingURL=Sequencer.js.map