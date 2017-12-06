export interface TimeEmission {
    time: number;
    inStateOf: (value: string | number, compareAsBitwise?: boolean) => boolean;
    state?: SlotEmissionShape;
    interval?: IntervalEmissionShape;
}
export interface IntervalEmissionShape {
    current: number;
    total: number;
}
/**
 * Used internally by StateExpression for the
 * type to be used for its storage. key is the
 * time of an state (SlotEmissionShape)
 */
export interface TimeSlot<T> {
    [key: number]: T;
}
/**
 * Used internally by StateExpression as a generic
 * type variable for TimeSlot. instant and spread
 * property are assigned the state (e.g, 'beep', 4)
 */
export interface SlotEmissionShape {
    instant: Array<string | number>;
    spread: Array<string | number>;
}
