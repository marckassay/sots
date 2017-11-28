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
var Sequencer_1 = require("./Sequencer");
// simply a pass-thru top-level function to call the group function...
function add(ctor, config) {
    return { ctor: ctor, config: config };
}
exports.add = add;
var TimeSegment = /** @class */ (function () {
    function TimeSegment(config, countingUp) {
        if (countingUp === void 0) { countingUp = false; }
        this.config = config;
        this.countingUp = countingUp;
        this.stateexp = new StateExpression(config);
        this.initializeObservable();
    }
    TimeSegment.prototype.initializeObservable = function () {
        var _this = this;
        this.source = Rx_1.Observable.timer(0, Sequencer_1.Sequencer.period)
            .map(function (index) {
            var nuindex;
            if (!_this.countingUp) {
                nuindex = (_this.config.duration - (Sequencer_1.Sequencer.period * index)) * .001;
            }
            else {
                nuindex = (Sequencer_1.Sequencer.period * index) * .001;
            }
            nuindex = Number(nuindex.toFixed(3));
            var states = _this.stateexp.evaluate(nuindex);
            if (_this.previousspread && states && states.spread) {
                states.spread = states.spread.concat(_this.previousspread);
            }
            else if (_this.previousspread && !states) {
                states = { instant: [], spread: _this.previousspread };
            }
            else if (states && states.spread) {
                _this.previousspread = states.spread;
            }
            return { time: nuindex, state: states, interval: _this.interval };
        }).takeWhile(function (value) {
            if (!_this.countingUp) {
                return value.time >= 0;
            }
            else {
                return value.time <= (_this.config.duration * .001);
            }
        });
    };
    TimeSegment.prototype.add = function (ctor, config) {
        var segment = new ctor(config);
        Sequencer_1.SegmentCollection.getInstance().push(segment);
        return segment;
    };
    TimeSegment.prototype.group = function (intervals) {
        var segments = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            segments[_i - 1] = arguments[_i];
        }
        var segment;
        var _loop_1 = function (index) {
            segments.forEach(function (value) {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = new value.ctor(value.config);
                    segment.interval = { current: index + 1, total: intervals };
                    Sequencer_1.SegmentCollection.getInstance().push(segment);
                }
            });
        };
        for (var index = 0; index < intervals; index++) {
            _loop_1(index);
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return Sequencer_1.SegmentCollection.getInstance().getLastSegment();
    };
    return TimeSegment;
}());
exports.TimeSegment = TimeSegment;
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
    function StateExpression(config) {
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
                            var time2 = Number(statetime[index].timeLessThan) - Sequencer_1.Sequencer.period;
                            this.setSpreadState("lessThan", time2, state);
                            break;
                        case "timeLessThanOrEqualTo":
                            var time3 = Number(statetime[index].timeLessThanOrEqualTo);
                            this.setSpreadState("lessThan", time3, state);
                            break;
                        case "timeGreaterThan":
                            var time4 = Number(statetime[index].timeGreaterThan) + Sequencer_1.Sequencer.period;
                            this.setSpreadState("greaterThan", time4, state);
                            break;
                        case "timeGreaterThanOrEqualTo":
                            var time5 = Number(statetime[index].timeGreaterThanOrEqualTo);
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
                var timeslot = _this.timemap[Number(value)];
                if (!timeslot) {
                    _this.timemap[Number(value)] = { instant: [state], spread: [] };
                }
                else if (timeslot.instant) {
                    timeslot.instant.push(state);
                    _this.timemap[Number(value)] = timeslot;
                }
            });
        }
    };
    StateExpression.prototype.setSpreadState = function (operation, time, state) {
        var timeslot = this.timemap[time];
        if (!timeslot) {
            this.timemap[time] = { instant: [], spread: [state] };
        }
        else if (timeslot.spread) {
            timeslot.spread.push(state);
            this.timemap[time] = timeslot;
        }
        // TODO: StateExpression.spread_off isnt being searched for at any moment.
        var polarend = (operation == 'lessThan') ? 0 : Number.MAX_VALUE;
        if (!this.timemap[polarend]) {
            // this.timemap[polarend] = state + StateExpression.spread_off;
        }
        else {
            // this.timemap[polarend] += "," + state + StateExpression.spread_off;
        }
    };
    StateExpression.prototype.evaluate = function (time) {
        return this.timemap[time];
    };
    StateExpression.spread_on = "::ON";
    StateExpression.spread_off = "::OFF";
    StateExpression.spread_regex = /(\w+)(?:\:{2})/g;
    return StateExpression;
}());
exports.StateExpression = StateExpression;
//# sourceMappingURL=Segments.js.map