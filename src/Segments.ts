import { Observable, Subject } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { SegmentType, TimeConfig, GroupParameter, SegmentInterface, TimeEmission, IntervalEmission } from './Interfaces';
import { SegmentCollection, Sequencer } from './Sequencer';

// simply a pass-thru top-level function to call the group function...
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): GroupParameter {
    return { ctor, config };
}

export class TimeSegment implements SegmentInterface {
    config: TimeConfig;
    source: Observable<TimeEmission>;
    stateexp: StateExpression;
    countingUp: boolean;
    interval: IntervalEmission;

    constructor(config: TimeConfig, countingUp?:boolean) {
        this.config = config;
        this.countingUp = countingUp;

        this.stateexp = new StateExpression(config);

        this.initializeObservable();
    }

    initializeObservable() {
        this.source = Observable.timer(0, Sequencer.period)
            .map((value: number, index: number): TimeEmission => {
                let nuindex: number;
                if(!this.countingUp) {
                    nuindex = (this.config.duration - (Sequencer.period * index)) * .001;
                } else {
                    nuindex = (Sequencer.period * index) * .001;
                }
                // taking advantage of JS type-checking by reducing precision 1 thou
                // into a string and allowing it to be assigned to nuindex (which is a number)
                nuindex = nuindex.toFixed(3) as any;
                
                let states: string = this.stateexp.evaluate(nuindex);
                
                return { time: nuindex, state: states, interval: this.interval };
            }).takeWhile((value: TimeEmission) => {
                if(!this.countingUp) {
                    return value.time >= 0;
                } else {
                    return value.time <= (this.config.duration * .001);
                }
            });
    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T {
        const segment: T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    }

    group(intervals: number, ...segments: GroupParameter[]): TimeSegment {
        let segment: TimeSegment;

        for (let index = 0; index < intervals; index++) {
            for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
                const segType: GroupParameter = segments[segmentIndex];
                segment = new segType.ctor(segType.config);
                segment.interval = {current: index+1, total: intervals};
                SegmentCollection.getInstance().push(segment);
            }
        }

        return segment;
    }
}
export class CountdownSegment extends TimeSegment {
    constructor(public config: TimeConfig) {
        super(config, false);
    }
}
export class CountupSegment extends TimeSegment {
    constructor(public config: TimeConfig) {
        super(config, true);
    }
}

class StateExpression {
    stateseg: string;
    timeseg: Array<number>;

    constructor(config: TimeConfig) {
        this.parse(config);
    }

    parse(config: TimeConfig): void {
        const time_expression: RegExp = /[^T==\s*\(*\|*\)*]|(\d+)/g;
        const state_expression: RegExp = /[^S=\s*\'*\"*]\w+/;
        const split_on_comma: RegExp = /\s*,\s*/;

        let statetime: Array<string>;

        if (config.states) {
            try {
                statetime = config.states[0].split(split_on_comma);
                this.stateseg = statetime[0].match(state_expression)[0];
            } catch (error) {
                throw "An error occurred when trying to parse this expression: " + config.states;
            }

            try {
                this.timeseg = statetime[1].match(time_expression).map((value: string) => {
                    try {
                        return Number(value);
                    } catch (error) {
                        throw "There is an error in this segment of a state expression: " + statetime[1];
                    }
                });
            } catch (error) {
                throw "An error occurred when trying to find a time segment for this expression: " + config.states[0];
            }
        }
    }

    evaluate(time: number): string {
        if (this.timeseg && this.timeseg.indexOf(time) != -1) {
            return this.stateseg;
        } else {
            return undefined;
        }
    }
}