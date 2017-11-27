export interface TimeEmission {
    state: SlotEmissionShape;
    time: number;
    interval?: IntervalEmissionShape;
}

export interface SlotEmissionShape {
    instant?: string[],
    spread?: string[]
}

export interface IntervalEmissionShape {
    current: number;
    total: number;
}

export interface TimeSlot<T> {
    [key: number]: T;
}