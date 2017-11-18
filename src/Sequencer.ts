import { Observable, Subject } from 'rxjs/Rx';
import { ArrayObservable } from 'rxjs/observable/ArrayObservable';

export interface TimeConfig {
    period: number;
}

// static-side interface
export interface SegmentType<T extends TimeSegment> {
    new (config: TimeConfig): T;
}

export interface SegmentInterface {
    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T;
} 

export class Sequencer implements SegmentInterface {
    pauser: Subject<boolean>;
    publication: Observable<number>;
    source: Observable<number>;
    
    constructor (public config: TimeConfig) {

    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T {
         const segment:T = new ctor(config);
         SegmentCollection.getInstance().push(segment);
         return segment;
    }

    start() {
        if(!this.source) {
            this.source = ArrayObservable.create( SegmentCollection.getInstance().getObservables() ).concatAll();

            this.pauser = new Subject<boolean>();
            this.pauser.next(true);
            this.publication = this.pauser.switchMap( (paused: boolean) => (paused == true) ? Observable.never() : this.source );
            const subscribe = this.publication.subscribe( (value: number)  => console.log(value));
        }
    }
}
export default Sequencer;

export class SegmentCollection {
    private static instance: SegmentCollection;

    segments: Array<TimeSegment>;
    observables: Array<Observable<number>>;

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

    getObservables(): Array<Observable<number>> {
        return this.observables;
    }

    push(segment:TimeSegment) {
        this.segments.push(segment);
        this.observables.push(segment.source);
    }
}
/* 
export function add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T {
    return new ctor(config);
} 
*/
export class TimeSegment implements SegmentInterface {
    source: Observable<number>;

    constructor (public config: TimeConfig) {
        this.initializeObservable();
    }
    
    initializeObservable() {
        this.source = Observable.timer(0, this.config.period)
                                .map((value: number,index: number)=>{ return index })
                                .takeWhile((index: number) => { return index < this.config.period } );
    }

    add<T extends TimeSegment>(ctor: SegmentType<T>, config: TimeConfig): T {
        const segment:T = new ctor(config);
        SegmentCollection.getInstance().push(segment);
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
sequencer.add(CountdownSegment, {period: 3000})
         .add(CountupSegment, {period: 2000});

sequencer.start();