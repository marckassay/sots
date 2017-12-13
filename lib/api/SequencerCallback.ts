import { TimeEmission } from "./Emission";

export interface SequencerCallback {
    next?(value: TimeEmission): void;
    error?(error: any): void;
    complete?(): void;
}