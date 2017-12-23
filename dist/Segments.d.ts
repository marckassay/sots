import { Observable } from 'rxjs/Rx';
import { TimeEmission, IntervalEmission, StateEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface, SequenceConfigShape } from './api/Segment';
import { SegmentCollection } from './Sequencer';
export declare class TimeSegment implements SegmentInterface {
    config: SegmentConfigShape;
    seqConfig: SequenceConfigShape;
    collection: SegmentCollection;
    interval: IntervalEmission;
    private countingUp;
    private stateExp;
    constructor(config: SegmentConfigShape, countingUp?: boolean);
    initializeObservable(lastElementOfSeq?: boolean): Observable<TimeEmission>;
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
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T;
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
    seqConfig: SequenceConfigShape;
    countingUp: boolean;
    private timemap;
    private toApplySpreading;
    constructor(config: SegmentConfigShape, seqConfig: SequenceConfigShape, countingUp: boolean);
    private parse(config);
    private applySpreading();
    private setInstantStates(times, state);
    private setSpreadState(_operation, time, state);
    getStateEmission(time: number): StateEmission | undefined;
    newStateEmission(instant?: Array<string | number>, spread?: Array<string | number>): StateEmission;
    private getStateValues(instant, spread, state, compareAsBitwise?);
}
