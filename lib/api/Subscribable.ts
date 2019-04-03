import { PartialObserver, Subscription } from 'rxjs';
import { TimeEmission } from './Emission';

export interface Subscribable {
  subscribe(): Subscription;
  subscribe(observer: PartialObserver<TimeEmission>): Subscription;
  subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription
}
