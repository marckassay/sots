import { Observable, Subject } from 'rxjs/Rx';
import { Subscription } from 'rxjs/Subscription';

export interface TimeConfig {
    period: number;
}

// static-side interface
export interface SegmentType<T extends TimeSegment> {
    new (config: TimeConfig): T;
}

export interface SegmentInterface {
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T;
    group(intervals: number, ...segments: GroupParameter[]): TimeSegment;
}

export interface GroupParameter {
    // TODO: need to figure this typing out
    //ctor: SegmentType<T extends TimeSegment>;
    ctor: SegmentType<CountdownSegment|CountupSegment>;
    config: TimeConfig;
}

export class Sequencer implements SegmentInterface {
    pauser: Subject<boolean>;
    publication: any;
    source: Observable<any>;
    subscribe: Subscription;
    
    constructor (public config: TimeConfig) {

    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T {
         const segment:T = new ctor(config);
         SegmentCollection.getInstance().push(segment);
         return segment;
    }

    group(intervals: number, ...segments: GroupParameter[]): TimeSegment {
        throw new Error("Method not implemented.");
    }

    start() {
        if(!this.source) {
            this.source = SegmentCollection.getInstance().toSequencedObservable();
            
            this.pauser = new Subject<boolean>();
            this.pauser.next(true);
            this.publication = this.pauser.switchMap( (paused: boolean) => (paused == true) ? Observable.never() : this.source );
        }
    
        this.subscribe = this.publication.subscribe( (value: number) => {
                console.log("--> "+value);
        });

        this.pauser.next(false);
    }
}

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

        if(len >= 1) {
            source = this.observables[0];

            for (let index = 1; index <= len-1; index++) {
                source = source.concat(this.observables[index]);
            }
        }

        return source;
    }

    push(segment:TimeSegment) {
        this.segments.push(segment);
        this.observables.push(segment.source);
    }
}

// simply a pass-thru function to group function...
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): GroupParameter {
    return {ctor, config};
} 

export class TimeSegment implements SegmentInterface {

    source: Observable<number>;

    constructor (public config: TimeConfig) {
        this.initializeObservable();
    }
    
    initializeObservable() {
        this.source = Observable.timer(0, 1000);
        this.source = this.source.map((value: number,index: number)=>{ 
            return index 
        }).takeWhile((index: number) => { return index < this.config.period/1000 } );
    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T {
        const segment:T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
        return segment;
    }

    group(intervals: number, ...segments: GroupParameter[]): TimeSegment {
        let segment: TimeSegment;

        for (let index = 0; index < intervals; index++) {
            for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
                const segType: GroupParameter = segments[segmentIndex];
                segment = new segType.ctor(segType.config);
                SegmentCollection.getInstance().push(segment);
            }
        }

        return segment;
    }
}
export class CountdownSegment extends TimeSegment {
    constructor (public config: TimeConfig) {
        super(config);
    }
}
export class CountupSegment extends TimeSegment {
    constructor (public config: TimeConfig) {
        super(config);
    }
}

const sequencer: Sequencer = new Sequencer({period: 1000});
sequencer.add(CountdownSegment, {period: 5000})
         .group(3, add(CountdownSegment, {period: 1000}), add(CountdownSegment, {period: 2000}))
         .add(CountupSegment, {period: 5000});

sequencer.start();

export default Sequencer;