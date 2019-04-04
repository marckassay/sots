import { interval, never, zip, Observable, Observer, PartialObserver, Subject, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SegmentCollection } from './SegmentCollection';
import { TimeSegment } from './TimeSegment';
import { ITimeEmission } from './api/Emission';
// tslint:disable-next-line: max-line-length
import { IGroupParameter, ISegmentConfigShape, ISegmentInterface, ISegmentType, ISequenceConfigShape } from './api/Segment';
import { ISubscribable } from './api/Subscribable';

/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor  Sequencer must be instantiated with a value for period that is read in
 * milliseconds.  This value becomes static and global to its segments.
 */
export class Sequencer implements ISegmentInterface, ISubscribable {
  public collection: SegmentCollection;
  public subscription: Subscription;
  private pauseObserv: Subject<boolean>;
  private source: Observable<ITimeEmission>;
  private observer: Observer<ITimeEmission>;

  constructor(public config: ISequenceConfigShape) {
    this.pauseObserv = new Subject<boolean>();
    this.collection = new SegmentCollection(config, this.pauseObserv);
  }

  /**
   * Adds a single segment (`CountupSegment` or `CountdownSegment`) to a sequence.
   * @param ctor    A type being subclass of `TimeSegment`,  Specifically `CountupSegment` or
   * `CountdownSegment`.
   * @param config  Config file specifiying `duration` (required) and `states` (optional).  When
   * used inside a group function, the `omitFirst` can be used to omit this segment when its
   * assigned to the first interval.
   * @returns       An instance of `T` type, which is a subclass of TimeSegment.
   */
  public add<T extends TimeSegment>(ctor: ISegmentType<T>, config: ISegmentConfigShape): T {
    return this.collection.add(ctor, config);
  }

  /**
   * Multiply its combined `add()` invocations and returns a `TimeSegment`.
   * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater
   * in value.
   * @param segments  Consists of `add()` invocations returns.
   * @returns         An instance of `T` type, which is a subclass of `TimeSegment`.
   */
  public group<T extends TimeSegment>(intervals: number = 1, ...segments: Array<IGroupParameter<T>>): T {
    return this.collection.group(intervals, ...segments);
  }

  /**
   * Starts internal Observable to start emitting.  This must be called after the `subscribe()` or
   * `subscribeWith()` is called.
   * @returns void.
   */
  public start(): void {
    if (this.source) {
      this.pauseObserv.next(true);
    } else {
      throw new Error('A call to subscribe() needs to be made prior to start(), pause() or reset().');
    }
  }

  /**
   * Pauses internal Observable to start emitting.  This must be called after the `subscribe()` or
   * `subscribeWith()` is called.
   * @returns void.
   */
  public pause(): void {
    if (this.source) {
      this.pauseObserv.next(false);
    } else {
      throw new Error('A call to subscribe() needs to be made prior to start(), pause() or reset().');
    }
  }

  /**
   * Resets the sequence.  This must be called after the `subscribeWith()` is called since a
   * callback object is needed.
   * That said, this method will unsubscribe and then subscribe again to "reset" the sequence.
   * @returns void.
   */
  public reset(): void {
    if (this.source && this.observer) {
      this.unsubscribe();
      this.subscribe(this.observer);
    } else {
      let mesg: string = '';
      if (!this.source) {
        mesg += 'A call to subscribe() needs to be made prior to start(), pause() or reset().';
      }
      if (!this.observer) {
        mesg += (mesg.length > 0) ? '  Also, in ' : '  In ';
        mesg += 'order to reset, an observer instance is needed.  See documentation on subscribe(observer).';
      }
      throw mesg;
    }
  }

  /**
   * Returns an Observable<ITimeEmission> object versus a Subscription object which `subscribe()`
   * returns.  Typically `subscribe()` is just used.
   * @returns Observable<ITimeEmission>.
   */
  public publish() {
    this.source = this.collection.toSequencedObservable();
    return zip(
      this.source, this.pauseObserv.pipe(
        switchMap((value) => (value) ? interval(this.config.period) : never())),
      );
  }

  /**
   * Pass in callback functions to "subscribe" to emissions from sots.
   *
   * @returns Subscription.
   */
  public subscribe(observer: PartialObserver<ITimeEmission>): Subscription;

  public subscribe(next?: (value: ITimeEmission) => void,
                   error?: (error: any) => void,
                   complete?: () => void): Subscription;

  public subscribe(nextOrObserver: any,
                   error?: (error: any) => void,
                   complete?: () => void): Subscription {
    if (typeof nextOrObserver !== 'function') {
      this.observer = nextOrObserver;
    }
    if (!this.source) {
      this.publish();
    }
    this.subscription = this.source.subscribe(nextOrObserver, error, complete);
    return this.subscription;
  }

  /**
   * Unsubscribe the subscription that is create from `subscribe()` or `subscribeWith()`.  This also
   * calls the `remove()`
   * method.
   */
  public unsubscribe(): void {
    this.remove();
    this.subscription.unsubscribe();
  }

  /**
   * Calls the remove method on the subscription object that was create from `subscribe()` or
   * `subscribeWith()`.
   */
  public remove(): void {
    this.subscription.remove(this.subscription);
  }

  /** @internal */
  public __marauder(): {
    pauseObserv: Subject<boolean>;
    source: Observable<ITimeEmission>;
  } {
    return { pauseObserv: this.pauseObserv, source: this.source };
  }
}
