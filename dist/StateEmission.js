export class StateEmission {
    constructor(compareAsBitwise, instant = new Set(), spread = new Set()) {
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
    valueOf(state, compareAsBitwise) {
        let results;
        if (state !== undefined) {
            results = (this.getStateValues(state, compareAsBitwise) > 0);
        }
        else {
            results = this.getStateValues(-1, true);
        }
        return results;
    }
    /**
     * Called in StateExpression when constructing a seqeunce.  Its called specifically when
     * additional value is add to spread Set.
     */
    mapToSpread(value) {
        this.spread = new Set(this.spread);
        value.forEach((val) => {
            this.spread.add(val);
        });
        return this.spread;
    }
    getStateValues(state, compareAsBitwise) {
        let useBitwiseCompare;
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
            let total = 0;
            this.instant.forEach((value) => {
                if (typeof value === 'number') {
                    total += value;
                }
            }, total);
            this.spread.forEach((value) => {
                if (typeof value === 'number') {
                    total += value;
                }
            }, total);
            if (state === -1) {
                return total;
            }
            else {
                return ((total & state) === state) ? 1 : -1;
            }
        }
    }
}
//# sourceMappingURL=StateEmission.js.map