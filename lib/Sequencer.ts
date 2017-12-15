import { Observable, Subject } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface, SequenceConfigShape } from './api/Segment';
import { TimeSegment } from './Segments';
import { Subscription } from 'rxjs/Subscription';
import { Observer } from 'rxjs/Observer';
import { Subscribable } from './api/Subscribable';
//import { toSubscriber } from 'rxjs/util/toSubscriber';



/**
 * Simply a pass-thru function to be used with-in a group functions parentheses.
 * 
 * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
 * @param ctor    A type being subclass of `TimeSegment`, specifically `CountupSegment` or `CountdownSegment`.
 * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used inside a group
 * function, the `omitFirst` can be used to omit this segment when its assigned to the first interval.
 * @returns       An instance of `T` type, which is a subclass of `TimeSegment`.
 */
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): GroupParameter<T> {
    return { ctor, config };
}

export class SegmentCollection {
    private segments: Array<TimeSegment>;

    constructor(public config: SequenceConfigShape) {
        this.segments = new Array();
    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        const segment: T = new ctor(config);
        segment.collection = this;
        segment.seqConfig = this.config;
        this.segments.push(segment);

        return segment;
    }

    group<T extends TimeSegment>(intervals: number = 1, ...segments: GroupParameter<T>[]): T {
        let segment: TimeSegment;
        // TODO: possibly use the 'repeat' operator in here..
        for (let index = 0; index < intervals; index++) {
            segments.forEach((value: GroupParameter<T>) => {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = this.add(value.ctor, value.config) as TimeSegment;
                    (segment as TimeSegment).interval = { current: index + 1, total: intervals };
                }
            });
        }

        // return the last instance, so that this group invocation can be chained if needed...
        return segment! as T;
    }

    toSequencedObservable(): Observable<TimeEmission> {
        let concatObservs: Observable<TimeEmission> | undefined;

        this.segments.forEach((value: TimeSegment, index: number) => {
            let observable: Observable<TimeEmission>;

            if (index === this.segments.length - 1) {
                observable = value.initializeObservable(true);
            } else {
                observable = value.initializeObservable();
            }

            if (concatObservs) {
                concatObservs = concatObservs.concat(observable);
            } else {
                concatObservs = Observable.concat(observable);
            }
        });

        return concatObservs!;
    }

    /** @internal */
    __marauder(): { segments: Array<TimeSegment> } {
        return { segments: this.segments };
    }
}

/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor  Sequencer must be instantiated with a value for period that is read in milliseconds.  This 
 * value becomes static and global to its segments.
 */
export class Sequencer implements SegmentInterface, Subscribable {
    collection: SegmentCollection;
    subscription: Subscription;
    private pauseObserv: Subject<boolean>;
    private source: Observable<TimeEmission>;
    private observer: Observer<TimeEmission>;

    constructor(public config: SequenceConfigShape) {
        this.collection = new SegmentCollection(config);
        this.pauseObserv = new Subject<boolean>();
    }
    /**
     * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
     * @param ctor    A type being subclass of `TimeSegment`,  Specifically `CountupSegment` or `CountdownSegment`.
     * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used inside a group
     * function, the `omitFirst` can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of `T` type, which is a subclass of TimeSegment.
     */
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        return this.collection.add(ctor, config);
    }

    /**
     * Multiply its combined `add()` invocations and returns a `TimeSegment`.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of `add()` invocations returns.
     * @returns         An instance of `T` type, which is a subclass of `TimeSegment`.
     */
    group<T extends TimeSegment>(intervals: number = 1, ...segments: GroupParameter<T>[]): T {
        return this.collection.group(intervals, ...segments);
    }

    /**
     * Starts internal Observable to start emitting.  This must be called after the `subscribe()` or `subscribeWith()` is called.
     * @returns void.
     */
    start(): void {
        if (this.source) {
            this.pauseObserv.next(true);
        } else {
            throw "A call to subscribe() or subscribeWith() needs to be made prior to start(), pause() or reset().";
        }
    }

    /**
     * Pauses internal Observable to start emitting.  This must be called after the `subscribe()` or `subscribeWith()` is called.
     * @returns void.
     */
    pause(): void {
        if (this.source) {
            this.pauseObserv.next(false);
        } else {
            throw "A call to subscribe() or subscribeWith() needs to be made prior to start(), pause() or reset().";
        }
    }

    /**
     * Resets the sequence.  This must be called after the `subscribeWith()` is called since a callback object is needed.
     * That said, this method will unsubscribe and then subscribe again to "reset" the sequence.
     * @returns void.
     */
    reset(): void {
        if (this.source && this.observer) {
            this.unsubscribe();
            // this.subscribeWith(this.callback);
        } else {
            let mesg: string = "";
            if (!this.source) {
                mesg += "A call to subscribe() or subscribeWith() needs to be made prior to start(), pause() or reset().";
            }

            if (!this.observer) {
                mesg += (mesg.length > 0) ? "  Also, in " : "  In ";
                mesg += "order to reset, a callback instance is needed.  See documentation on subscribeWith().";
            }
            throw mesg;
        }
    }

    /**
     * Returns an Observable<TimeEmission> object versus a Subscription object which `subscribe()` returns.  Typically `subscribe()`
     * is just used.
     * @returns Observable<TimeEmission>.
     */

    publish(): Observable<TimeEmission> {
        this.source = this.collection.toSequencedObservable();

        return Observable.from(this.source)
            .zip(this.pauseObserv.switchMap(
                (value) => (value) ? Observable.interval(this.config.period) : Observable.never<number>()),
            (value: TimeEmission) => value);
    }

    /**
     * Pass in callback functions to "subscribe" to emissions from sots.  See also `subscribeWith()`.
     * 
     * @returns Subscription.
     */
    //subscribe(): Subscription

    subscribe(observer: Observer<TimeEmission>): Subscription;
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(nextOrObserver: any, error?: (error: any) => void, complete?: () => void): Subscription {

        if (typeof nextOrObserver !== 'function') {
            this.observer = nextOrObserver;
        }
        this.subscription = this.publish().subscribe(nextOrObserver, error, complete);

        return this.subscription;
    }

    /**
     * This method primarily serves the same purpose as `subscribe()` and in an addition enables reset method to be 
     * callable.
     * 
     * @param callback must implement SequencerCallback.
     * @returns Subscription
     subscribeWith(observer: Observer<TimeEmission>): Subscription {
         return this.subscribe(observer.next, observer.error, observer.complete);
        }
        */
    //this.subscribe(observer);

    //callBack: (next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void)

    /**
     * Unsubscribe the subscription that is create from `subscribe()` or `subscribeWith()`.  This also calls the `remove()`
     * method.
     */
    unsubscribe(): void {
        this.remove();
        this.subscription.unsubscribe();
    }

    /**
     * Calls the remove method on the subscription object that was create from `subscribe()` or `subscribeWith()`.
     */
    remove(): void {
        this.subscription.remove(this.subscription);
    }

    /** @internal */
    __marauder(): { pauser: Subject<boolean>, source: Observable<TimeEmission> } {
        return { pauser: new Subject(), source: this.source! };
    }
}
