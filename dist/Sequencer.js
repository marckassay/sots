"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx_1 = require("rxjs/Rx");
/**
 * Simply a pass-thru function to be used in the group function.
 *
 * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
 * @param ctor    A type being subclass of TimeSegment, specifically CountupSegment or CountdownSegment.
 * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
 * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
 * @returns       An instance of T type, which is a subclass of TimeSegment.
 */
function add(ctor, config) {
    return { ctor: ctor, config: config };
}
exports.add = add;
var SegmentCollection = /** @class */ (function () {
    function SegmentCollection(config) {
        this.config = config;
        this.segments = new Array();
        this.observables = new Array();
    }
    SegmentCollection.prototype.add = function (ctor, config) {
        var segment = new ctor(config);
        segment.collection = this;
        segment.seqConfig = this.config;
        this.push(segment);
        return segment;
    };
    SegmentCollection.prototype.group = function (intervals) {
        var _this = this;
        if (intervals === void 0) { intervals = 1; }
        var segments = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            segments[_i - 1] = arguments[_i];
        }
        var segment;
        var _loop_1 = function (index) {
            segments.forEach(function (value) {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = _this.add(value.ctor, value.config);
                    segment.interval = { current: index + 1, total: intervals };
                }
            });
        };
        for (var index = 0; index < intervals; index++) {
            _loop_1(index);
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return segment;
    };
    SegmentCollection.prototype.push = function (segment) {
        this.segments.push(segment);
    };
    SegmentCollection.prototype.initializeObservales = function () {
        var _this = this;
        this.segments.forEach(function (value, index) {
            var observable;
            if (index === _this.segments.length - 1) {
                observable = value.initializeObservable(true);
            }
            else {
                observable = value.initializeObservable();
            }
            _this.observables.push(observable);
        });
    };
    SegmentCollection.prototype.toSequencedObservable = function () {
        this.initializeObservales();
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
    /** @internal */
    SegmentCollection.prototype.__marauder = function () {
        return { segments: this.segments, observables: this.observables };
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
        this.collection = new SegmentCollection(config);
    }
    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    Sequencer.prototype.add = function (ctor, config) {
        return this.collection.add(ctor, config);
    };
    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    Sequencer.prototype.group = function (intervals) {
        if (intervals === void 0) { intervals = 1; }
        var segments = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            segments[_i - 1] = arguments[_i];
        }
        return (_a = this.collection).group.apply(_a, [intervals].concat(segments));
        var _a;
    };
    /**
     * Starts internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    Sequencer.prototype.start = function () {
        if (this.pauser) {
            this.pauser.next(false);
        }
        else {
            throw "A call to subscribe() needs to be made prior to start() or pause() invocation.";
        }
    };
    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    Sequencer.prototype.pause = function () {
        if (this.pauser) {
            this.pauser.next(true);
        }
        else {
            throw "A call to subscribe() needs to be made prior to start() or pause().";
        }
    };
    /**
     * Returns an Observable<TimeEmission> versus, subscribe() which returns a Subscription.  Typically subscribe()
     * is used.
     * @returns Observable<TimeEmission>.
     */
    Sequencer.prototype.publish = function () {
        var _this = this;
        if (!this.source) {
            this.pauser = new Rx_1.Subject();
            this.source = this.collection.toSequencedObservable();
            this.pauser.next(true);
            this.publication = this.pauser.switchMap(function (paused) {
                return (paused == true) ? Rx_1.Observable.never().materialize() : _this.source.materialize();
            }).dematerialize();
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
    /** @internal */
    Sequencer.prototype.__marauder = function () {
        return { pauser: this.pauser, source: this.source };
    };
    return Sequencer;
}());
exports.Sequencer = Sequencer;
//# sourceMappingURL=Sequencer.js.map