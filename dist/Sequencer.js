"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Rx_1 = require("rxjs/Rx");
var SegmentCollection = /** @class */ (function () {
    function SegmentCollection() {
        this.segments = new Array();
        this.observables = new Array();
    }
    SegmentCollection.getInstance = function () {
        if (!SegmentCollection.instance) {
            SegmentCollection.instance = new SegmentCollection();
        }
        return SegmentCollection.instance;
    };
    SegmentCollection.prototype.toSequencedObservable = function () {
        var len = this.observables.length;
        if (len >= 1) {
            var source = this.observables[0];
            for (var index = 1; index <= len - 1; index++) {
                source = source.concat(this.observables[index]);
            }
            return source;
        }
        else {
            throw new Error("There are no observables to sequence.  Check your configuration.");
        }
    };
    SegmentCollection.prototype.push = function (segment) {
        this.segments.push(segment);
        this.observables.push(segment.source);
        this.lastTimeSegment = segment;
    };
    SegmentCollection.prototype.getLastSegment = function () {
        return this.lastTimeSegment;
    };
    return SegmentCollection;
}());
exports.SegmentCollection = SegmentCollection;
var Sequencer = /** @class */ (function () {
    function Sequencer(config) {
        Sequencer.period = config.period;
    }
    Sequencer.prototype.add = function (ctor, config) {
        var segment = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    };
    // TODO: this method is complete boilder-plate code.  I need to consider Sequencer
    // as a subclass (or composite) of TimeSegment.
    Sequencer.prototype.group = function (intervals) {
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
                    SegmentCollection.getInstance().push(segment);
                }
            });
        };
        for (var index = 0; index < intervals; index++) {
            _loop_1(index);
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return SegmentCollection.getInstance().getLastSegment();
    };
    Sequencer.prototype.start = function () {
        this.pauser.next(false);
    };
    Sequencer.prototype.pause = function () {
        this.pauser.next(true);
    };
    Sequencer.prototype.publish = function () {
        var _this = this;
        if (!this.source) {
            this.source = SegmentCollection.getInstance().toSequencedObservable();
            this.pauser = new Rx_1.Subject();
            this.pauser.next(true);
            this.publication = this.pauser.switchMap(function (paused) { return (paused == true) ? Rx_1.Observable.never() : _this.source; });
        }
        return this.publication;
    };
    return Sequencer;
}());
exports.Sequencer = Sequencer;
//# sourceMappingURL=Sequencer.js.map