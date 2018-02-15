import { SequenceConfigShape } from './api/Segment';
export declare class StateEmission implements StateEmission {
    instant: Set<string | number>;
    spread: Set<string | number>;
    static seqConfig: SequenceConfigShape;
    constructor(instant?: Set<string | number>, spread?: Set<string | number>);
    valueOf(state?: string | number, compareAsBitwise?: boolean): boolean | number;
    private getStateValues(state, compareAsBitwise?);
}
