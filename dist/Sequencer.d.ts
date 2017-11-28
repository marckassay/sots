import { Observable, Subject } from 'rxjs/Rx';
import { TimeEmission } from './api/Emission';
import { SegmentType, SegmentConfigShape, GroupParameter, SegmentInterface } from './api/Segment';
import { TimeSegment } from './Segments';
export declare class SegmentCollection {
    private static instance;
    segments: Array<TimeSegment>;
    observables: any;
    lastTimeSegment: TimeSegment;
    private constructor();
    static getInstance(): SegmentCollection;
    toSequencedObservable(): Observable<TimeEmission>;
    push(segment: TimeSegment): void;
    getLastSegment(): TimeSegment;
}
export declare class Sequencer implements SegmentInterface {
    static period: number;
    pauser: Subject<boolean>;
    publication: Observable<TimeEmission>;
    source: Observable<TimeEmission>;
    constructor(config: {
        period: number;
    });
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T;
    group<T extends TimeSegment>(intervals: number, ...segments: GroupParameter<T>[]): T;
    start(): void;
    pause(): void;
    publish(): Observable<TimeEmission>;
}
