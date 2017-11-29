import { Observable } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
import { TimeSegment } from './Segments';
import { Subscription } from 'rxjs/Subscription';
export declare class SegmentCollection {
    private static instance;
    private segments;
    private observables;
    private lastTimeSegment;
    private constructor();
    static getInstance(): SegmentCollection;
    /**
     * internal method
     */
    toSequencedObservable(): Observable<TimeEmission>;
    /**
     * internal method
     */
    push(segment: TimeSegment): void;
    /**
     * internal method
     */
    getLastSegment(): TimeSegment;
}
/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor   Sequencer must be instantiated with a value for period that is read in milliseconds.  This value becomes static and global to its segments.
 * @returns   an instance.
 */
export declare class Sequencer implements SegmentInterface {
    static period: number;
    private pauser;
    private publication;
    private source;
    constructor(config: {
        period: number;
    });
    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T;
    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T;
    /**
     * Starts internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    start(): void;
    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    pause(): void;
    /**
     * Returns an Observable<TimeEmission> versus, subscribe() which returns a Subscription.  Typically subscribe()
     * is used.
     * @returns Observable<TimeEmission>.
     */
    publish(): Observable<TimeEmission>;
    /**
     * Pass in callback functions to "subscribe" to an Observable emitting.  This is the only means of making an
     * observation of emission.
     *
     * @returns Subscription.
     */
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription;
}
