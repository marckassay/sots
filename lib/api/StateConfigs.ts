export type StateConfig<T> = {
    [P in keyof T]: T[P];
}
export interface TimeState {
    state: string | number;
}
export interface TimeAt extends TimeState {
    timeAt: string;
}
export interface TimeLessThan extends TimeState {
    timeLessThan: string;
}
export interface TimeLessThanOrEqualTo extends TimeState {
    timeLessThanOrEqualTo: string;
}
export interface TimeGreaterThan extends TimeState {
    timeGreaterThan: string;
}
export interface TimeGreaterThanOrEqualTo extends TimeState {
    timeGreaterThanOrEqualTo: string;
}
export type StateConfig1 = StateConfig<TimeAt>;
export type StateConfig2 = StateConfig<TimeLessThan>;
export type StateConfig3 = StateConfig<TimeLessThanOrEqualTo>;
export type StateConfig4 = StateConfig<TimeGreaterThan>;
export type StateConfig5 = StateConfig<TimeGreaterThanOrEqualTo>;