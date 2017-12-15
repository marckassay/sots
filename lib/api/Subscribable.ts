import { TimeEmission } from './Emission';
import { Observer } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';

export interface Subscribable {
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(observer: Observer<TimeEmission>): Subscription;
    //subscribe(): Subscription;
}