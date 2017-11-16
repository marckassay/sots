import { Observable } from 'rxjs/Rx';
import { Segment } from './Sequencer';
import { TimeSegment, TimeConfig } from './TimeSegment';

export interface State {

}

export interface CountdownConfig extends TimeConfig{
    period: number;
    state: string;
}

export class CountdownSegment extends TimeSegment {
    constructor(config: CountdownConfig) {
        super(config);

    }

    intialize():void {
        
    }
    /*
    instantiateTimer() {
        this.source = Observable.timer(0, this.config.period);
        .map( (x) => this.countdown(x) )
        .takeWhile((x: ) => {return x.timelinePosition < this.timelineMaxLimit});
    }
    */
}