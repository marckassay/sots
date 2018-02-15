import { SequenceConfigShape } from './api/Segment';
export declare class StateEmission implements StateEmission {
    static seqConfig: SequenceConfigShape;
    instant: Set<string | number>;
    spread: Set<string | number>;
    constructor(instant?: Set<string | number>, spread?: Set<string | number>);
    valueOf(state?: string | number, compareAsBitwise?: boolean): boolean | number;
    private getStateValues(state, compareAsBitwise?);
}
