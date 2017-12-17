import { Observable } from 'rxjs/Rx';
import { TimeEmission, IntervalEmissionShape, SlotEmissionShape } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface, SequenceConfigShape } from './api/Segment';
import { StateConfig1, StateConfig2, StateConfig3, StateConfig4, StateConfig5 } from './api/StateConfigs';
import { SegmentCollection } from './Sequencer';

export class TimeSegment implements SegmentInterface {
    seqConfig: SequenceConfigShape;
    interval: IntervalEmissionShape;
    collection: SegmentCollection;
    config: SegmentConfigShape;
    stateExp: StateExpression;
    countingUp: boolean;

    constructor(config: SegmentConfigShape, countingUp: boolean = false) {
        this.config = config;
        this.countingUp = countingUp;
    }

    public initializeObservable(lastElement: boolean = false): Observable<TimeEmission> {
        this.stateExp = new StateExpression(this.config, this.seqConfig, this.countingUp);
        let totalElements: number = this.config.duration / this.seqConfig.period;
        let source: Observable<TimeEmission> = Observable.range(0, totalElements)
            .map((_value: number, index: number): TimeEmission => {
                let nuindex: number;
                if (!this.countingUp) {
                    nuindex = (this.config.duration - (this.seqConfig.period * index)) * .001;
                } else {
                    nuindex = (this.seqConfig.period * index) * .001;
                }

                nuindex = parseFloat(nuindex.toFixed(3));

                let slot: SlotEmissionShape | undefined = this.stateExp.checkForSlot(nuindex);

                return { time: nuindex, interval: this.interval, state: slot };
            })
            .takeWhile((value: TimeEmission) => {
                if (lastElement == false) {
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
    static applySpread: string = "::ON";
    static removeSpread: string = "::OFF";
    static spread_regex: RegExp = /(\w+)(?:\:{2})/g;

    private timemap: Map<number, SlotEmissionShape>;

    constructor(config: SegmentConfigShape, public seqConfig: SequenceConfigShape, public countingUp: boolean) {
        this.timemap = new Map<number, SlotEmissionShape>();
        this.parse(config);
        this.applySpreading();
    }

    private parse(config: SegmentConfigShape): void {

        if (config.states) {
            let statetime: Array<StateConfig1 | StateConfig2 | StateConfig3 | StateConfig4 | StateConfig5> = config.states;
            const len: number = statetime.length;

            for (let index = 0; index < len; index++) {
                for (let property in statetime[index]) {
                    let state: string | number = statetime[index].state;
                    switch (property) {
                        case "timeAt":
                            this.setInstantStates((statetime[index] as StateConfig1).timeAt, state);
                            break;

                        case "timeLessThan":
                            let time2: number = parseFloat((statetime[index] as StateConfig2).timeLessThan) - this.seqConfig.period;
                            this.setSpreadState("lessThan", time2, state);
                            break;

                        case "timeLessThanOrEqualTo":
                            let time3: number = parseFloat((statetime[index] as StateConfig3).timeLessThanOrEqualTo);
                            this.setSpreadState("lessThan", time3, state);
                            break;

                        case "timeGreaterThan":
                            let time4: number = parseFloat((statetime[index] as StateConfig4).timeGreaterThan) + this.seqConfig.period;
                            this.setSpreadState("greaterThan", time4, state);
                            break;

                        case "timeGreaterThanOrEqualTo":
                            let time5: number = parseFloat((statetime[index] as StateConfig5).timeGreaterThanOrEqualTo);
                            this.setSpreadState("greaterThan", time5, state);
                            break;
                    }
                }
            }
        }
    }

    private applySpreading(): void {
        const pointerTimeMap: Array<Array<number | SlotEmissionShape>> = Array.from(this.timemap).sort((a: [number, SlotEmissionShape], b: [number, SlotEmissionShape]) => {
            if (!this.countingUp) {
                return b[0] - a[0];
            } else {
                return a[0] - b[0];
            }
        });

        const firstSpreadIndex: number = pointerTimeMap.findIndex((value: Array<number | SlotEmissionShape>) => {
            return (value[1] as SlotEmissionShape).spread.length > 0;
        });

        const factor: number = parseFloat((1000 / this.seqConfig.period).toFixed(1));
        const timeforEachElement: number = parseFloat((this.seqConfig.period * .001).toFixed(1));

        //if (!this.countingUp) {
        for (var i: number = firstSpreadIndex; i < pointerTimeMap.length; i++) {
            const pointerElement: Array<number | SlotEmissionShape> = pointerTimeMap[i];
            const pointerElementIndex: number = (pointerElement[0] as number);
            const nextPointerElement: Array<number | SlotEmissionShape> = pointerTimeMap[i + 1];
            let timeInBetween: number;
            if (nextPointerElement) {
                timeInBetween = pointerElementIndex - (nextPointerElement[0] as number);
            } else {
                timeInBetween = pointerElementIndex;
            }

            const numberOfElementsNeeded: number = timeInBetween * factor;
            const spreadFill: (string | number)[] = (pointerElement[1] as SlotEmissionShape).spread;
            const spreadFillSlot: SlotEmissionShape = this.newSlot([], spreadFill);

            for (let j: number = 1; j <= numberOfElementsNeeded; j++) {
                const nuIndex: number = parseFloat((pointerElementIndex - (timeforEachElement * j)).toFixed(1));

                if (j !== numberOfElementsNeeded) {
                    this.timemap.set(nuIndex, spreadFillSlot);
                } else {
                    if (this.timemap.has(nuIndex)) {
                        const el: SlotEmissionShape = this.timemap.get(nuIndex)!;
                        el.spread = el.spread.concat(spreadFillSlot.spread);
                        this.timemap.set(nuIndex, el);
                    } else {
                        return;
                    }
                }
            }
        }
        //}
    }

    private setInstantStates(times: string, state: string | number): void {
        const time_expression: RegExp = /(\d+)/g;

        let results: RegExpMatchArray | null = times.match(time_expression);
        if (results) {
            results.map((value: string) => {
                const time: number = parseFloat(value);
                if (!this.timemap.has(time)) {
                    this.timemap.set(time, this.newSlot([state]));
                } else {
                    this.timemap.get(time)!.instant.push(state);
                }
            });
        }
    }

    private setSpreadState(_operation: "lessThan" | "greaterThan", time: number, state: string | number): void {
        if (!this.timemap.has(time)) {
            this.timemap.set(time, this.newSlot([], [state]));
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

    checkForSlot(time: number): SlotEmissionShape | undefined {
        return this.timemap.get(time);
    }

    newSlot(instant: Array<string | number> = [], spread: Array<string | number> = []): SlotEmissionShape {
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
        } as SlotEmissionShape;
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