import { TimeSegment } from './TimeSegment';
import { ISegmentConfigShape } from './api/Segment';

/**
 * Counts up in time.  In otherwords, its ascending time.
 */
export class CountupSegment extends TimeSegment {
  constructor(public config: ISegmentConfigShape) {
    super(config, true);
  }
}
