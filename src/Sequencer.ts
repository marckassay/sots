export interface SequencerConfig {
    period: number;
    expression: string;
}
export class Sequencer {
    constructor (public config: SequencerConfig) {
        
    }
}