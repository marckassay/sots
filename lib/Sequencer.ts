import { Observable, Subject } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
import { TimeSegment } from './Segments';

export class SegmentCollection {
    private static instance: SegmentCollection;

    segments: Array<TimeSegment>;
    observables: any;
    lastTimeSegment: TimeSegment;

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

    toSequencedObservable(): Observable<TimeEmission> {
        const len: number = this.observables.length;

        if (len >= 1) {
            let source: Observable<TimeEmission> = this.observables[0];
            for (let index = 0; index <= len - 1; index++) {
                source = source.concat(this.observables[index]);
            }
            return source;
        } else {
            throw new Error("There are no observables to sequence.  Check your configuration.");
        }
    }

    push(segment: TimeSegment): void {
        this.segments.push(segment);
        this.observables.push(segment.source);
        this.lastTimeSegment = segment;
    }

    getLastSegment(): TimeSegment {
        return this.lastTimeSegment;
    }
}

export class Sequencer implements SegmentInterface {
    static period: number;
    pauser: Subject<boolean>;
    publication: Observable<TimeEmission>;
    source: Observable<TimeEmission>;

    constructor(config: { period: number }) {
        Sequencer.period = config.period;
    }
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T {
        const segment: T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    }

    // TODO: this method is complete boilder-plate code.  I need to consider Sequencer
    // as a subclass (or composite) of TimeSegment.
    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T {
        let segment: TimeSegment;

        for (let index = 0; index < intervals; index++) 
        {
            segments.forEach( (value:GroupParameter<T>) => {
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

    start(): void {
        this.pauser.next(false);
    }

    pause(): void {
        this.pauser.next(true);
    }

    publish(): Observable<TimeEmission> {
        if (!this.source) {
            this.source = SegmentCollection.getInstance().toSequencedObservable();
            this.pauser = new Subject<boolean>();
            this.pauser.next(true);
            this.publication = this.pauser.switchMap((paused: boolean) => (paused == true) ? Observable.never() : this.source);
        }

        return this.publication;
    }
}