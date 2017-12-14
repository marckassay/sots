"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx_1 = require("rxjs/Rx");
/**
 * Simply a pass-thru function to be used with-in a group functions parentheses.
 *
 * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
 * @param ctor    A type being subclass of `TimeSegment`, specifically `CountupSegment` or `CountdownSegment`.
 * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used inside a group
 * function, the `omitFirst` can be used to omit this segment when its assigned to the first interval.
 * @returns       An instance of `T` type, which is a subclass of `TimeSegment`.
 */
function add(ctor, config) {
    return { ctor: ctor, config: config };
}
exports.add = add;
var SegmentCollection = /** @class */ (function () {
    function SegmentCollection(config) {
        this.config = config;
        this.segments = new Array();
    }
    SegmentCollection.prototype.add = function (ctor, config) {
        var segment = new ctor(config);
        segment.collection = this;
        segment.seqConfig = this.config;
        this.segments.push(segment);
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
        // TODO: possibly use the 'repeat' operator in here..
        for (var index = 0; index < intervals; index++) {
            _loop_1(index);
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return segment;
    };
    SegmentCollection.prototype.toSequencedObservable = function () {
        var _this = this;
        var concatObservs;
        this.segments.forEach(function (value, index) {
            var observable;
            if (index === _this.segments.length - 1) {
                observable = value.initializeObservable(true);
            }
            else {
                observable = value.initializeObservable();
            }
            if (concatObservs) {
                concatObservs = concatObservs.concat(observable);
            }
            else {
                concatObservs = Rx_1.Observable.concat(observable);
            }
        });
        return concatObservs;
    };
    /** @internal */
    SegmentCollection.prototype.__marauder = function () {
        return { segments: this.segments };
    };
    return SegmentCollection;
}());
exports.SegmentCollection = SegmentCollection;
/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor  Sequencer must be instantiated with a value for period that is read in milliseconds.  This
 * value becomes static and global to its segments.
 */
var Sequencer = /** @class */ (function () {
    function Sequencer(config) {
        this.config = config;
        this.collection = new SegmentCollection(config);
        this.pauseObserv = new Rx_1.Subject();
    }
    /**
     * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
     * @param ctor    A type being subclass of `TimeSegment`,  Specifically `CountupSegment` or `CountdownSegment`.
     * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used inside a group
     * function, the `omitFirst` can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of `T` type, which is a subclass of TimeSegment.
     */
    Sequencer.prototype.add = function (ctor, config) {
        return this.collection.add(ctor, config);
    };
    /**
     * Multiply its combined `add()` invocations and returns a `TimeSegment`.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of `add()` invocations returns.
     * @returns         An instance of `T` type, which is a subclass of `TimeSegment`.
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
     * Starts internal Observable to start emitting.  This must be called after the `subscribe()` or `subscribeWith()` is called.
     * @returns void.
     */
    Sequencer.prototype.start = function () {
        if (this.source) {
            this.pauseObserv.next(true);
        }
        else {
            throw "A call to subscribe() or subscribeWith() needs to be made prior to start(), pause() or reset().";
        }
    };
    /**
     * Pauses internal Observable to start emitting.  This must be called after the `subscribe()` or `subscribeWith()` is called.
     * @returns void.
     */
    Sequencer.prototype.pause = function () {
        if (this.source) {
            this.pauseObserv.next(false);
        }
        else {
            throw "A call to subscribe() or subscribeWith() needs to be made prior to start(), pause() or reset().";
        }
    };
    /**
     * Resets the sequence.  This must be called after the `subscribeWith()` is called since a callback object is needed.
     * That said, this method will unsubscribe and then subscribe again to "reset" the sequence.
     * @returns void.
     */
    Sequencer.prototype.reset = function () {
        if (this.source && this.callback) {
            this.unsubscribe();
            this.subscribeWith(this.callback);
        }
        else {
            var mesg = "";
            if (!this.source) {
                mesg += "A call to subscribe() or subscribeWith() needs to be made prior to start(), pause() or reset().";
            }
            if (!this.callback) {
                mesg += (mesg.length > 0) ? "  Also, in " : "  In ";
                mesg += "order to reset, a callback instance is needed.  See documentation on subscribeWith().";
            }
            throw mesg;
        }
    };
    /**
     * Returns an Observable<TimeEmission> object versus a Subscription object which `subscribe()` returns.  Typically `subscribe()`
     * is just used.
     * @returns Observable<TimeEmission>.
     */
    Sequencer.prototype.publish = function () {
        var _this = this;
        this.source = this.collection.toSequencedObservable();
        return Rx_1.Observable.from(this.source)
            .zip(this.pauseObserv.switchMap(function (value) { return (value) ? Rx_1.Observable.interval(_this.config.period) : Rx_1.Observable.never(); }), function (value) { return value; });
    };
    /**
     * Pass in callback functions to "subscribe" to emissions from sots.  See also `subscribeWith()`.
     *
     * @returns Subscription.
     */
    Sequencer.prototype.subscribe = function (next, error, complete) {
        this.subscription = this.publish().subscribe(next, error, complete);
        return this.subscription;
    };
    /**
     * This method primarily serves the same purpose as `subscribe()` and in an addition enables reset method to be
     * callable.
     *
     * @param callback must implement SequencerCallback.
     * @returns Subscription
     */
    Sequencer.prototype.subscribeWith = function (callback) {
        this.callback = callback;
        return this.subscribe(callback.next, callback.error, callback.complete);
    };
    /**
     * Unsubscribe the subscription that is create from `subscribe()` or `subscribeWith()`.  This also calls the `remove()`
     * method.
     */
    Sequencer.prototype.unsubscribe = function () {
        this.remove();
        this.subscription.unsubscribe();
    };
    /**
     * Calls the remove method on the subscription object that was create from `subscribe()` or `subscribeWith()`.
     */
    Sequencer.prototype.remove = function () {
        this.subscription.remove(this.subscription);
    };
    /** @internal */
    Sequencer.prototype.__marauder = function () {
        return { pauser: new Rx_1.Subject(), source: this.source };
    };
    return Sequencer;
}());
exports.Sequencer = Sequencer;
//# sourceMappingURL=Sequencer.js.map