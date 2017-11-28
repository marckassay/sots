import { Observable } from 'rxjs/Rx';
import { TimeEmission, IntervalEmissionShape, SlotEmissionShape, TimeSlot } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
export declare function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): GroupParameter<T>;
export declare class TimeSegment implements SegmentInterface {
    config: SegmentConfigShape;
    source: Observable<TimeEmission>;
    stateexp: StateExpression;
    countingUp: boolean;
    interval: IntervalEmissionShape;
    previousspread: string[];
    constructor(config: SegmentConfigShape, countingUp?: boolean);
    initializeObservable(): void;
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T;
    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T;
}
export declare class CountdownSegment extends TimeSegment {
    config: SegmentConfigShape;
    constructor(config: SegmentConfigShape);
}
export declare class CountupSegment extends TimeSegment {
    config: SegmentConfigShape;
    constructor(config: SegmentConfigShape);
}
export declare class StateExpression {
    static spread_on: string;
    static spread_off: string;
    static spread_regex: RegExp;
    timemap: TimeSlot<SlotEmissionShape>;
    constructor(config: SegmentConfigShape);
    parse(config: SegmentConfigShape): void;
    setInstantStates(times: string, state: string): void;
    setSpreadState(operation: "lessThan" | "greaterThan", time: number, state: string): void;
    evaluate(time: number): SlotEmissionShape | undefined;
}
