import { TimeSegment, CountdownSegment, CountupSegment } from "./Segments";

export interface TimeConfig {
    period?: number;
    duration?: number;
    states?: Array<string>;
}

export interface TimeEmission {
    state: string;
    time: number;
    interval?: IntervalEmission;
}

export interface IntervalEmission {
    current:number;
    total:number;
}

// static-side interface
export interface SegmentType<T extends TimeSegment> {
    new(config: TimeConfig): T;
}

export interface SegmentInterface {
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T;
    group(intervals: number, ...segments: GroupParameter[]): TimeSegment;
}

export interface GroupParameter {
    // TODO: need to figure this typing out
    //ctor: SegmentType<T extends TimeSegment>;
    ctor: SegmentType<CountdownSegment | CountupSegment>;
    config: TimeConfig;
}