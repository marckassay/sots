import { never, timer, Observable, Subject } from 'rxjs';
import { map, startWith, switchMap, takeWhile } from 'rxjs/operators';
import { SegmentCollection } from './SegmentCollection';
import { StateExpression } from './StateExpression';
import { IIntervalEmission, ITimeEmission } from './api/Emission';
// tslint:disable-next-line: max-line-length
import { IGroupParameter, ISegmentConfigShape, ISegmentInterface, ISegmentType, ISequenceConfigShape } from './api/Segment';

export class TimeSegment implements ISegmentInterface {
  public config: ISegmentConfigShape;
  public seqConfig: ISequenceConfigShape;
  public pauseObserv: Subject<boolean>;
  public collection: SegmentCollection;
  public interval: IIntervalEmission;
  private countingUp: boolean;
  private stateExp: StateExpression;

  constructor(config: ISegmentConfigShape, countingUp: boolean = false) {
    this.config = config;
    this.countingUp = countingUp;
  }

  public initializeObservable(firstElementOfSeq: boolean = false,
                              lastElementOfSeq: boolean = false): Observable<ITimeEmission> {

    this.stateExp = new StateExpression(this.config, this.seqConfig, this.countingUp);

    const source: Observable<ITimeEmission> = this.pauseObserv.pipe(
      startWith(!firstElementOfSeq),
      switchMap((value) => (value) ? timer(0, this.seqConfig.period) : never()),
      map((val: number, index: number): ITimeEmission => {
        let time: number;
        if (!this.countingUp) {
          time = (this.config.duration - (this.seqConfig.period * index)) * .001;
        } else {
          time = (this.seqConfig.period * index) * .001;
        }
        time = parseFloat(time.toFixed(3));

        return { time, interval: this.interval, state: this.stateExp.getStateEmission(time) };
      }),
      takeWhile((value: ITimeEmission) => {
        if (lastElementOfSeq === false) {
          if (!this.countingUp) {
            return value.time > 0;
          } else {
            return value.time < (this.config.duration * .001);
          }
        } else {
          if (!this.countingUp) {
            return !(value.time === 0);
          } else {
            return !(value.time === (this.config.duration * .001));
          }
        }
      }),
    );

    return source;
  }

  /**
   * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
   * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or
   * CountdownSegment.
   * @param config  Config file specifiying duration (required) and states (optional).  When used
   * inside a group function, the omitFirst can be used to omit this segment when its assigned to
   * the first interval.
   * @returns       An instance of T type, which is a subclass of TimeSegment.
   */
  public add<T extends TimeSegment>(ctor: ISegmentType<T>, config: ISegmentConfigShape): T {
    return this.collection.add(ctor, config);
  }

  /**
   * Multiply its combined add() invocations and returns a TimeSegment.
   * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater
   * in value.
   * @param segments  Consists of add() invocations.
   * @returns         An instance of T type, which is a subclass of TimeSegment.
   */
  public group<T extends TimeSegment>(intervals: number, ...segments: Array<IGroupParameter<T>>): T {
    return this.collection.group(intervals, ...segments);
  }
}
