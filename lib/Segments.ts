import { Observable } from 'rxjs/Rx';
import { TimeEmission, IntervalEmissionShape, SlotEmissionShape, TimeSlot } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
import { StateConfig1, StateConfig2, StateConfig3, StateConfig4, StateConfig5 } from './api/StateConfigs';
import { SegmentCollection } from './Sequencer';

export class TimeSegment implements SegmentInterface {
    period: number;
    interval: IntervalEmissionShape;
    collection: SegmentCollection;
    protected config: SegmentConfigShape;
    private source: Observable<TimeEmission>;
    private stateexp: StateExpression;
    private countingUp: boolean;
    private previousspread: string[];

    constructor(config: SegmentConfigShape, countingUp: boolean = false) {
        this.config = config;
        this.countingUp = countingUp;
        this.stateexp = new StateExpression(config, this.period);

        this.initializeObservable();
    }

    private initializeObservable() {
        this.source = Observable.timer(0, this.period)
            .map((index: number): TimeEmission => {
                let nuindex: number;
                if (!this.countingUp) {
                    nuindex = (this.config.duration - (this.period * index)) * .001;
                } else {
                    nuindex = (this.period * index) * .001;
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

    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        return this.collection.add(ctor, config);
    }

    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T {
        return this.collection.group(intervals, ...segments);
    }

    getObservable(): Observable<TimeEmission> {
        return this.source;
    }
}

/**
 * Counts down in time.  In otherwords, its descending time.
 */
export class CountdownSegment extends TimeSegment {
    constructor(public config: SegmentConfigShape) {
        super(config, false);
    }
}

/**
 * Counts up in time.  In otherwords, its ascending time.
 */
export class CountupSegment extends TimeSegment {
    constructor(public config: SegmentConfigShape) {
        super(config, true);
    }
}

export class StateExpression {
    static spread_on: string = "::ON";
    static spread_off: string = "::OFF";
    static spread_regex: RegExp = /(\w+)(?:\:{2})/g;

    private timemap: TimeSlot<SlotEmissionShape> = {};

    constructor(config: SegmentConfigShape, public period: number) {
        this.parse(config);
    }

    private parse(config: SegmentConfigShape): void {

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
                            let time2: number = Number((statetime[index] as StateConfig2).timeLessThan) - this.period;
                            this.setSpreadState("lessThan", time2, state);
                            break;

                        case "timeLessThanOrEqualTo":
                            let time3: number = Number((statetime[index] as StateConfig3).timeLessThanOrEqualTo);
                            this.setSpreadState("lessThan", time3, state);
                            break;

                        case "timeGreaterThan":
                            let time4: number = Number((statetime[index] as StateConfig4).timeGreaterThan) + this.period;
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

    private setInstantStates(times: string, state: string): void {
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

    private setSpreadState(operation: "lessThan" | "greaterThan", time: number, state: string): void {
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

    /**
     * @param time The time for this segment.  This is not global time of a sequence.
     */
    evaluate(time: number): SlotEmissionShape | undefined {
        return this.timemap[time];
    }
}