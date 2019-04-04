import { PartialObserver } from 'rxjs';
import { CountupSegment, ITimeEmission, Sequencer } from 'sots';

enum AppStates {
  Beep = 2,
  Active = 4,
  Alert = AppStates.Active + AppStates.Beep,
}

const observer: PartialObserver<ITimeEmission> = {
  next: (value: ITimeEmission): void => {
    let output: string = 'time: ' + value.time;

    if (value.state) {
      output += ' valueOf: ' + value.state.valueOf();
      if (value.state.valueOf(AppStates.Alert)) {
        output += ' state: \'alert!\'';
      } else if (value.state.valueOf(AppStates.Active)) {
        output += ' state: \'active\'';
      } else if (value.state.valueOf(AppStates.Beep)) {
        output += ' state: \'beep\'';
      }
    }

    console.log(output);
  },
  error: (error: any): void => {
    console.error(error);
  },
};

const sequencer: Sequencer = new Sequencer({ period: 1000, compareAsBitwise: true });
sequencer.add(CountupSegment, {
  duration: Number.MAX_SAFE_INTEGER,
  states: [
    { state: AppStates.Active, timeGreaterThan: '0' },
    { state: AppStates.Beep, timeAt: 'mod15' },
    { state: AppStates.Beep, timeAt: 'mod30' },
    { state: AppStates.Beep, timeAt: 'mod60' },
  ],
});
sequencer.subscribe(observer);
sequencer.start();

// Output:
/*
time: 0 valueOf: 2 state: 'beep'
time: 1 valueOf: 4 state: 'active'
time: 2 valueOf: 4 state: 'active'
time: 3 valueOf: 4 state: 'active'
time: 4 valueOf: 4 state: 'active'
time: 5 valueOf: 4 state: 'active'
time: 6 valueOf: 4 state: 'active'
time: 7 valueOf: 4 state: 'active'
time: 8 valueOf: 4 state: 'active'
time: 9 valueOf: 4 state: 'active'
time: 10 valueOf: 4 state: 'active'
time: 11 valueOf: 4 state: 'active'
time: 12 valueOf: 4 state: 'active'
time: 13 valueOf: 4 state: 'active'
time: 14 valueOf: 4 state: 'active'
time: 15 valueOf: 6 state: 'alert!'
time: 16 valueOf: 4 state: 'active'
time: 17 valueOf: 4 state: 'active'
time: 18 valueOf: 4 state: 'active'
time: 19 valueOf: 4 state: 'active'
time: 20 valueOf: 4 state: 'active'
time: 21 valueOf: 4 state: 'active'
time: 22 valueOf: 4 state: 'active'
time: 23 valueOf: 4 state: 'active'
time: 24 valueOf: 4 state: 'active'
time: 25 valueOf: 4 state: 'active'
time: 26 valueOf: 4 state: 'active'
time: 27 valueOf: 4 state: 'active'
time: 28 valueOf: 4 state: 'active'
time: 29 valueOf: 4 state: 'active'
time: 30 valueOf: 6 state: 'alert!'
time: 31 valueOf: 4 state: 'active'
time: 32 valueOf: 4 state: 'active'
time: 33 valueOf: 4 state: 'active'
time: 34 valueOf: 4 state: 'active'
time: 35 valueOf: 4 state: 'active'
time: 36 valueOf: 4 state: 'active'
time: 37 valueOf: 4 state: 'active'
time: 38 valueOf: 4 state: 'active'
time: 39 valueOf: 4 state: 'active'
time: 40 valueOf: 4 state: 'active'
time: 41 valueOf: 4 state: 'active'
time: 42 valueOf: 4 state: 'active'
time: 43 valueOf: 4 state: 'active'
time: 44 valueOf: 4 state: 'active'
time: 45 valueOf: 6 state: 'alert!'
time: 46 valueOf: 4 state: 'active'
time: 47 valueOf: 4 state: 'active'
time: 48 valueOf: 4 state: 'active'
time: 49 valueOf: 4 state: 'active'
time: 50 valueOf: 4 state: 'active'
time: 51 valueOf: 4 state: 'active'
time: 52 valueOf: 4 state: 'active'
time: 53 valueOf: 4 state: 'active'
time: 54 valueOf: 4 state: 'active'
time: 55 valueOf: 4 state: 'active'
time: 56 valueOf: 4 state: 'active'
time: 57 valueOf: 4 state: 'active'
time: 58 valueOf: 4 state: 'active'
time: 59 valueOf: 4 state: 'active'
time: 60 valueOf: 6 state: 'alert!'
time: 61 valueOf: 4 state: 'active'
time: 62 valueOf: 4 state: 'active'
time: 63 valueOf: 4 state: 'active'
...
*/
