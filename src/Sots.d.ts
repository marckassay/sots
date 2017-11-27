import { TimeSegment, add } from "./Segments";
import { Observable } from "rxjs/Observable";
import { TimeEmission, SlotEmissionShape, IntervalEmissionShape } from "./api/Emission.api";
import { SegmentType, GroupParameter, SegmentConfigShape } from "./api/Segment.api";

declare module Sots {
    class Sequencer {
        constructor(config: { period: number }) ;
        add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T ;
        group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T;
        start(): void;
        pause(): void;
        publish(): Observable<TimeEmission>;
    }
    
    interface TimeEmission {
        state: SlotEmissionShape;
        time: number;
        interval?: IntervalEmissionShape;
    }

    function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): GroupParameter<T>;

    class CountdownSegment extends TimeSegment {
        constructor(config: SegmentConfigShape);
    }
    class CountupSegment extends TimeSegment {
        constructor(config: SegmentConfigShape);
    }

    
}

declare module "sots" {
	export = Sots;
}