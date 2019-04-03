import { never, timer } from 'rxjs';
import { map, startWith, switchMap, takeWhile } from 'rxjs/operators';
import { StateEmission } from './StateEmission';
export class TimeSegment {
    constructor(config, countingUp = false) {
        this.config = config;
        this.countingUp = countingUp;
    }
    initializeObservable(firstElementOfSeq = false, lastElementOfSeq = false) {
        this.stateExp = new StateExpression(this.config, this.seqConfig, this.countingUp);
        let source = this.pauseObserv.pipe(startWith(!firstElementOfSeq), switchMap((value) => (value) ? timer(0, this.seqConfig.period) : never()), map((_value, index) => {
            let time;
            if (!this.countingUp) {
                time = (this.config.duration - (this.seqConfig.period * index)) * .001;
            }
            else {
                time = (this.seqConfig.period * index) * .001;
            }
            time = parseFloat(time.toFixed(3));
            return { time: time, interval: this.interval, state: this.stateExp.getStateEmission(time) };
        }), takeWhile((value) => {
            if (lastElementOfSeq == false) {
                if (!this.countingUp) {
                    return value.time > 0;
                }
                else {
                    return value.time < (this.config.duration * .001);
                }
            }
            else {
                if (!this.countingUp) {
                    return !(value.time === 0);
                }
                else {
                    return !(value.time === (this.config.duration * .001));
                }
            }
        }));
        return source;
    }
    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or
     * CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used
     * inside a group function, the omitFirst can be used to omit this segment when its assigned to
     * the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    add(ctor, config) {
        return this.collection.add(ctor, config);
    }
    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater
     * in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    group(intervals, ...segments) {
        return this.collection.group(intervals, ...segments);
    }
}
/**
 * Counts down in time.  In otherwords, its descending time.
 */
export class CountdownSegment extends TimeSegment {
    constructor(config) {
        super(config, false);
        this.config = config;
    }
}
/**
 * Counts up in time.  In otherwords, its ascending time.
 */
export class CountupSegment extends TimeSegment {
    constructor(config) {
        super(config, true);
        this.config = config;
    }
}
export class StateExpression {
    constructor(config, seqConfig, countingUp) {
        this.config = config;
        this.seqConfig = seqConfig;
        this.countingUp = countingUp;
        this.instantEmissions = new Map();
        this.spreadEmissions = new Map();
        this.moduloInstantEmissions = new Map();
        this.parse(config);
    }
    parse(config) {
        if (config.states) {
            const states = config.states;
            const statesLength = states.length;
            for (let index = 0; index < statesLength; index++) {
                for (let property in states[index]) {
                    let state = states[index].state;
                    switch (property) {
                        case "timeAt":
                            this.setInstantStates(states[index].timeAt, state);
                            break;
                        case "timeLessThan":
                            let time2 = parseFloat(states[index].timeLessThan) - (this.seqConfig.period * .001);
                            this.setSpreadState(time2, state);
                            break;
                        case "timeLessThanOrEqualTo":
                            let time3 = parseFloat(states[index].timeLessThanOrEqualTo);
                            this.setSpreadState(time3, state);
                            break;
                        case "timeGreaterThan":
                            let time4 = parseFloat(states[index].timeGreaterThan) + (this.seqConfig.period * .001);
                            this.setSpreadState(time4, state);
                            break;
                        case "timeGreaterThanOrEqualTo":
                            let time5 = parseFloat(states[index].timeGreaterThanOrEqualTo);
                            this.setSpreadState(time5, state);
                            break;
                    }
                }
            }
        }
    }
    setInstantStates(times, state) {
        const excludeCommaExpression = /[^,]+/g;
        const moduloExpression = /(mod\s*|%\s*)\d+/;
        let results = times.match(excludeCommaExpression);
        let insertInstantState = (value) => {
            if (!this.instantEmissions.has(value)) {
                this.instantEmissions.set(value, new StateEmission(this.seqConfig.compareAsBitwise, new Set([state])));
            }
            else {
                this.instantEmissions.get(value).instant.add(state);
            }
        };
        if (results) {
            results.map((value) => {
                if (value.search(moduloExpression) == -1) {
                    const time = parseFloat(value);
                    insertInstantState(time);
                }
                else {
                    const modTime = parseInt(value.match(/\d+/)[0]);
                    if (!this.moduloInstantEmissions.has(modTime)) {
                        this.moduloInstantEmissions.set(modTime, state);
                    }
                    else {
                        const currentValue = this.moduloInstantEmissions.get(modTime);
                        this.moduloInstantEmissions.set(modTime, currentValue + ',' + state);
                    }
                }
            });
        }
    }
    setSpreadState(time, state) {
        if (!this.spreadEmissions.has(time)) {
            this.spreadEmissions.set(time, new StateEmission(this.seqConfig.compareAsBitwise, undefined, new Set([state])));
        }
        else {
            this.spreadEmissions.get(time).spread.add(state);
        }
    }
    getStateEmission(time) {
        let emissions;
        emissions = this.instantEmissions.get(time);
        // determine if any moduloInstantEmissions apply to this moment in time
        this.moduloInstantEmissions.forEach((value, key) => {
            ///const timeFloat: number = (typeof value === 'string') ? parseFloat(value) : value;
            if (time % key === 0) {
                if (!emissions) {
                    emissions = new StateEmission(this.seqConfig.compareAsBitwise, new Set([value]));
                }
                else {
                    emissions.instant.add(value);
                }
            }
        });
        // get keys greater-equal or lesser-equal in value of time, then add to emissions
        this.spreadEmissions.forEach((value, key) => {
            if ((!this.countingUp) ? key >= time : key <= time) {
                if (!emissions) {
                    emissions = new StateEmission(this.seqConfig.compareAsBitwise, undefined, value.spread);
                }
                else {
                    emissions.mapToSpread(value.spread);
                }
            }
        });
        return emissions;
    }
}
//# sourceMappingURL=Segments.js.map