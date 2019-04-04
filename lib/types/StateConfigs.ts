export type StateConfig<T> = {
  [P in keyof T]: T[P];
};

export interface ITimeState {
  state: string | number;
}

export interface ITimeAt extends ITimeState {
  timeAt: string;
}

export interface ITimeLessThan extends ITimeState {
  timeLessThan: string;
}

export interface ITimeLessThanOrEqualTo extends ITimeState {
  timeLessThanOrEqualTo: string;
}

export interface ITimeGreaterThan extends ITimeState {
  timeGreaterThan: string;
}

export interface ITimeGreaterThanOrEqualTo extends ITimeState {
  timeGreaterThanOrEqualTo: string;
}

export type StateConfig1 = StateConfig<ITimeAt>;
export type StateConfig2 = StateConfig<ITimeLessThan>;
export type StateConfig3 = StateConfig<ITimeLessThanOrEqualTo>;
export type StateConfig4 = StateConfig<ITimeGreaterThan>;
export type StateConfig5 = StateConfig<ITimeGreaterThanOrEqualTo>;
