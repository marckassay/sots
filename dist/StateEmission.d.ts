export declare class StateEmission implements StateEmission {
    compareAsBitwise?: boolean | undefined;
    instant: Set<string | number>;
    spread: Set<string | number>;
    constructor(compareAsBitwise?: boolean | undefined, instant?: Set<string | number>, spread?: Set<string | number>);
    /**
     * This function is to be called when `sequencer.subscribe.next()` emits an item.
     *
     * @param state An optional parameter that specifies to assert if this state is current in this
     * moment of time.  If no value, a number will be returned representing all states.
     *
     * @param compareAsBitwise when make assertion using bitwise logic.
     */
    valueOf(state?: string | number, compareAsBitwise?: boolean): boolean | number;
    /**
     * Called in StateExpression when constructing a seqeunce.  Its called specifically when
     * additional value is add to spread Set.
     */
    mapToSpread(value: Set<string | number>): void;
    private getStateValues;
}
