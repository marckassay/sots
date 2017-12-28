import { Observable } from 'rxjs/Rx';
import { TimeEmission, IntervalEmission, StateEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface, SequenceConfigShape } from './api/Segment';
import { StateConfig1, StateConfig2, StateConfig3, StateConfig4, StateConfig5 } from './api/StateConfigs';
import { SegmentCollection } from './Sequencer';

export class TimeSegment implements SegmentInterface {
    config: SegmentConfigShape;
    seqConfig: SequenceConfigShape;
    collection: SegmentCollection;
    interval: IntervalEmission;
    private countingUp: boolean;
    private stateExp: StateExpression;

    constructor(config: SegmentConfigShape, countingUp: boolean = false) {
        this.config = config;
        this.countingUp = countingUp;
    }

    public initializeObservable(lastElementOfSeq: boolean = false): Observable<TimeEmission> {
        this.stateExp = new StateExpression(this.config, this.seqConfig, this.countingUp);
        //let numberOfElements: number = this.config.duration / this.seqConfig.period;
        let source: Observable<TimeEmission> = Observable.interval(this.seqConfig.period)
            .map((_value: number, index: number): TimeEmission => {
                let time: number;
                if (!this.countingUp) {
                    time = (this.config.duration - (this.seqConfig.period * index)) * .001;
                } else {
                    time = (this.seqConfig.period * index) * .001;
                }
                time = parseFloat(time.toFixed(3));

                return { time: time, interval: this.interval, state: this.stateExp.getStateEmission(time) };
            })
            .takeWhile((value: TimeEmission) => {
                if (lastElementOfSeq == false) {
                    if (!this.countingUp) {
                        return value.time > 0;
                    } else {
                        return value.time < (this.config.duration * .001);
                    }
                } else {
                    if (!this.countingUp) {
                        return !(value.time === 0);
                    } else {
                        return !(value.time === (this.config.duration * .001));
                    }
                }
            });

        return source;
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
    // holds instant and spread states that the user defined.
    private instantEmissions: Map<number, StateEmission>;
    // when a state is "spread", this map accumalates such emissions
    // until segment terminates.
    private spreadEmissions: Map<number, StateEmission>;
    // this map simply holds all mod states of the segment.  this will
    // need to be check every time the seq emits.
    private moduloInstantEmissions: Map<number, string | number>;

    constructor(public config: SegmentConfigShape, public seqConfig: SequenceConfigShape, public countingUp: boolean) {
        this.instantEmissions = new Map<number, StateEmission>();
        this.spreadEmissions = new Map<number, StateEmission>();
        this.moduloInstantEmissions = new Map<number, string | number>();

        this.parse(config);
    }

    private parse(config: SegmentConfigShape): void {
        if (config.states) {
            const states: Array<StateConfig1 | StateConfig2 | StateConfig3 | StateConfig4 | StateConfig5> = config.states;
            const statesLength: number = states.length;

            for (let index = 0; index < statesLength; index++) {
                for (let property in states[index]) {
                    let state: string | number = states[index].state;
                    switch (property) {
                        case "timeAt":
                            this.setInstantStates((states[index] as StateConfig1).timeAt, state);
                            break;

                        case "timeLessThan":
                            let time2: number = parseFloat((states[index] as StateConfig2).timeLessThan) - this.seqConfig.period;
                            this.setSpreadState("lessThan", time2, state);
                            break;

                        case "timeLessThanOrEqualTo":
                            let time3: number = parseFloat((states[index] as StateConfig3).timeLessThanOrEqualTo);
                            this.setSpreadState("lessThan", time3, state);
                            break;

                        case "timeGreaterThan":
                            let time4: number = parseFloat((states[index] as StateConfig4).timeGreaterThan) + this.seqConfig.period;
                            this.setSpreadState("greaterThan", time4, state);
                            break;

                        case "timeGreaterThanOrEqualTo":
                            let time5: number = parseFloat((states[index] as StateConfig5).timeGreaterThanOrEqualTo);
                            this.setSpreadState("greaterThan", time5, state);
                            break;
                    }
                }
            }
        }
    }

    private setInstantStates(times: string, state: string | number): void {
        const excludeCommaExpression: RegExp = /[^,]+/g;
        const moduloExpression: RegExp = /(mod\s*|%\s*)\d+/;
        let results: RegExpMatchArray | null = times.match(excludeCommaExpression);

        let insertInstantState = (value: number): void => {
            if (!this.instantEmissions.has(value)) {
                this.instantEmissions.set(value, this.newStateEmission([state]));
            } else {
                this.instantEmissions.get(value)!.instant.push(state);
            }
        };

        if (results) {
            results.map((value: string) => {
                if (value.search(moduloExpression) == -1) {
                    const time: number = parseFloat(value);
                    insertInstantState(time);
                } else {
                    const modTime: number = parseInt(value.match(/\d+/)![0]);

                    if (!this.moduloInstantEmissions.has(modTime)) {
                        this.moduloInstantEmissions.set(modTime, state);
                    } else {
                        const current: string | number = this.moduloInstantEmissions.get(modTime)!;
                        this.moduloInstantEmissions.set(modTime, current + ',' + state);
                    }
                }
            });
        }
    }

    private setSpreadState(_operation: "lessThan" | "greaterThan", time: number, state: string | number): void {
        if (!this.spreadEmissions.has(time)) {
            this.spreadEmissions.set(time, this.newStateEmission([], [state]));
        } else {
            this.spreadEmissions.get(time)!.spread.push(state);
        }
    }

    getStateEmission(time: number): StateEmission | undefined {
        let emissions: StateEmission | undefined;

        emissions = this.instantEmissions.get(time);

        // get keys greater or equal in value of time, then add to emissions
        this.spreadEmissions.forEach((value: StateEmission, key: number, map: Map<number, StateEmission>): void => {
            if ((!this.countingUp) ? key >= time : key <= time) {
                if (!emissions) {
                    emissions = this.newStateEmission([], value.spread);
                } else {
                    emissions.spread.concat(value.spread);
                }
            }
            map!;
        });

        // determine if any moduloInstantEmissions apply to this moment in time
        this.moduloInstantEmissions.forEach((value: string | number, key: number, map: Map<number, string | number>): void => {
            ///const timeFloat: number = (typeof value === 'string') ? parseFloat(value) : value;
            if (time % key === 0) {
                if (!emissions) {
                    emissions = this.newStateEmission([], [value]);
                } else {
                    emissions.instant.push(value);
                }
            }
            map!;
        });

        return emissions;
    }

    newStateEmission(instant: Array<string | number> = [], spread: Array<string | number> = []): StateEmission {
        return {
            instant: instant,
            spread: spread,
            valueOf: (state?: string | number, compareAsBitwise?: boolean): boolean | number => {
                let results: boolean | number;
                if (state !== undefined) {
                    results = (this.getStateValues(instant, spread, state, compareAsBitwise) >= 0);
                } else {
                    results = this.getStateValues(instant, spread, -1, true);
                }

                return results;
            }
        } as StateEmission;
    }

    private getStateValues(instant: Array<string | number>, spread: Array<string | number>, state: string | number, compareAsBitwise?: boolean): number {
        let useBitwiseCompare: boolean;
        if (compareAsBitwise != undefined) {
            useBitwiseCompare = compareAsBitwise;
        }
        else if (this.seqConfig.compareAsBitwise != undefined) {
            useBitwiseCompare = this.seqConfig.compareAsBitwise;
        }
        else {
            useBitwiseCompare = false;
        }

        if (useBitwiseCompare === false) {
            if (instant.indexOf(state) === -1) {
                return spread.indexOf(state);
            } else {
                return 1;
            }
        } else if (typeof state === 'string') {
            throw "valueOf() has been called with a string and flagged to use bitwise comparisons."
        } else {
            let total: number = 0;
            instant.forEach((value: string | number) => {
                if (typeof value === 'number') {
                    total += value;
                }
            }, total);

            spread.forEach((value: string | number) => {
                if (typeof value === 'number') {
                    total += value;
                }
            }, total);

            if (state === -1) {
                return total;
            } else {
                return ((total & state) === state) ? 1 : -1;
            }
        }
    }
}