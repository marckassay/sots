import { TimeEmission } from './Emission';
import { Observer } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';

export interface Subscribable {

    
    subscribe(observer: Observer<TimeEmission>): Subscription;
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription;
    subscribe(nextOrObserver: any, error?: (error: any) => void, complete?: () => void): Subscription; 
}
