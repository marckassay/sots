import { Observable, Subject } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';
import { TimeSegment } from './Segments';
import { SegmentInterface, SegmentConfig, SegmentType, GroupParameter, TimeEmission } from './Interfaces';

export class SegmentCollection {
    private static instance: SegmentCollection;

    segments: Array<TimeSegment>;
    observables: any;

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

    toSequencedObservable(): Observable<any> {
        const len: number = this.observables.length;
        let source: Observable<any>;

        if (len >= 1) {
            source = this.observables[0];

            for (let index = 1; index <= len - 1; index++) {
                source = source.concat(this.observables[index]);
            }
        }

        return source;
    }

    push(segment: TimeSegment) {
        this.segments.push(segment);
        this.observables.push(segment.source);
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

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfig): T {
        const segment: T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    }

    // TODO: this method is complete boilder-plate code.  I need to consider Sequencer
    // as a subclass (or composite) of TimeSegment.
    group(intervals: number, ...segments: GroupParameter[]): TimeSegment {
        let segment: TimeSegment;

        for (let index = 0; index < intervals; index++) {
            for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
                const segType: GroupParameter = segments[segmentIndex];
                if ((index != 0) || (!segType.config.omitFirst)) {
                    segment = new segType.ctor(segType.config);
                    segment.interval = { current: index + 1, total: intervals };
                    SegmentCollection.getInstance().push(segment);
                }
            }
        }
        // return the last instance, so that this group invocation can be chained if needed...
        return segment;
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