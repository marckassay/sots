"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Rx_1 = require("rxjs/Rx");
var StateEmission_1 = require("./StateEmission");
var TimeSegment = /** @class */ (function () {
    function TimeSegment(config, countingUp) {
        if (countingUp === void 0) { countingUp = false; }
        this.config = config;
        this.countingUp = countingUp;
    }
    TimeSegment.prototype.initializeObservable = function (lastElementOfSeq) {
        var _this = this;
        if (lastElementOfSeq === void 0) { lastElementOfSeq = false; }
        this.stateExp = new StateExpression(this.config, this.seqConfig, this.countingUp);
        var source = Rx_1.Observable.timer(0, this.seqConfig.period)
            .map(function (_value, index) {
            var time;
            if (!_this.countingUp) {
                time = (_this.config.duration - (_this.seqConfig.period * index)) * .001;
            }
            else {
                time = (_this.seqConfig.period * index) * .001;
            }
            time = parseFloat(time.toFixed(3));
            return { time: time, interval: _this.interval, state: _this.stateExp.getStateEmission(time) };
        })
            .takeWhile(function (value) {
            if (lastElementOfSeq == false) {
                if (!_this.countingUp) {
                    return value.time > 0;
                }
                else {
                    return value.time < (_this.config.duration * .001);
                }
            }
            else {
                if (!_this.countingUp) {
                    return !(value.time === 0);
                }
                else {
                    return !(value.time === (_this.config.duration * .001));
                }
            }
        });
        return source;
    };
    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    TimeSegment.prototype.add = function (ctor, config) {
        return this.collection.add(ctor, config);
    };
    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    TimeSegment.prototype.group = function (intervals) {
        var segments = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            segments[_i - 1] = arguments[_i];
        }
        return (_a = this.collection).group.apply(_a, [intervals].concat(segments));
        var _a;
    };
    return TimeSegment;
}());
exports.TimeSegment = TimeSegment;
/**
 * Counts down in time.  In otherwords, its descending time.
 */
var CountdownSegment = /** @class */ (function (_super) {
    __extends(CountdownSegment, _super);
    function CountdownSegment(config) {
        var _this = _super.call(this, config, false) || this;
        _this.config = config;
        return _this;
    }
    return CountdownSegment;
}(TimeSegment));
exports.CountdownSegment = CountdownSegment;
/**
 * Counts up in time.  In otherwords, its ascending time.
 */
var CountupSegment = /** @class */ (function (_super) {
    __extends(CountupSegment, _super);
    function CountupSegment(config) {
        var _this = _super.call(this, config, true) || this;
        _this.config = config;
        return _this;
    }
    return CountupSegment;
}(TimeSegment));
exports.CountupSegment = CountupSegment;
var StateExpression = /** @class */ (function () {
    function StateExpression(config, seqConfig, countingUp) {
        this.config = config;
        this.seqConfig = seqConfig;
        this.countingUp = countingUp;
        StateEmission_1.StateEmission.seqConfig = seqConfig;
        this.instantEmissions = new Map();
        this.spreadEmissions = new Map();
        this.moduloInstantEmissions = new Map();
        this.parse(config);
    }
    StateExpression.prototype.parse = function (config) {
        if (config.states) {
            var states = config.states;
            var statesLength = states.length;
            for (var index = 0; index < statesLength; index++) {
                for (var property in states[index]) {
                    var state = states[index].state;
                    switch (property) {
                        case "timeAt":
                            this.setInstantStates(states[index].timeAt, state);
                            break;
                        case "timeLessThan":
                            var time2 = parseFloat(states[index].timeLessThan) - (this.seqConfig.period * .001);
                            this.setSpreadState(time2, state);
                            break;
                        case "timeLessThanOrEqualTo":
                            var time3 = parseFloat(states[index].timeLessThanOrEqualTo);
                            this.setSpreadState(time3, state);
                            break;
                        case "timeGreaterThan":
                            var time4 = parseFloat(states[index].timeGreaterThan) + (this.seqConfig.period * .001);
                            this.setSpreadState(time4, state);
                            break;
                        case "timeGreaterThanOrEqualTo":
                            var time5 = parseFloat(states[index].timeGreaterThanOrEqualTo);
                            this.setSpreadState(time5, state);
                            break;
                    }
                }
            }
        }
    };
    StateExpression.prototype.setInstantStates = function (times, state) {
        var _this = this;
        var excludeCommaExpression = /[^,]+/g;
        var moduloExpression = /(mod\s*|%\s*)\d+/;
        var results = times.match(excludeCommaExpression);
        var insertInstantState = function (value) {
            if (!_this.instantEmissions.has(value)) {
                _this.instantEmissions.set(value, new StateEmission_1.StateEmission(new Set([state])));
            }
            else {
                _this.instantEmissions.get(value).instant.add(state);
            }
        };
        if (results) {
            results.map(function (value) {
                if (value.search(moduloExpression) == -1) {
                    var time = parseFloat(value);
                    insertInstantState(time);
                }
                else {
                    var modTime = parseInt(value.match(/\d+/)[0]);
                    if (!_this.moduloInstantEmissions.has(modTime)) {
                        _this.moduloInstantEmissions.set(modTime, state);
                    }
                    else {
                        var currentValue = _this.moduloInstantEmissions.get(modTime);
                        _this.moduloInstantEmissions.set(modTime, currentValue + ',' + state);
                    }
                }
            });
        }
    };
    StateExpression.prototype.setSpreadState = function (time, state) {
        if (!this.spreadEmissions.has(time)) {
            this.spreadEmissions.set(time, new StateEmission_1.StateEmission(undefined, new Set([state])));
        }
        else {
            this.spreadEmissions.get(time).spread.add(state);
        }
    };
    StateExpression.prototype.getStateEmission = function (time) {
        var _this = this;
        var emissions;
        emissions = this.instantEmissions.get(time);
        // determine if any moduloInstantEmissions apply to this moment in time
        this.moduloInstantEmissions.forEach(function (value, key) {
            ///const timeFloat: number = (typeof value === 'string') ? parseFloat(value) : value;
            if (time % key === 0) {
                if (!emissions) {
                    emissions = new StateEmission_1.StateEmission(new Set([value]));
                }
                else {
                    emissions.instant.add(value);
                }
            }
        });
        // get keys greater-equal or lesser-equal in value of time, then add to emissions
        this.spreadEmissions.forEach(function (value, key) {
            if ((!_this.countingUp) ? key >= time : key <= time) {
                if (!emissions) {
                    emissions = new StateEmission_1.StateEmission(undefined, value.spread);
                }
                else {
                    value.spread.forEach(function (val) { return emissions.spread.add(val); });
                }
            }
        });
        // HACK: circumventing issue when valueOf is used.
        //if (emissions && emissions.spread) {
        //   emissions!.spread = new Set(emissions.spread);
        // }
        return emissions;
    };
    return StateExpression;
}());
exports.StateExpression = StateExpression;
//# sourceMappingURL=Segments.js.map