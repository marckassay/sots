import { Observable } from 'rxjs/Rx';
import { TimeEmission, IntervalEmissionShape, SlotEmissionShape } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
/**
 * Simply a pass-thru function to be used in the group function.
 *
 * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
 * @param ctor    A type being subclass of TimeSegment, specifically CountupSegment or CountdownSegment.
 * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
 * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
 * @returns       An instance of T type, which is a subclass of TimeSegment.
 */
export declare function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): GroupParameter<T>;
export declare class TimeSegment implements SegmentInterface {
    protected config: SegmentConfigShape;
    interval: IntervalEmissionShape;
    private source;
    private stateexp;
    private countingUp;
    private previousspread;
    constructor(config: SegmentConfigShape, countingUp?: boolean);
    private initializeObservable();
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
     * internal method
     */
    getObservable(): Observable<TimeEmission>;
}
/**
 * Counts down in time.  In otherwords, its descending time.
 */
export declare class CountdownSegment extends TimeSegment {
    config: SegmentConfigShape;
    constructor(config: SegmentConfigShape);
}
/**
 * Counts up in time.  In otherwords, its ascending time.
 */
export declare class CountupSegment extends TimeSegment {
    config: SegmentConfigShape;
    constructor(config: SegmentConfigShape);
}
export declare class StateExpression {
    static spread_on: string;
    static spread_off: string;
    static spread_regex: RegExp;
    private timemap;
    constructor(config: SegmentConfigShape);
    private parse(config);
    private setInstantStates(times, state);
    private setSpreadState(operation, time, state);
    /**
     * internal method
     * @param time The time for this segment.  This is not global time of a sequence.
     */
    evaluate(time: number): SlotEmissionShape | undefined;
}
