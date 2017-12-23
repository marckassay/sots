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
    private timemap: Map<number, StateEmission>;
    private toApplySpreading: boolean;

    constructor(config: SegmentConfigShape, public seqConfig: SequenceConfigShape, public countingUp: boolean) {
        this.timemap = new Map<number, StateEmission>();
        this.parse(config);
        if (this.toApplySpreading) {
            this.applySpreading();
        }
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

    private applySpreading(): void {
        // create an array from timemap and sort it...
        const pointerTimemap: Array<Array<number | StateEmission>> = Array
            .from(this.timemap)
            .sort((a: [number, StateEmission], b: [number, StateEmission]) => {
                return b[0] - a[0];
            });

        // find the first element that has a spread with length...
        const firstSpreadIndex: number = pointerTimemap
            .findIndex((value: Array<number | StateEmission>) => {
                return (value[1] as StateEmission).spread.length > 0;
            });

        // calculate the time for the element to be spread...
        const timeFactor: number = parseFloat((1000 / this.seqConfig.period).toFixed(1));
        const timeForElement: number = parseFloat((this.seqConfig.period * .001).toFixed(1));

        let lastAddedElement: Array<number | StateEmission> | undefined;

        // for each spread element in this timesegment calculate the time between it, and the next element or end of segment. 
        for (var i: number = firstSpreadIndex; i < pointerTimemap.length; i++) {
            const pointerElement: Array<number | StateEmission> = (lastAddedElement) ? lastAddedElement : pointerTimemap[i];
            const pointerElementIndex: number = (pointerElement[0] as number);
            const nextPointerElement: Array<number | StateEmission> = pointerTimemap[i + 1];
            let timeInBetweenElements: number;
            if (nextPointerElement) {
                timeInBetweenElements = Math.abs(pointerElementIndex - (nextPointerElement[0] as number));
            } else {
                timeInBetweenElements = pointerElementIndex;
            }

            const numberOfElementsNeeded: number = timeInBetweenElements * timeFactor;
            const spreadThisEmission: StateEmission = this.newStateEmission([], (pointerElement[1] as StateEmission).spread);

            for (let j: number = 1; j <= numberOfElementsNeeded; j++) {
                let newIndex: number = (!this.countingUp) ? pointerElementIndex - (timeForElement * j) : pointerElementIndex + (timeForElement * j);
                newIndex = parseFloat(newIndex.toFixed(1));

                if (j !== numberOfElementsNeeded) {
                    this.timemap.set(newIndex, spreadThisEmission);
                } else {
                    if (this.timemap.has(newIndex)) {
                        const emission: StateEmission = this.timemap.get(newIndex)!;
                        let newInstant = emission.instant;
                        let newSpread = emission.spread.concat(spreadThisEmission.spread);
                        let newEmission = this.newStateEmission(newInstant, newSpread);
                        this.timemap.set(newIndex, newEmission);

                        lastAddedElement = [newIndex, newEmission];
                    } else {
                        return;
                    }
                }
            }
        }
    }

    private setInstantStates(times: string, state: string | number): void {
        const timeExpression: RegExp = /(\d+)/g;

        let results: RegExpMatchArray | null = times.match(timeExpression);
        if (results) {
            results.map((value: string) => {
                const time: number = parseFloat(value);
                if (!this.timemap.has(time)) {
                    this.timemap.set(time, this.newStateEmission([state]));
                } else {
                    this.timemap.get(time)!.instant.push(state);
                }
            });
        }
    }

    private setSpreadState(_operation: "lessThan" | "greaterThan", time: number, state: string | number): void {
        this.toApplySpreading = true;

        if (!this.timemap.has(time)) {
            this.timemap.set(time, this.newStateEmission([], [state]));
        } else {
            this.timemap.get(time)!.spread.push(state);
        }

        // TODO: currently when spreads are appiled, it will exists to the 
        // end of its segment. StateExpression.spread_off may need to be 
        // used for some purposes, if so modification (at minimum) here 
        // will be needed.
        /*
        const polarend: number = (operation == 'lessThan') ? 0 : Number.MAX_VALUE;
        if (!this.timemap[polarend]) {
            // this.timemap[polarend] = state + StateExpression.spread_off;
        } else {
            // this.timemap[polarend] += "," + state + StateExpression.spread_off;
        }
        */
    }

    getStateEmission(time: number): StateEmission | undefined {
        return this.timemap.get(time);
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