import { Observable, Subject } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { SegmentType, SegmentConfig, GroupParameter, SegmentInterface, TimeEmission, IntervalEmission, TimeSlot, Slot } from './Interfaces';
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
    previousspread: string[];

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

                nuindex = Number(nuindex.toFixed(3));

                let states: Slot = this.stateexp.evaluate(nuindex);
                if (this.previousspread && states) {
                    states.spread = states.spread.concat(this.previousspread);
                } else if(this.previousspread && !states) {
                    states = {instant: [], spread: this.previousspread};
                } else if (states) {
                    this.previousspread = states.spread;
                }

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
                if((index != 0) || (!segType.config.negate1st)) {
                    segment = new segType.ctor(segType.config);
                    segment.interval = { current: index + 1, total: intervals };
                    SegmentCollection.getInstance().push(segment);
                }
            }
        }
        // return the last instance, so that this group invocation can be chained if needed...
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
    static spread_on: string = "::ON";
    static spread_off: string = "::OFF";
    static spread_regex: RegExp = /(\w+)(?:\:{2})/g;

    timemap: TimeSlot<Slot> = {};

    constructor(config: SegmentConfig) {
        this.parse(config);
    }

    parse(config: SegmentConfig): void {

        if (config.states) {
            let statetime: Array<StateConfig1 | StateConfig2 | StateConfig3 | StateConfig4 | StateConfig5> = config.states;
            const len: number = statetime.length;

            for (let index = 0; index < len; index++) {
                for (let property in statetime[index]) {
                    let state: string = statetime[index].state;
                    switch (property) {
                        case "timeAt":
                            this.setInstantStates((statetime[index] as StateConfig1).timeAt, state);
                            break;

                        case "timeLessThan":
                            let time2: number = Number((statetime[index] as StateConfig2).timeLessThan) - Sequencer.period;
                            this.setSpreadState("lessThan", time2, state);
                            break;

                        case "timeLessThanOrEqualTo":
                        let time3: number = Number((statetime[index] as StateConfig3).timeLessThanOrEqualTo);
                            this.setSpreadState("lessThan", time3, state);
                            break;

                        case "timeGreaterThan":
                        let time4: number = Number((statetime[index] as StateConfig4).timeGreaterThan) + Sequencer.period;
                            this.setSpreadState("greaterThan", time4, state);
                            break;

                        case "timeGreaterThanOrEqualTo":
                        let time5: number = Number((statetime[index] as StateConfig5).timeGreaterThanOrEqualTo);
                            this.setSpreadState("greaterThan", time5, state);
                            break;
                    }
                }
            }
        }
    }

    setInstantStates(times: string, state: string): void {
        const time_expression: RegExp = /(\d+)/g;
        try {
            times.match(time_expression).map((value: string) => {
                let timeslot: Slot = this.timemap[Number(value)];
                if (!timeslot) {
                    this.timemap[Number(value)] = {instant: [state], spread: []};
                } else {
                    timeslot.instant.push(state);
                    this.timemap[Number(value)] = timeslot;
                }
            });
        } catch (error) {
            throw "There is an error in this timeAt expression: " + times;
        }
    }

    setSpreadState(operation: 'lessThan' | 'greaterThan', time: number, state: string): void {
        let timeslot: Slot = this.timemap[time];
        if (!timeslot) {
            this.timemap[time] = {instant: [], spread: [state]};
        } else {
            timeslot.spread.push(state);
            this.timemap[time] = timeslot;
        }

        // TODO: StateExpression.spread_off isnt being searched for at any moment.
        /*
        const polarend: number = (operation == 'lessThan') ? 0 : Number.MAX_VALUE;
        if (!this.timemap[polarend]) {
            this.timemap[polarend] = state + StateExpression.spread_off;
        } else {
            this.timemap[polarend] += "," + state + StateExpression.spread_off;
        }
        */
    }

    evaluate(time: number): Slot | undefined {
        return this.timemap[time];
    }
}