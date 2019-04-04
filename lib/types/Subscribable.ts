import { PartialObserver, Subscription } from 'rxjs';
import { ITimeEmission } from './Emission';

export interface ISubscribable {
  subscribe(observer?: PartialObserver<ITimeEmission>): Subscription;
  subscribe(next?: (value: ITimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription;
}
