import { TimeSegment, add } from "./Segments";
import { SegmentType, TimeConfig, GroupParameter, SegmentInterface, TimeEmission } from "./Interfaces";
import { Sequencer } from "./Sequencer";
import { Subscription } from "rxjs";
import { Observable } from "rxjs/Observable";
export { CountupSegment, CountdownSegment } from "./Segments";
export { Sequencer };
export { add };

export declare namespace Sots {
    class Sequencer implements SegmentInterface {
        constructor(config: TimeConfig);
        add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T;
        group(intervals: number, ...segments: GroupParameter[]): TimeSegment;
        start(): void;
        publish(): Observable<TimeEmission>;
    }

    function add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): GroupParameter;
}