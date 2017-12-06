export declare type StateConfig<T> = {
    [P in keyof T]: T[P];
};
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
export declare type StateConfig1 = StateConfig<TimeAt>;
export declare type StateConfig2 = StateConfig<TimeLessThan>;
export declare type StateConfig3 = StateConfig<TimeLessThanOrEqualTo>;
export declare type StateConfig4 = StateConfig<TimeGreaterThan>;
export declare type StateConfig5 = StateConfig<TimeGreaterThanOrEqualTo>;
