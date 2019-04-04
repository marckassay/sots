import { TimeSegment } from '../TimeSegment';
import * as state from './StateConfigs';

export interface ISequenceConfigShape {
  period: number;
  compareAsBitwise?: boolean;
}

export interface ISegmentConfigShape {
  duration: number;
  omitFirst?: boolean;
  compareAsBitwise?: boolean;
  states?: Array<state.StateConfig1 |
    state.StateConfig2 |
    state.StateConfig3 |
    state.StateConfig4 |
    state.StateConfig5>;
}

export interface ISegmentInterface {
  add<T extends TimeSegment>(ctor: ISegmentType<T>, config: ISegmentConfigShape): T;
  group<T extends TimeSegment>(intervals: number, ...segments: Array<IGroupParameter<T>>): T;
}

export type ISegmentType<T extends TimeSegment> = new (config: ISegmentConfigShape) => T;

export interface IGroupParameter<T extends TimeSegment> {
  ctor: ISegmentType<T>;
  config: ISegmentConfigShape;
}
