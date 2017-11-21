import { Observable, Subject } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { SegmentType, TimeConfig, GroupParameter, SegmentInterface, TimeEmission } from './Interfaces';
import { SegmentCollection } from './Sequencer';

// simply a pass-thru top-level function to call the group function...
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): GroupParameter {
    return {ctor, config};
} 

export class TimeSegment implements SegmentInterface {
    source: Observable<TimeEmission>;

    constructor (public config: TimeConfig) {
        this.initializeObservable();
    }
    
    initializeObservable() {
        const time_expression: RegExp = /[^T==\s*\(*\|*\)*]|(\d+)/g;
        const state_expression: RegExp = /[^S=\s*\'*\"*]\w+/;
        const split_on_comma: RegExp = /\s*,\s*/;
        let statetime:Array<string>;
        let stateseg: string;
        let timeseg:Array<number>;

        if(this.config.states) {
            try {
                statetime = this.config.states[0].split(split_on_comma);
                stateseg = statetime[0].match(state_expression)[0];
            } catch (error) {
                throw "An error occurred when trying to parse this expression: "+this.config.states;
            }

            try {
                timeseg = statetime[1].match(time_expression).map((value: string) => {
                    try {
                        return Number(value);
                    } catch (error) {
                        throw "There is an error in this segment of a state expression: "+statetime[1];
                    }
                });
            } catch (error) {
                throw "An error occurred when trying to find a time segment for this expression: "+this.config.states[0];
            }
        }


        this.source = Observable.timer(0, 1000)
                                .map((value: number,index: number): TimeEmission => { 
            let states: string = '';
            if(this.config.states && timeseg.indexOf(index) != -1) {
                states += stateseg;
            }

            return {time: index, state: states};
        }).takeWhile((value: TimeEmission) => { 
            return value.time < this.config.duration/1000;
        });
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