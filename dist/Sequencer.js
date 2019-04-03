import { interval, never, Subject, zip } from 'rxjs';
import { concat, switchMap } from 'rxjs/operators';
/**
 * Simply a pass-thru function to be used with-in a group functions parentheses.
 *
 * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
 * @param ctor    A type being subclass of `TimeSegment`, specifically `CountupSegment` or
 * `CountdownSegment`.
 * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used
 * inside a group function, the `omitFirst` can be used to omit this segment when its assigned to
 * the first interval.
 * @returns       An instance of `T` type, which is a subclass of `TimeSegment`.
 */
export function add(ctor, config) {
    return { ctor, config };
}
export class SegmentCollection {
    constructor(config, pauseObserv) {
        this.config = config;
        this.pauseObserv = pauseObserv;
        this.segments = new Array();
    }
    add(ctor, config) {
        const segment = new ctor(config);
        segment.collection = this;
        segment.seqConfig = this.config;
        segment.pauseObserv = this.pauseObserv;
        this.segments.push(segment);
        return segment;
    }
    group(intervals = 1, ...segments) {
        let segment;
        // TODO: possibly use the 'repeat' operator in here..
        for (let index = 0; index < intervals; index++) {
            segments.forEach((value) => {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = this.add(value.ctor, value.config);
                    segment.interval = { current: index + 1, total: intervals };
                }
            });
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return segment;
    }
    toSequencedObservable() {
        let concatObservs;
        this.segments.forEach((value, index) => {
            let observable;
            if (index === this.segments.length - 1) {
                if (index !== 0) {
                    observable = value.initializeObservable(false, true);
                }
                else {
                    observable = value.initializeObservable(true, true);
                }
            }
            else {
                if (index !== 0) {
                    observable = value.initializeObservable();
                }
                else {
                    observable = value.initializeObservable(true);
                }
            }
            if (concatObservs) {
                concatObservs = concatObservs.pipe(concat(observable));
            }
            else {
                concatObservs = observable;
            }
        });
        return concatObservs;
    }
    /** @internal */
    __marauder() {
        return { segments: this.segments };
    }
}
/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor  Sequencer must be instantiated with a value for period that is read in
 * milliseconds.  This value becomes static and global to its segments.
 */
export class Sequencer {
    constructor(config) {
        this.config = config;
        this.pauseObserv = new Subject();
        this.collection = new SegmentCollection(config, this.pauseObserv);
    }
    /**
     * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
     * @param ctor    A type being subclass of `TimeSegment`,  Specifically `CountupSegment` or
     * `CountdownSegment`.
     * @param config  Config file specifiying `duration` (required) and `states` (optional).  When
     * used inside a group function, the `omitFirst` can be used to omit this segment when its
     * assigned to the first interval.
     * @returns       An instance of `T` type, which is a subclass of TimeSegment.
     */
    add(ctor, config) {
        return this.collection.add(ctor, config);
    }
    /**
     * Multiply its combined `add()` invocations and returns a `TimeSegment`.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater
     * in value.
     * @param segments  Consists of `add()` invocations returns.
     * @returns         An instance of `T` type, which is a subclass of `TimeSegment`.
     */
    group(intervals = 1, ...segments) {
        return this.collection.group(intervals, ...segments);
    }
    /**
     * Starts internal Observable to start emitting.  This must be called after the `subscribe()` or
     * `subscribeWith()` is called.
     * @returns void.
     */
    start() {
        if (this.source) {
            this.pauseObserv.next(true);
        }
        else {
            throw "A call to subscribe() needs to be made prior to start(), pause() or reset().";
        }
    }
    /**
     * Pauses internal Observable to start emitting.  This must be called after the `subscribe()` or
     * `subscribeWith()` is called.
     * @returns void.
     */
    pause() {
        if (this.source) {
            this.pauseObserv.next(false);
        }
        else {
            throw "A call to subscribe() needs to be made prior to start(), pause() or reset().";
        }
    }
    /**
     * Resets the sequence.  This must be called after the `subscribeWith()` is called since a
     * callback object is needed.
     * That said, this method will unsubscribe and then subscribe again to "reset" the sequence.
     * @returns void.
     */
    reset() {
        if (this.source && this.observer) {
            this.unsubscribe();
            this.subscribe(this.observer);
        }
        else {
            let mesg = "";
            if (!this.source) {
                mesg += "A call to subscribe() needs to be made prior to start(), pause() or reset().";
            }
            if (!this.observer) {
                mesg += (mesg.length > 0) ? "  Also, in " : "  In ";
                mesg += "order to reset, an observer instance is needed.  See documentation on subscribe(observer).";
            }
            throw mesg;
        }
    }
    /**
     * Returns an Observable<TimeEmission> object versus a Subscription object which `subscribe()`
     * returns.  Typically `subscribe()` is just used.
     * @returns Observable<TimeEmission>.
     */
    publish() {
        this.source = this.collection.toSequencedObservable();
        return zip(this.source, this.pauseObserv.pipe(switchMap((value) => (value) ? interval(this.config.period) : never())));
    }
    subscribe(nextOrObserver, error, complete) {
        if (typeof nextOrObserver !== 'function') {
            this.observer = nextOrObserver;
        }
        if (!this.source) {
            this.publish();
        }
        this.subscription = this.source.subscribe(nextOrObserver, error, complete);
        return this.subscription;
    }
    /**
     * Unsubscribe the subscription that is create from `subscribe()` or `subscribeWith()`.  This also
     * calls the `remove()`
     * method.
     */
    unsubscribe() {
        this.remove();
        this.subscription.unsubscribe();
    }
    /**
     * Calls the remove method on the subscription object that was create from `subscribe()` or
     * `subscribeWith()`.
     */
    remove() {
        this.subscription.remove(this.subscription);
    }
    /** @internal */
    __marauder() {
        return { pauseObserv: this.pauseObserv, source: this.source };
    }
}
//# sourceMappingURL=Sequencer.js.map