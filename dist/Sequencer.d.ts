import { Observable } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface, SequenceConfigShape } from './api/Segment';
import { TimeSegment } from './Segments';
import { Subscription } from 'rxjs/Subscription';
import { PartialObserver } from 'rxjs/Observer';
import { Subscribable } from './api/Subscribable';
/**
 * Simply a pass-thru function to be used with-in a group functions parentheses.
 *
 * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
 * @param ctor    A type being subclass of `TimeSegment`, specifically `CountupSegment` or `CountdownSegment`.
 * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used inside a group
 * function, the `omitFirst` can be used to omit this segment when its assigned to the first interval.
 * @returns       An instance of `T` type, which is a subclass of `TimeSegment`.
 */
export declare function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): GroupParameter<T>;
export declare class SegmentCollection {
    config: SequenceConfigShape;
    private segments;
    constructor(config: SequenceConfigShape);
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T;
    group<T extends TimeSegment>(intervals?: number, ...segments: GroupParameter<T>[]): T;
    toSequencedObservable(): Observable<TimeEmission>;
}
/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor  Sequencer must be instantiated with a value for period that is read in milliseconds.  This
 * value becomes static and global to its segments.
 */
export declare class Sequencer implements SegmentInterface, Subscribable {
    config: SequenceConfigShape;
    collection: SegmentCollection;
    subscription: Subscription;
    private pauseObserv;
    private source;
    private observer;
    constructor(config: SequenceConfigShape);
    /**
     * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
     * @param ctor    A type being subclass of `TimeSegment`,  Specifically `CountupSegment` or `CountdownSegment`.
     * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used inside a group
     * function, the `omitFirst` can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of `T` type, which is a subclass of TimeSegment.
     */
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T;
    /**
     * Multiply its combined `add()` invocations and returns a `TimeSegment`.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of `add()` invocations returns.
     * @returns         An instance of `T` type, which is a subclass of `TimeSegment`.
     */
    group<T extends TimeSegment>(intervals?: number, ...segments: GroupParameter<T>[]): T;
    /**
     * Starts internal Observable to start emitting.  This must be called after the `subscribe()` or `subscribeWith()` is called.
     * @returns void.
     */
    start(): void;
    /**
     * Pauses internal Observable to start emitting.  This must be called after the `subscribe()` or `subscribeWith()` is called.
     * @returns void.
     */
    pause(): void;
    /**
     * Resets the sequence.  This must be called after the `subscribeWith()` is called since a callback object is needed.
     * That said, this method will unsubscribe and then subscribe again to "reset" the sequence.
     * @returns void.
     */
    reset(): void;
    /**
     * Returns an Observable<TimeEmission> object versus a Subscription object which `subscribe()` returns.  Typically `subscribe()`
     * is just used.
     * @returns Observable<TimeEmission>.
     */
    publish(): Observable<TimeEmission>;
    /**
     * Pass in callback functions to "subscribe" to emissions from sots.
     *
     * @returns Subscription.
     */
    subscribe(observer: PartialObserver<TimeEmission>): Subscription;
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    /**
     * Unsubscribe the subscription that is create from `subscribe()` or `subscribeWith()`.  This also calls the `remove()`
     * method.
     */
    unsubscribe(): void;
    /**
     * Calls the remove method on the subscription object that was create from `subscribe()` or `subscribeWith()`.
     */
    remove(): void;
}
