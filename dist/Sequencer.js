"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx_1 = require("rxjs/Rx");
var events_1 = require("events");
//import * as Rx from 'rxjs/Rx';
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
var EmitterEvents;
(function (EmitterEvents) {
    EmitterEvents["start"] = "start";
    EmitterEvents["pause"] = "pause";
    EmitterEvents["reset"] = "reset";
    EmitterEvents["complete"] = "complete";
})(EmitterEvents || (EmitterEvents = {}));
/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor   Sequencer must be instantiated with a value for period that is read in milliseconds.  This value becomes static and global to its segments.
 * @returns   an instance.
 */
var Sequencer = /** @class */ (function () {
    //  private resetEventObserv: Observable<{}>;
    // private completeEventObser: Observable<{}>;
    function Sequencer(config) {
        this.config = config;
        /**
         * Starts internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
         * @returns void.
         */
        this.status = false;
        this.collection = new SegmentCollection(config);
        this.pauser = new Rx_1.Subject();
        this.initEmitterAndObservs();
    }
    Sequencer.prototype.initEmitterAndObservs = function () {
        this.emitter = new events_1.EventEmitter();
        this.startEventObserv = Rx_1.Observable.fromEvent(this.emitter, EmitterEvents.start);
        this.pauseEventObserv = Rx_1.Observable.fromEvent(this.emitter, EmitterEvents.pause);
        // this.resetEventObserv = Observable.fromEvent(this.emitter, EmitterEvents.reset);
        // this.completeEventObser = Observable.fromEvent(this.emitter, EmitterEvents.complete);
    };
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
    Sequencer.prototype.start = function () {
        if (this.source) {
            this.status = true;
            this.pauser.next(true);
            this.emitter.emit(EmitterEvents.start, this.status);
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
        if (this.source) {
            this.pauser.next(false);
            this.emitter.emit(EmitterEvents.pause);
            this.status = false;
            this.emitter.emit(EmitterEvents.start, this.status);
        }
        else {
            throw "A call to subscribe() needs to be made prior to start() or pause().";
        }
    };
    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    Sequencer.prototype.reset = function () {
        if (this.source) {
            this.emitter.emit(EmitterEvents.reset);
        }
        else {
            throw "A call to subscribe() needs to be made prior to start() or pause().";
        }
    };
    Sequencer.prototype.publish = function () {
        var _this = this;
        this.source = this.collection.toSequencedObservable();
        this.startEventObserv;
        this.pauseEventObserv;
        return Rx_1.Observable.from(this.source).zip(this.pauser.switchMap(function (value) { return (value) ? Rx_1.Observable.interval(_this.config.period) : Rx_1.Observable.never(); }), function (value, index) {
            console.log(value + " ## " + index);
            return value;
        });
        /*
        this.subscribedObservable = Observable.merge(
            this.startEventObserv.switchMap(() =>
                                    Observable.interval(this.config.period, Rx.Scheduler.async).takeUntil(this.pauseEventObserv)
                                  )
                                 .map(() => 1).startWith(0),
            this.resetEventObserv.map(() => 0)
        )
        
                this.subscribedObservable = Observable.merge(
                    this.startEventObserv.switchMap(() =>
                        Observable.interval(this.config.period, Rx.Scheduler.async).takeUntil(this.pauseEventObserv)).map(() => 1).startWith(0),
                    this.resetEventObserv.map(() => 0)
                )
                    .scan((acc: number, value: number, _index: number) => (value === 0 ? 0 : acc + value), 0)
                    .mergeMap((value: number, _index: number) => {
                        return this.source.elementAt(value)
                            .catch((_err, caught: Observable<TimeEmission>) => {
                                // TODO: this is thrown because of out of range on elementAt().
                                // emitting here serves the purpose, but there must be
                                // a better way of handling this.
                                this.emitter.emit(EmitterEvents.complete);
                                return caught;
                            });
                    })
                    .takeUntil(this.completeEventObser);
                    return this.subscribedObservable;
                    */
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
        return { pauser: new Rx_1.Subject(), source: this.source };
    };
    return Sequencer;
}());
exports.Sequencer = Sequencer;
//# sourceMappingURL=Sequencer.js.map