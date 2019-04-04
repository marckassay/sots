export interface ITimeEmission {
  time: number;
  state?: IStateEmission;
  interval?: IIntervalEmission;
}

export interface IStateEmission {
  instant: Set<string | number>;
  spread: Set<string | number>;
  valueOf: (state?: string | number, compareAsBitwise?: boolean) => boolean | number;
}

export interface IIntervalEmission {
  current: number;
  total: number;
}
