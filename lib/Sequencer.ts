import { Observable, Subject } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
import { TimeSegment } from './Segments';
import { Subscription } from 'rxjs/Subscription';

export class SegmentCollection {
    private static instance: SegmentCollection | undefined;

    private segments: Array<TimeSegment>;
    private observables: any;
    private lastTimeSegment: TimeSegment;

    private constructor() {
        this.segments = new Array();
        this.observables = new Array();
    }

    static getInstance() {
        if (!SegmentCollection.instance) {
            SegmentCollection.instance = new SegmentCollection();
        }
        return SegmentCollection.instance;
    }

    /**
     * internal method
     */
    toSequencedObservable(): Observable<TimeEmission> {
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

    /**
     * internal method
     */
    push(segment: TimeSegment): void {
        this.segments.push(segment);
        this.observables.push(segment.getObservable());
        this.lastTimeSegment = segment;
    }

    /**
     * internal method
     */
    getLastSegment(): TimeSegment {
        return this.lastTimeSegment;
    }

    marauder(clear:boolean):{segments: Array<TimeSegment>, observables: any} {
        if(clear) {
            SegmentCollection.instance = undefined;
        }
        return {segments: this.segments, observables: this.observables};
    }
}

/**
 * Initiates a sequence with time period being defined in its constructor.
 * @param constructor   Sequencer must be instantiated with a value for period that is read in milliseconds.  This value becomes static and global to its segments.
 * @returns   an instance.
 */
export class Sequencer implements SegmentInterface {
    static period: number;
    private pauser: Subject<boolean>;
    private publication: Observable<TimeEmission>;
    private source: Observable<TimeEmission>;

    constructor(config: { period: number }) {
        Sequencer.period = config.period;
    }

    /**
     * Adds a single segment (CountupSegment or CountdownSegment) to a sequence.
     * @param ctor    A type being subclass of TimeSegment,  Specifically CountupSegment or CountdownSegment.
     * @param config  Config file specifiying duration (required) and states (optional).  When used inside a group
     * function, the omitFirst can be used to omit this segment when its assigned to the first interval.
     * @returns       An instance of T type, which is a subclass of TimeSegment.
     */
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        const segment: T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    }

    // TODO: this method is complete boilder-plate code.  I need to consider Sequencer
    // as a subclass (or composite) of TimeSegment.
    // TODO: consider if intervals is '0'.
    /**
     * Multiply its combined add() invocations and returns a TimeSegment.
     * @param intervals The number intervals or cycles to be added of segments.  Must be 1 or greater in value.
     * @param segments  Consists of add() invocations.
     * @returns         An instance of T type, which is a subclass of TimeSegment.
     */
    group<T extends TimeSegment>(intervals: number = 1, ...segments: GroupParameter<T>[]): T {
        let segment: TimeSegment;

        for (let index = 0; index < intervals; index++) {
            segments.forEach((value: GroupParameter<T>) => {
                if ((index != 0) || (!value.config.omitFirst)) {
                    segment = new value.ctor(value.config) as TimeSegment;
                    segment.interval = { current: index + 1, total: intervals };
                    SegmentCollection.getInstance().push(segment);
                }
            });
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return SegmentCollection.getInstance().getLastSegment() as T;
    }

    /**
     * Starts internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    start(): void {
        if (this.pauser) {
            this.pauser.next(false);
        } else {
            throw "A call to subscribe() needs to be made prior to start() or pause() invocation.";
        }
    }

    /**
     * Pauses internal Observable to start emitting.  This must be called after the 'subscribe()' is called.
     * @returns void.
     */
    pause(): void {
        if (this.pauser) {
            this.pauser.next(true);
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
        if (!this.source) {
            this.pauser = new Subject<boolean>();
            this.source = SegmentCollection.getInstance().toSequencedObservable();
            this.pauser.next(true);
            this.publication = this.pauser.switchMap((paused: boolean) => (paused == true) ? Observable.never() : this.source);
        }

        return this.publication;
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

    marauder():{pauser: Subject<boolean>} {
        return {pauser: this.pauser};
    }
}