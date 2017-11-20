import { TimeSegment, add } from "./Segments";
import { SegmentType, TimeConfig, GroupParameter, SegmentInterface } from "./Interfaces";
import { Sequencer } from "./Sequencer";
export { CountupSegment, CountdownSegment} from "./Segments";
export {Sequencer};
export { add };

export declare namespace Sots {
    class Sequencer implements SegmentInterface {
        constructor (config: TimeConfig);
        add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T;
        group(intervals: number, ...segments: GroupParameter[]): TimeSegment;
        start(): void;
    }

    function add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): GroupParameter; 
}