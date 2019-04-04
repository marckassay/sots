import { ISegmentConfigShape } from '../types/Segment';
import { TimeSegment } from './TimeSegment';

/**
 * Counts up in time. In otherwords, it's ascending time.
 */
export class CountupSegment extends TimeSegment {
  constructor(public config: ISegmentConfigShape) {
    super(config, true);
  }
}
