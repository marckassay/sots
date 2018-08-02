"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StateEmission = /** @class */ (function () {
    function StateEmission(compareAsBitwise, instant, spread) {
        if (instant === void 0) { instant = new Set(); }
        if (spread === void 0) { spread = new Set(); }
        this.compareAsBitwise = compareAsBitwise;
        this.instant = instant;
        this.spread = spread;
    }
    /**
     * This function is to be called when `sequencer.subscribe.next()` emits an item.
     *
     * @param state An optional parameter that specifies to assert if this state is current in this
     * moment of time.  If no value, a number will be returned representing all states.
     *
     * @param compareAsBitwise when make assertion using bitwise logic.
     */
    StateEmission.prototype.valueOf = function (state, compareAsBitwise) {
        var results;
        if (state !== undefined) {
            results = (this.getStateValues(state, compareAsBitwise) > 0);
        }
        else {
            results = this.getStateValues(-1, true);
        }
        return results;
    };
    /**
     * Called in StateExpression when constructing a seqeunce.  Its called specifically when
     * additional value is add to spread Set.
     */
    StateEmission.prototype.mapToSpread = function (value) {
        var _this = this;
        this.spread = new Set(this.spread);
        value.forEach(function (val) {
            _this.spread.add(val);
        });
        return this.spread;
    };
    StateEmission.prototype.getStateValues = function (state, compareAsBitwise) {
        var useBitwiseCompare;
        if (compareAsBitwise != undefined) {
            useBitwiseCompare = compareAsBitwise;
        }
        else if (this.compareAsBitwise != undefined) {
            useBitwiseCompare = this.compareAsBitwise;
        }
        else {
            useBitwiseCompare = false;
        }
        if (useBitwiseCompare === false) {
            // here returning numbers (1,0) and not boolean to conform to this method's return type
            if (this.instant.has(state) === false) {
                return (this.spread.has(state) ? 1 : 0);
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
            this.instant.forEach(function (value) {
                if (typeof value === 'number') {
                    total_1 += value;
                }
            }, total_1);
            this.spread.forEach(function (value) {
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
    return StateEmission;
}());
exports.StateEmission = StateEmission;
//# sourceMappingURL=StateEmission.js.map