import { TimeSegment, CountdownSegment, CountupSegment } from "./Segments";

export interface TimeSlot<T> {
    [key: number]: T;
}
export interface Slot {
    instant?: string[],
    spread?: string[]
}

type StateConfig<T> = {
    [P in keyof T]: T[P];
}
interface TimeState {
    state: string
}
interface TimeAt extends TimeState {
    timeAt: string;
}
interface TimeLessThan extends TimeState {
    timeLessThan: string;
}
interface TimeLessThanOrEqualTo extends TimeState {
    timeLessThanOrEqualTo: string;
}
interface TimeGreaterThan extends TimeState {
    timeGreaterThan: string;
}
interface TimeGreaterThanOrEqualTo extends TimeState {
    timeGreaterThanOrEqualTo: string;
}

export type StateConfig1 = StateConfig<TimeAt>;
export type StateConfig2 = StateConfig<TimeLessThan>;
export type StateConfig3 = StateConfig<TimeLessThanOrEqualTo>;
export type StateConfig4 = StateConfig<TimeGreaterThan>;
export type StateConfig5 = StateConfig<TimeGreaterThanOrEqualTo>;

export interface SegmentConfig {
    period?: number;
    duration?: number;
    states?: Array<StateConfig1 | StateConfig2 | StateConfig3 | StateConfig4 | StateConfig5>;
}

export interface TimeEmission {
    state: Slot;
    time: number;
    interval?: IntervalEmission;
}

export interface IntervalEmission {
    current: number;
    total: number;
}

// static-side interface
export interface SegmentType<T extends TimeSegment> {
    new(config: SegmentConfig): T;
}

export interface SegmentInterface {
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfig): T;
    group(intervals: number, ...segments: GroupParameter[]): TimeSegment;
}

export interface GroupParameter {
    // TODO: need to figure this typing out
    //ctor: SegmentType<T extends TimeSegment>;
    ctor: SegmentType<CountdownSegment | CountupSegment>;
    config: SegmentConfig;
}