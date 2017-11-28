import * as state from "./StateConfigs";
import { TimeSegment } from "../Segments";

export interface SegmentConfigShape {
    duration: number;
    omitFirst?: boolean;
    states?: Array<state.StateConfig1 | state.StateConfig2 | state.StateConfig3 | state.StateConfig4 | state.StateConfig5>;
}

export interface SegmentInterface {
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T;
    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T;
}

// static-side interface
export interface SegmentType<T extends TimeSegment> {
    new(config: SegmentConfigShape): T;
}

export interface GroupParameter<T extends TimeSegment> {
    ctor: SegmentType<T>;
    config: SegmentConfigShape;
}