import { Observable, Subject } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface, SequenceConfigShape } from './api/Segment';
import { TimeSegment } from './Segments';
import { Subscription } from 'rxjs/Subscription';
import { EventEmitter } from 'events';
import * as Rx from 'rxjs/Rx'

/**
 * Simply a pass-thru function to be used in the group function.
 * 
 * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
 * @param ctor    A type being subclass of TimeSegment, specifically CountupSegment or CountdownSegment.
 * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
 * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
 * @returns       An instance of T type, which is a subclass of TimeSegment.
 */
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): GroupParameter<T> {
    return { ctor, config };
}

export class SegmentCollection {
    private segments: Array<TimeSegment>;
    private observables: Array<Observable<TimeEmission>>;

    constructor(public config: SequenceConfigShape) {
        this.segments = new Array();
        this.observables = new Array();
    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        const segment: T = new ctor(config);
        segment.collection = this;
        segment.seqConfig = this.config;
        this.push(segment);

        return segment;
    }

    group<T extends TimeSegment>(intervals: number = 1, ...segments: GroupParameter<T>[]): T {
        let segment: TimeSegment;
        // TODO: possibly use the 'repeat' operator in here..
        for (let index = 0; index < intervals; index++) {
            segments.forEach((value: GroupParameter<T>) => {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = this.add(value.ctor, value.config) as TimeSegment;
                    (segment as TimeSegment).interval = { current: index + 1, total: intervals };
                }
            });
        }

        // return the last instance, so that this group invocation can be chained if needed...
        return segment! as T;
    }

    push(segment: TimeSegment): void {
        this.segments.push(segment);
    }

    initializeObservales(): void {
        this.segments.forEach((value: TimeSegment, index: number) => {
            let observable: Observable<TimeEmission>;

            if (index === this.segments.length - 1) {
                observable = value.initializeObservable(true);
            } else {
                observable = value.initializeObservable();
            }

            this.observables.push(observable!);
        });
    }

    toSequencedObservable(): Observable<TimeEmission> {
        this.initializeObservales();

        const len: number = this.observables.length;

        if (len >= 1) {
            let source: Observable<TimeEmission> = this.observables[0];
            for (let index = 1; index <= len - 1; index++) {
                source = source.concat(this.observables[index]);
            }
            return source;

        } else {
            throw new Error("There are no observables to sequence.  Check your configuration.");
        }
    }

    /** @internal */
    __marauder(): { segments: Array<TimeSegment>, observables: any } {
        return { segments: this.segments, observables: this.observables };
    }
}
enum EmitterEvents {
    start = 'start',
    pause = 'pause',
    reset = 'reset',
    complete = 'complete'
}
/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor   Sequencer must be instantiated with a value for period that is read in milliseconds.  This value becomes static and global to its segments.
 * @returns   an instance.
 */
export class Sequencer implements SegmentInterface {
    collection: SegmentCollection;
    private source: Observable<TimeEmission>;
    private subscribedObservable: Observable<TimeEmission>;
    publication: Observable<TimeEmission>;
    // private resetFlag: boolean;
    private emitter: EventEmitter;
    private startEventObserv: Observable<{}>;
    private pauseEventObserv: Observable<{}>;
    private resetEventObserv: Observable<{}>;
    private completeEventObser: Observable<{}>;

    constructor(public config: SequenceConfigShape) {
        this.collection = new SegmentCollection(config);

        //this.resetFlag = false;

        this.initEmitterAndObservs();
    }

    private initEmitterAndObservs(): void {
        this.emitter = new EventEmitter();
        this.startEventObserv = Observable.fromEvent(this.emitter, EmitterEvents.start);
        this.pauseEventObserv = Observable.fromEvent(this.emitter, EmitterEvents.pause);
        this.resetEventObserv = Observable.fromEvent(this.emitter, EmitterEvents.reset);
        this.completeEventObser = Observable.fromEvent(this.emitter, EmitterEvents.complete);
    }

    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        return this.collection.add(ctor, config);
    }

    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    group<T extends TimeSegment>(intervals: number = 1, ...segments: GroupParameter<T>[]): T {
        return this.collection.group(intervals, ...segments);
    }

    /**
     * Starts internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    start(): void {
        if (this.source) {
            // this.resetFlag = false;
            this.emitter.emit(EmitterEvents.start);
        } else {
            throw "A call to subscribe() needs to be made prior to start() or pause() invocation.";
        }
    }

    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    pause(): void {
        if (this.source) {
            this.emitter.emit(EmitterEvents.pause);
        } else {
            throw "A call to subscribe() needs to be made prior to start() or pause().";
        }
    }

    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    reset(): void {
        if (this.source) {
            //this.resetFlag = true;
            //this.emitter.emit(EmitterEvents.pause);
            this.emitter.emit(EmitterEvents.reset);
        } else {
            throw "A call to subscribe() needs to be made prior to start() or pause().";
        }
    }

    /**
     * Returns an Observable<TimeEmission> versus, subscribe() which returns a Subscription.  Typically subscribe()
     * is used.
     * @returns Observable<TimeEmission>.
     */
    publish(): Observable<TimeEmission> {
        this.source = this.collection.toSequencedObservable();
        this.subscribedObservable = Rx.Observable.merge(
            this.startEventObserv.switchMap(() =>
                Observable.interval(this.config.period).takeUntil(this.pauseEventObserv)).map(() => 1).startWith(0),
            this.resetEventObserv.map(() => 0)
        ).scan((acc: number, value: number, _index: number) => {
            return (value === 0 ? 0 : acc + value);
        }, 0).mergeMap((value: number, _index: number) => {
            return this.source.elementAt(value)
                .catch((_err, caught: Observable<TimeEmission>) => {
                    // TODO: this is thrown because of out of range on elementAt(). 
                    // emitting here serves the purpose, but there must be 
                    // a better way of handling this.
                    this.emitter.emit(EmitterEvents.complete);
                    return caught;
                });
        }).takeUntil(this.completeEventObser);

        return this.subscribedObservable;
    }

    /**
     * Pass in callback functions to "subscribe" to an Observable emitting.  This is the only means of making an 
     * observation of emission.
     * 
     * @returns Subscription.
     */
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription {
        return this.publish().subscribe(next, error, complete);
    }

    /** @internal */
    __marauder(): { pauser: Subject<boolean>, source: Observable<TimeEmission> } {
        return { pauser: new Subject(), source: this.source };
    }
}