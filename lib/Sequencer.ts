import { Observable, Subject } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface, SequenceConfigShape } from './api/Segment';
import { TimeSegment } from './Segments';
import { Subscription } from 'rxjs/Subscription';
import { SequencerCallback } from './index';

/**
 * Simply a pass-thru function to be used in the group function.
 * 
 * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
 * @param ctor    A type being subclass of TimeSegment, specifically CountupSegment or CountdownSegment.
 * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
 * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
 * @returns       An instance of T type, which is a subclass of TimeSegment.
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
 * @param constructor   Sequencer must be instantiated with a value for period that is read in milliseconds.  This value becomes static and global to its segments.
 * @returns   an instance.
 */
export class Sequencer implements SegmentInterface {
    collection: SegmentCollection;
    subscription: Subscription;
    private pauseObserv: Subject<boolean>;
    private source: Observable<TimeEmission>;

    constructor(public config: SequenceConfigShape) {
        this.collection = new SegmentCollection(config);
        this.pauseObserv = new Subject<boolean>();
    }
    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        return this.collection.add(ctor, config);
    }

    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    group<T extends TimeSegment>(intervals: number = 1, ...segments: GroupParameter<T>[]): T {
        return this.collection.group(intervals, ...segments);
    }

    /**
     * Starts internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    start(): void {
        if (this.source) {
            this.pauseObserv.next(true);
        } else {
            throw "A call to subscribe() needs to be made prior to start(), pause() or reset().";
        }
    }

    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    pause(): void {
        if (this.source) {
            this.pauseObserv.next(false);
        } else {
            throw "A call to subscribe() needs to be made prior to start(), pause() or reset().";
        }
    }

    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    reset(): void {
        if (this.source) {
            this.unsubscribe();
        } else {
            throw "A call to subscribe() needs to be made prior to start(), pause() or reset().";
        }
    }

    /**
     * Returns an Observable<TimeEmission> versus, subscribe() which returns a Subscription.  Typically subscribe()
     * is used.
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
     * Pass in callback functions to "subscribe" to an Observable emitting.  This is the only means of making an 
     * observation of emission.
     * 
     * @returns Subscription.
     */
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription {
        this.subscription = this.publish().subscribe(next, error, complete);
        return this.subscription;
    }

    subscribeWith(callback: SequencerCallback): Subscription {
        return this.subscribe(callback.next, callback.error, callback.complete);
    }

    unsubscribe(): void {
        this.subscription.unsubscribe();
    }

    remove(): void {
        this.subscription.remove(this.subscription);
    }

    /** @internal */
    __marauder(): { pauser: Subject<boolean>, source: Observable<TimeEmission> } {
        return { pauser: new Subject(), source: this.source };
    }
}