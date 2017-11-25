import { Observable, Subject } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { SegmentType, SegmentConfig, GroupParameter, SegmentInterface, TimeEmission, IntervalEmission } from './Interfaces';
import { StateConfig1, StateConfig2, StateConfig3, StateConfig4, StateConfig5 } from './Interfaces';
import { SegmentCollection, Sequencer } from './Sequencer';

// simply a pass-thru top-level function to call the group function...
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfig): GroupParameter {
    return { ctor, config };
}

export class TimeSegment implements SegmentInterface {
    config: SegmentConfig;
    source: Observable<TimeEmission>;
    stateexp: StateExpression;
    countingUp: boolean;
    interval: IntervalEmission;

    constructor(config: SegmentConfig, countingUp?: boolean) {
        this.config = config;
        this.countingUp = countingUp;

        this.stateexp = new StateExpression(config);

        this.initializeObservable();
    }

    initializeObservable() {
        this.source = Observable.timer(0, Sequencer.period)
            .map((value: number, index: number): TimeEmission => {
                let nuindex: number;
                if (!this.countingUp) {
                    nuindex = (this.config.duration - (Sequencer.period * index)) * .001;
                } else {
                    nuindex = (Sequencer.period * index) * .001;
                }
                // taking advantage of JS type-checking by reducing precision 1 thou
                // into a string and allowing it to be assigned to nuindex (which is a number)
                nuindex = (nuindex.toFixed(3) as any) * 1;

                let states: string = this.stateexp.evaluate(nuindex);

                return { time: nuindex, state: states, interval: this.interval };
            }).takeWhile((value: TimeEmission) => {
                if (!this.countingUp) {
                    return value.time >= 0;
                } else {
                    return value.time <= (this.config.duration * .001);
                }
            });
    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfig): T {
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
                segment.interval = { current: index + 1, total: intervals };
                SegmentCollection.getInstance().push(segment);
            }
        }

        return segment;
    }
}
export class CountdownSegment extends TimeSegment {
    constructor(public config: SegmentConfig) {
        super(config, false);
    }
}
export class CountupSegment extends TimeSegment {
    constructor(public config: SegmentConfig) {
        super(config, true);
    }
}

class StateExpression {
    stateseg: string;
    timemap: { [key: number]: string; } = {};

    constructor(config: SegmentConfig) {
        this.parse(config);
    }

    parse(config: SegmentConfig): void {
        
        if(config.states) {
            let statetime: Array<StateConfig1 | StateConfig2 | StateConfig3 | StateConfig4 | StateConfig5> = config.states;
            const len: number = statetime.length;
            
            for (let index = 0; index < len; index++) {
                for (let property in statetime[index]) {
                    const state: string = statetime[index].state;
                    switch(property) {
                        case "timeAt":
                        this.pushTimesToMap( (statetime[index] as StateConfig1).timeAt, state );
                        break;
                        case "timeLessThan":

                        break;
                        case "timeLessThanOrEqualTo":

                        break;
                        case "timeGreaterThan":

                        break;
                        case "timeGreaterThanOrEqualTo":

                        break;
                    }
                 }
            }
        }
    }

    pushTimesToMap(times: string, state: string ): void {
        const time_expression: RegExp = /(\d+)/g;
        
        try {
            times.match(time_expression).map((value: string) => {
                this.timemap[Number(value)] = state;
            });
        } catch (error) {
            throw "There is an error in this time expression: " + times;
        }
    }

    evaluate(time: number): string | undefined {
        return this.timemap[time];
    }
}