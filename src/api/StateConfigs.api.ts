type StateConfig<T> = {
    [P in keyof T]: T[P];
}
interface TimeState {
    state: string
}
interface TimeAt extends TimeState {
    timeAt: string;
}
interface TimeLessThan extends TimeState {
    timeLessThan: string;
}
interface TimeLessThanOrEqualTo extends TimeState {
    timeLessThanOrEqualTo: string;
}
interface TimeGreaterThan extends TimeState {
    timeGreaterThan: string;
}
interface TimeGreaterThanOrEqualTo extends TimeState {
    timeGreaterThanOrEqualTo: string;
}
export type StateConfig1 = StateConfig<TimeAt>;
export type StateConfig2 = StateConfig<TimeLessThan>;
export type StateConfig3 = StateConfig<TimeLessThanOrEqualTo>;
export type StateConfig4 = StateConfig<TimeGreaterThan>;
export type StateConfig5 = StateConfig<TimeGreaterThanOrEqualTo>;