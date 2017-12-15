import { TimeEmission } from './Emission';
import { PartialObserver } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';

export interface Subscribable {
    subscribe(): Subscription;
    subscribe(observer: PartialObserver<TimeEmission>): Subscription;
    subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription
}
