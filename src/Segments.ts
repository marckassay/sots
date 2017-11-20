import { Observable, Subject } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { SegmentType, TimeConfig, GroupParameter, SegmentInterface } from './Interfaces';
import { SegmentCollection } from './Sequencer';

// simply a pass-thru top-level function to call the group function...
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): GroupParameter {
    return {ctor, config};
} 

export class TimeSegment implements SegmentInterface {
    source: Observable<number>;

    constructor (public config: TimeConfig) {
        this.initializeObservable();
    }
    
    initializeObservable() {
        this.source = Observable.timer(0, 1000);
        this.source = this.source.map((value: number,index: number)=>{ 
            return index 
        }).takeWhile((index: number) => { return index < this.config.duration/1000 } );
    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T {
        const segment:T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    }

    group(intervals: number, ...segments: GroupParameter[]): TimeSegment {
        let segment: TimeSegment;

        for (let index = 0; index < intervals; index++) {
            for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
                const segType: GroupParameter = segments[segmentIndex];
                segment = new segType.ctor(segType.config);
                SegmentCollection.getInstance().push(segment);
            }
        }

        return segment;
    }
}
export class CountdownSegment extends TimeSegment {
    constructor (public config: TimeConfig) {
        super(config);
    }
}
export class CountupSegment extends TimeSegment {
    constructor (public config: TimeConfig) {
        super(config);
    }
}