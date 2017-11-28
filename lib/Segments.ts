import { Observable } from 'rxjs/Rx';
import { TimeEmission, IntervalEmissionShape, SlotEmissionShape, TimeSlot } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
import { StateConfig1, StateConfig2, StateConfig3, StateConfig4, StateConfig5 } from './api/StateConfigs';
import { SegmentCollection, Sequencer } from './Sequencer';

// simply a pass-thru top-level function to call the group function...
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): GroupParameter<T> {
    return { ctor, config };
}

export class TimeSegment implements SegmentInterface {
    config: SegmentConfigShape;
    source: Observable<TimeEmission>;
    stateexp: StateExpression;
    countingUp: boolean;
    interval: IntervalEmissionShape;
    previousspread: string[];

    constructor(config: SegmentConfigShape, countingUp: boolean = false) {
        this.config = config;
        this.countingUp = countingUp;

        this.stateexp = new StateExpression(config);

        this.initializeObservable();
    }

    initializeObservable() {
        this.source = Observable.timer(0, Sequencer.period)
            .map((index: number): TimeEmission => {
                let nuindex: number;
                if (!this.countingUp) {
                    nuindex = (this.config.duration - (Sequencer.period * index)) * .001;
                } else {
                    nuindex = (Sequencer.period * index) * .001;
                }

                nuindex = Number(nuindex.toFixed(3));

                let states: SlotEmissionShape | undefined = this.stateexp.evaluate(nuindex);
                if (this.previousspread && states && states.spread) {
                    states.spread = states.spread.concat(this.previousspread);
                } else if (this.previousspread && !states) {
                    states = { instant: [], spread: this.previousspread };
                } else if (states && states.spread) {
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

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        const segment: T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    }

    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T {
        let segment: TimeSegment;

        for (let index = 0; index < intervals; index++) 
        {
            segments.forEach( (value:GroupParameter<T>) => {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = new value.ctor(value.config) as TimeSegment;
                    segment.interval = { current: index + 1, total: intervals };
                    SegmentCollection.getInstance().push(segment);
                }
            });
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return SegmentCollection.getInstance().getLastSegment() as T;
    }
}
export class CountdownSegment extends TimeSegment {
    constructor(public config: SegmentConfigShape) {
        super(config, false);
    }
}
export class CountupSegment extends TimeSegment {
    constructor(public config: SegmentConfigShape) {
        super(config, true);
    }
}

export class StateExpression {
    static spread_on: string = "::ON";
    static spread_off: string = "::OFF";
    static spread_regex: RegExp = /(\w+)(?:\:{2})/g;

    timemap: TimeSlot<SlotEmissionShape> = {};

    constructor(config: SegmentConfigShape) {
        this.parse(config);
    }

    parse(config: SegmentConfigShape): void {

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

        let results: RegExpMatchArray | null = times.match(time_expression);
        if (results) {
            results.map((value: string) => {
                let timeslot: SlotEmissionShape = this.timemap[Number(value)];
                if (!timeslot) {
                    this.timemap[Number(value)] = { instant: [state], spread: [] };
                } else if (timeslot.instant) {
                    timeslot.instant.push(state);
                    this.timemap[Number(value)] = timeslot;
                }
            });
        }
    }

    setSpreadState(operation: "lessThan" | "greaterThan", time: number, state: string): void {
        const timeslot: SlotEmissionShape = this.timemap[time];
        if (!timeslot) {
            this.timemap[time] = { instant: [], spread: [state] };
        } else if (timeslot.spread) {
            timeslot.spread.push(state);
            this.timemap[time] = timeslot;
        }

        // TODO: StateExpression.spread_off isnt being searched for at any moment.
        const polarend: number = (operation == 'lessThan') ? 0 : Number.MAX_VALUE;
        if (!this.timemap[polarend]) {
            // this.timemap[polarend] = state + StateExpression.spread_off;
        } else {
            // this.timemap[polarend] += "," + state + StateExpression.spread_off;
        }
    }

    evaluate(time: number): SlotEmissionShape | undefined {
        return this.timemap[time];
    }
}