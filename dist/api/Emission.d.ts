export interface TimeEmission {
    time: number;
    state?: SlotEmissionShape;
    interval?: IntervalEmissionShape;
}
export interface IntervalEmissionShape {
    current: number;
    total: number;
}
export interface SlotEmissionShape {
    instant: Array<string | number>;
    spread: Array<string | number>;
    valueOf: (state?: string | number, compareAsBitwise?: boolean) => boolean | number;
}
