import { ISegmentConfigShape } from '../types/Segment';
import { TimeSegment } from './TimeSegment';

/**
 * Counts down in time. In otherwords, it's descending time.
 */
export class CountdownSegment extends TimeSegment {
  constructor(public config: ISegmentConfigShape) {
    super(config, false);
  }
}
