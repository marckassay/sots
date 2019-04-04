import { Observable, Subject } from 'rxjs';
import { concat } from 'rxjs/operators';
import { ITimeEmission } from '../types/Emission';
import { IGroupParameter, ISegmentConfigShape, ISegmentType, ISequenceConfigShape } from '../types/Segment';
import { TimeSegment } from './TimeSegment';

/**
 * Simply a pass-thru function to be used with-in a group functions parentheses.
 *
 * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
 * @param ctor    A type being subclass of `TimeSegment`, specifically `CountupSegment` or
 * `CountdownSegment`.
 * @param config  Config file specifiying `duration` (required) and `states` (optional).  When used
 * inside a group function, the `omitFirst` can be used to omit this segment when its assigned to
 * the first interval.
 * @returns       An instance of `T` type, which is a subclass of `TimeSegment`.
 */
export function add<T extends TimeSegment>(ctor: ISegmentType<T>, config: ISegmentConfigShape): IGroupParameter<T> {
  return { ctor, config };
}

export class SegmentCollection {
  private segments: TimeSegment[];

  constructor(public config: ISequenceConfigShape, private pauseObserv: Subject<boolean>) {
    this.segments = new Array();
  }

  public add<T extends TimeSegment>(ctor: ISegmentType<T>, config: ISegmentConfigShape): T {
    const segment: T = new ctor(config);
    segment.collection = this;
    segment.seqConfig = this.config;
    segment.pauseObserv = this.pauseObserv;
    this.segments.push(segment);

    return segment;
  }

  public group<T extends TimeSegment>(intervals: number = 1, ...segments: Array<IGroupParameter<T>>): T {
    let segment: TimeSegment;
    // TODO: possibly use the 'repeat' operator in here..
    for (let index = 0; index < intervals; index++) {
      segments.forEach((value: IGroupParameter<T>) => {
        if ((index !== 0) || (!value.config.omitFirst)) {
          segment = this.add(value.ctor, value.config) as TimeSegment;
          (segment as TimeSegment).interval = { current: index + 1, total: intervals };
        }
      });
    }

    // return the last instance, so that this group invocation can be chained if needed...
    return segment! as T;
  }

  public toSequencedObservable(): Observable<ITimeEmission> {
    let concatObservs: Observable<ITimeEmission> | undefined;

    this.segments.forEach((value: TimeSegment, index: number) => {
      let observable: Observable<ITimeEmission>;

      if (index === this.segments.length - 1) {
        if (index !== 0) {
          observable = value.initializeObservable(false, true);
        } else {
          observable = value.initializeObservable(true, true);
        }
      } else {
        if (index !== 0) {
          observable = value.initializeObservable();
        } else {
          observable = value.initializeObservable(true);
        }
      }

      if (concatObservs) {
        concatObservs = concatObservs.pipe(concat(observable));
      } else {
        concatObservs = observable;
      }
    });

    return concatObservs!;
  }

  /** @internal */
  public __marauder(): { segments: TimeSegment[] } {
    return { segments: this.segments };
  }
}
