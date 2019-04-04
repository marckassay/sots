import { TimeSegment } from './TimeSegment';
import { ISegmentConfigShape } from './api/Segment';

/**
 * Counts down in time.  In otherwords, its descending time.
 */
export class CountdownSegment extends TimeSegment {
  constructor(public config: ISegmentConfigShape) {
    super(config, false);
  }
}
