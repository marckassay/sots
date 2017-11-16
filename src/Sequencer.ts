import { CountdownSegment, CountdownConfig } from "./CountdownSegment";
import { CountupSegment, CountupConfig } from "./CountupSegment";
import { TimeConfig } from "./TimeSegment";

export enum UnitOfPeriod {
    millisecond = 1,
    decisecond = 100,
    second = 1000,
    minute = 60000,
    hour = 3600000
}



export interface CtorInterface {
    new (config: TimeConfig): Segment;
}
export interface Segment {
    intialize();
}
export interface SegmentInterface {
    add(ctor: CtorInterface, config: TimeConfig): Segment;
}

export interface GroupInterface extends SegmentInterface{
    group(config: object, ...a: Function[]): SegmentInterface;
}

export interface SequencerConfig {
    // defaults to millisecond, which has a value of 1.  
    // this is the base unit of time for Sequencer (and RxJS).
    // this value is used for RxJS period parameter
    period: UnitOfPeriod;
}

export class Sequencer implements GroupInterface {
    constructor (public config: SequencerConfig) {
        
    }

    add(ctor: CtorInterface, config: TimeConfig): Segment {
        return new ctor(config);
    }

    group(config, ...a: Function[]): SegmentInterface {
        // TODO: need to look into Array methods such as map and forEach
        //return this.add(ctor, config);
        //a.forEach()
        //forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;
        return ;
    }
}

// usage:
/*
let sequence = new Sequencer({period: UnitOfPeriod.decisecond});
sequence.add(CountdownSegment, 10)
        .group( add(CountdownSegment, 50), add(CountdownSegment, 10), 12)
        .add(CountupSegment);

sequence.start();
*/