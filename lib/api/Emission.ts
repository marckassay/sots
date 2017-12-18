export interface TimeEmission {
    time: number;
    state?: StateEmission;
    interval?: IntervalEmission;
}

export interface StateEmission {
    instant: Array<string | number>;
    spread: Array<string | number>;
    valueOf: (state?: string | number, compareAsBitwise?: boolean) => boolean | number;
}

export interface IntervalEmission {
    current: number;
    total: number;
}