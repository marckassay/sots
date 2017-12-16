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
var TimeSegment = /** @class */ (function () {
    function TimeSegment(config, countingUp) {
        if (countingUp === void 0) { countingUp = false; }
        this.config = config;
        this.countingUp = countingUp;
    }
    TimeSegment.prototype.initializeObservable = function (lastElement) {
        var _this = this;
        if (lastElement === void 0) { lastElement = false; }
        this.previousSpread = undefined;
        this.stateExp = new StateExpression(this.config, this.seqConfig);
        var totalElements = this.config.duration / this.seqConfig.period;
        var source = Rx_1.Observable.range(0, totalElements)
            .map(function (_value, index) {
            var nuindex;
            if (!_this.countingUp) {
                nuindex = (_this.config.duration - (_this.seqConfig.period * index)) * .001;
            }
            else {
                nuindex = (_this.seqConfig.period * index) * .001;
            }
            nuindex = parseFloat(nuindex.toFixed(3));
            var slot = _this.stateExp.checkForSlot(nuindex, _this.previousSpread);
            if (slot && slot.spread.length > 0) {
                _this.previousSpread = slot.spread;
            }
            return { time: nuindex, interval: _this.interval, state: slot };
        })
            .takeWhile(function (value) {
            if (lastElement == false) {
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
    function StateExpression(config, seqConfig) {
        this.seqConfig = seqConfig;
        this.timemap = {};
        this.parse(config);
    }
    StateExpression.prototype.parse = function (config) {
        if (config.states) {
            var statetime = config.states;
            var len = statetime.length;
            for (var index = 0; index < len; index++) {
                for (var property in statetime[index]) {
                    var state = statetime[index].state;
                    switch (property) {
                        case "timeAt":
                            this.setInstantStates(statetime[index].timeAt, state);
                            break;
                        case "timeLessThan":
                            var time2 = parseFloat(statetime[index].timeLessThan) - this.seqConfig.period;
                            this.setSpreadState("lessThan", time2, state);
                            break;
                        case "timeLessThanOrEqualTo":
                            var time3 = parseFloat(statetime[index].timeLessThanOrEqualTo);
                            this.setSpreadState("lessThan", time3, state);
                            break;
                        case "timeGreaterThan":
                            var time4 = parseFloat(statetime[index].timeGreaterThan) + this.seqConfig.period;
                            this.setSpreadState("greaterThan", time4, state);
                            break;
                        case "timeGreaterThanOrEqualTo":
                            var time5 = parseFloat(statetime[index].timeGreaterThanOrEqualTo);
                            this.setSpreadState("greaterThan", time5, state);
                            break;
                    }
                }
            }
        }
    };
    StateExpression.prototype.setInstantStates = function (times, state) {
        var _this = this;
        var time_expression = /(\d+)/g;
        var results = times.match(time_expression);
        if (results) {
            results.map(function (value) {
                var timeslot = _this.timemap[parseFloat(value)];
                if (!timeslot) {
                    _this.timemap[parseFloat(value)] = _this.newSlot([state]);
                }
                else {
                    timeslot.instant.push(state);
                }
            });
        }
    };
    StateExpression.prototype.setSpreadState = function (_operation, time, state) {
        var timeslot = this.timemap[time];
        if (!timeslot) {
            this.timemap[time] = this.newSlot([], [state]);
        }
        else {
            timeslot.spread.push(state);
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
    };
    StateExpression.prototype.checkForSlot = function (time, previousSpread) {
        var slot = this.timemap[time];
        if (slot && previousSpread) {
            slot.spread.concat(previousSpread);
        }
        else if (!slot && previousSpread) {
            slot = this.newSlot([], previousSpread);
            this.timemap[time] = slot;
        }
        return slot;
    };
    StateExpression.prototype.newSlot = function (instant, spread) {
        var _this = this;
        if (instant === void 0) { instant = []; }
        if (spread === void 0) { spread = []; }
        return {
            instant: instant,
            spread: spread,
            valueOf: function (state, compareAsBitwise) {
                var results;
                if (state !== undefined) {
                    results = (_this.getStateValues(instant, spread, state, compareAsBitwise) >= 0);
                }
                else {
                    results = _this.getStateValues(instant, spread, -1, true);
                }
                return results;
            }
        };
    };
    StateExpression.prototype.getStateValues = function (instant, spread, state, compareAsBitwise) {
        var useBitwiseCompare;
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
            }
            else {
                return 1;
            }
        }
        else if (typeof state === 'string') {
            throw "valueOf() has been called with a string and flagged to use bitwise comparisons.";
        }
        else {
            var total_1 = 0;
            instant.forEach(function (value) {
                if (typeof value === 'number') {
                    total_1 += value;
                }
            }, total_1);
            spread.forEach(function (value) {
                if (typeof value === 'number') {
                    total_1 += value;
                }
            }, total_1);
            if (state === -1) {
                return total_1;
            }
            else {
                return ((total_1 & state) === state) ? 1 : -1;
            }
        }
    };
    StateExpression.applySpread = "::ON";
    StateExpression.removeSpread = "::OFF";
    StateExpression.spread_regex = /(\w+)(?:\:{2})/g;
    return StateExpression;
}());
exports.StateExpression = StateExpression;
//# sourceMappingURL=Segments.js.map