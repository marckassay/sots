import { Segment } from "./Sequencer";
import { TimeSegment, TimeConfig } from "./TimeSegment";

export interface CountupConfig extends TimeConfig {
    
}
export class CountupSegment extends TimeSegment {
    constructor(config:CountupConfig){
        super(config);
        
    }

    intialize():void {

    }
}