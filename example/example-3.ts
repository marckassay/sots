import { Sequencer, CountdownSegment, CountupSegment, TimeEmission, add } from '../sots/dist/index';
import { Observer } from '../sots/node_modules/rxjs/Observer';

enum AppStates {
    Beep = 2,
    Warning = 4,
    Rest = 8,
    Active = 16,
    Alert = AppStates.Beep + AppStates.Warning
}

let observer: Observer<TimeEmission> = {
    next: (value: TimeEmission): void => {
        let output: string = "time: " + value.time;

        if (value.inStateOf(AppStates.Alert)) {
            output += " state: 'alert!'";
        }
        else if (value.inStateOf(AppStates.Warning)) {
            output += " state: 'warning'";
        }
        else if (value.inStateOf(AppStates.Beep)) {
            output += " state: 'beep'";
        }

        if (value.inStateOf(AppStates.Rest)) {
            output += " state: 'rest'";
        }
        else if (value.inStateOf(AppStates.Active)) {
            output += " state: 'active'";
        }

        if (value.interval) {
            output += " interval.current: " + value.interval.current;
            output += " interval.total: " + value.interval.total;
        }

        console.log(output);
    },
    error: (error: any): void => {
        console.error(error);
    },
    complete: (): void => {
        console.log("Play final beep!");
    }
}

const sequencer: Sequencer = new Sequencer({ period: 100, compareAsBitwise: true });
sequencer.add(CountdownSegment, {
    duration: 10000,
    states: [
        { state: AppStates.Beep, timeAt: "10,2,1" },
        { state: AppStates.Warning, timeLessThanOrEqualTo: "5" }
    ]
})
    .group(3,
    add(CountdownSegment, {
        duration: 1000 * 2,
        omitFirst: true,
        states: [
            { state: AppStates.Rest, timeLessThanOrEqualTo: "2" },
            { state: AppStates.Beep, timeAt: "2" }
        ]
    }),
    add(CountdownSegment, {
        duration: 1000 * 2,
        states: [
            { state: AppStates.Active, timeLessThanOrEqualTo: "2" },
            { state: AppStates.Beep, timeAt: "2" }
        ]
    })
    )
    .add(CountupSegment, {
        duration: 5000,
        states: [
            { state: AppStates.Beep, timeAt: "0,3,4" },
            { state: AppStates.Warning, timeGreaterThanOrEqualTo: "3" }]
    });

sequencer.subscribe(observer);

setTimeout(() => {
    sequencer.start();
    console.log("started!");
}, 3000);
setTimeout(() => {
    sequencer.pause();
    console.log("pausing for 3 seconds until reset.");
}, 6000);
setTimeout(() => {
    sequencer.reset();
    console.log("reset completed.  restarting in 3 seconds.");
}, 9000);
setTimeout(() => {
    sequencer.start();
    console.log("(re)started!");
}, 12000);

// Output:
/*
$ node .\index.js
started!
time: 10 state: 'beep'
time: 9.9
time: 9.8
time: 9.7
time: 9.6
time: 9.5
time: 9.4
time: 9.3
time: 9.2
time: 9.1
time: 9
time: 8.9
time: 8.8
time: 8.7
time: 8.6
time: 8.5
time: 8.4
time: 8.3
time: 8.2
time: 8.1
time: 8
time: 7.9
time: 7.8
time: 7.7
time: 7.6
time: 7.5
time: 7.4
time: 7.3
time: 7.2
pausing for 3 seconds until reset.
reset completed.  restarting in 3 seconds.
(re)started!
time: 10 state: 'beep'
time: 9.9
time: 9.8
time: 9.7
time: 9.6
time: 9.5
time: 9.4
time: 9.3
time: 9.2
time: 9.1
time: 9
time: 8.9
time: 8.8
time: 8.7
time: 8.6
time: 8.5
time: 8.4
time: 8.3
time: 8.2
time: 8.1
time: 8
time: 7.9
time: 7.8
time: 7.7
time: 7.6
time: 7.5
time: 7.4
time: 7.3
time: 7.2
time: 7.1
time: 7
time: 6.9
time: 6.8
time: 6.7
time: 6.6
time: 6.5
time: 6.4
time: 6.3
time: 6.2
time: 6.1
time: 6
time: 5.9
time: 5.8
time: 5.7
time: 5.6
time: 5.5
time: 5.4
time: 5.3
time: 5.2
time: 5.1
time: 5 state: 'warning'
time: 4.9 state: 'warning'
time: 4.8 state: 'warning'
time: 4.7 state: 'warning'
time: 4.6 state: 'warning'
time: 4.5 state: 'warning'
time: 4.4 state: 'warning'
time: 4.3 state: 'warning'
time: 4.2 state: 'warning'
time: 4.1 state: 'warning'
time: 4 state: 'warning'
time: 3.9 state: 'warning'
time: 3.8 state: 'warning'
time: 3.7 state: 'warning'
time: 3.6 state: 'warning'
time: 3.5 state: 'warning'
time: 3.4 state: 'warning'
time: 3.3 state: 'warning'
time: 3.2 state: 'warning'
time: 3.1 state: 'warning'
time: 3 state: 'warning'
time: 2.9 state: 'warning'
time: 2.8 state: 'warning'
time: 2.7 state: 'warning'
time: 2.6 state: 'warning'
time: 2.5 state: 'warning'
time: 2.4 state: 'warning'
time: 2.3 state: 'warning'
time: 2.2 state: 'warning'
time: 2.1 state: 'warning'
time: 2 state: 'alert!'
time: 1.9 state: 'warning'
time: 1.8 state: 'warning'
time: 1.7 state: 'warning'
time: 1.6 state: 'warning'
time: 1.5 state: 'warning'
time: 1.4 state: 'warning'
time: 1.3 state: 'warning'
time: 1.2 state: 'warning'
time: 1.1 state: 'warning'
time: 1 state: 'alert!'
time: 0.9 state: 'warning'
time: 0.8 state: 'warning'
time: 0.7 state: 'warning'
time: 0.6 state: 'warning'
time: 0.5 state: 'warning'
time: 0.4 state: 'warning'
time: 0.3 state: 'warning'
time: 0.2 state: 'warning'
time: 0.1 state: 'warning'
time: 2 state: 'beep' state: 'active' interval.current: 1 interval.total: 3
time: 1.9 state: 'active' interval.current: 1 interval.total: 3
time: 1.8 state: 'active' interval.current: 1 interval.total: 3
time: 1.7 state: 'active' interval.current: 1 interval.total: 3
time: 1.6 state: 'active' interval.current: 1 interval.total: 3
time: 1.5 state: 'active' interval.current: 1 interval.total: 3
time: 1.4 state: 'active' interval.current: 1 interval.total: 3
time: 1.3 state: 'active' interval.current: 1 interval.total: 3
time: 1.2 state: 'active' interval.current: 1 interval.total: 3
time: 1.1 state: 'active' interval.current: 1 interval.total: 3
time: 1 state: 'active' interval.current: 1 interval.total: 3
time: 0.9 state: 'active' interval.current: 1 interval.total: 3
time: 0.8 state: 'active' interval.current: 1 interval.total: 3
time: 0.7 state: 'active' interval.current: 1 interval.total: 3
time: 0.6 state: 'active' interval.current: 1 interval.total: 3
time: 0.5 state: 'active' interval.current: 1 interval.total: 3
time: 0.4 state: 'active' interval.current: 1 interval.total: 3
time: 0.3 state: 'active' interval.current: 1 interval.total: 3
time: 0.2 state: 'active' interval.current: 1 interval.total: 3
time: 0.1 state: 'active' interval.current: 1 interval.total: 3
time: 2 state: 'beep' state: 'rest' interval.current: 2 interval.total: 3
time: 1.9 state: 'rest' interval.current: 2 interval.total: 3
time: 1.8 state: 'rest' interval.current: 2 interval.total: 3
time: 1.7 state: 'rest' interval.current: 2 interval.total: 3
time: 1.6 state: 'rest' interval.current: 2 interval.total: 3
time: 1.5 state: 'rest' interval.current: 2 interval.total: 3
time: 1.4 state: 'rest' interval.current: 2 interval.total: 3
time: 1.3 state: 'rest' interval.current: 2 interval.total: 3
time: 1.2 state: 'rest' interval.current: 2 interval.total: 3
time: 1.1 state: 'rest' interval.current: 2 interval.total: 3
time: 1 state: 'rest' interval.current: 2 interval.total: 3
time: 0.9 state: 'rest' interval.current: 2 interval.total: 3
time: 0.8 state: 'rest' interval.current: 2 interval.total: 3
time: 0.7 state: 'rest' interval.current: 2 interval.total: 3
time: 0.6 state: 'rest' interval.current: 2 interval.total: 3
time: 0.5 state: 'rest' interval.current: 2 interval.total: 3
time: 0.4 state: 'rest' interval.current: 2 interval.total: 3
time: 0.3 state: 'rest' interval.current: 2 interval.total: 3
time: 0.2 state: 'rest' interval.current: 2 interval.total: 3
time: 0.1 state: 'rest' interval.current: 2 interval.total: 3
time: 2 state: 'beep' state: 'active' interval.current: 2 interval.total: 3
time: 1.9 state: 'active' interval.current: 2 interval.total: 3
time: 1.8 state: 'active' interval.current: 2 interval.total: 3
time: 1.7 state: 'active' interval.current: 2 interval.total: 3
time: 1.6 state: 'active' interval.current: 2 interval.total: 3
time: 1.5 state: 'active' interval.current: 2 interval.total: 3
time: 1.4 state: 'active' interval.current: 2 interval.total: 3
time: 1.3 state: 'active' interval.current: 2 interval.total: 3
time: 1.2 state: 'active' interval.current: 2 interval.total: 3
time: 1.1 state: 'active' interval.current: 2 interval.total: 3
time: 1 state: 'active' interval.current: 2 interval.total: 3
time: 0.9 state: 'active' interval.current: 2 interval.total: 3
time: 0.8 state: 'active' interval.current: 2 interval.total: 3
time: 0.7 state: 'active' interval.current: 2 interval.total: 3
time: 0.6 state: 'active' interval.current: 2 interval.total: 3
time: 0.5 state: 'active' interval.current: 2 interval.total: 3
time: 0.4 state: 'active' interval.current: 2 interval.total: 3
time: 0.3 state: 'active' interval.current: 2 interval.total: 3
time: 0.2 state: 'active' interval.current: 2 interval.total: 3
time: 0.1 state: 'active' interval.current: 2 interval.total: 3
time: 2 state: 'beep' state: 'rest' interval.current: 3 interval.total: 3
time: 1.9 state: 'rest' interval.current: 3 interval.total: 3
time: 1.8 state: 'rest' interval.current: 3 interval.total: 3
time: 1.7 state: 'rest' interval.current: 3 interval.total: 3
time: 1.6 state: 'rest' interval.current: 3 interval.total: 3
time: 1.5 state: 'rest' interval.current: 3 interval.total: 3
time: 1.4 state: 'rest' interval.current: 3 interval.total: 3
time: 1.3 state: 'rest' interval.current: 3 interval.total: 3
time: 1.2 state: 'rest' interval.current: 3 interval.total: 3
time: 1.1 state: 'rest' interval.current: 3 interval.total: 3
time: 1 state: 'rest' interval.current: 3 interval.total: 3
time: 0.9 state: 'rest' interval.current: 3 interval.total: 3
time: 0.8 state: 'rest' interval.current: 3 interval.total: 3
time: 0.7 state: 'rest' interval.current: 3 interval.total: 3
time: 0.6 state: 'rest' interval.current: 3 interval.total: 3
time: 0.5 state: 'rest' interval.current: 3 interval.total: 3
time: 0.4 state: 'rest' interval.current: 3 interval.total: 3
time: 0.3 state: 'rest' interval.current: 3 interval.total: 3
time: 0.2 state: 'rest' interval.current: 3 interval.total: 3
time: 0.1 state: 'rest' interval.current: 3 interval.total: 3
time: 2 state: 'beep' state: 'active' interval.current: 3 interval.total: 3
time: 1.9 state: 'active' interval.current: 3 interval.total: 3
time: 1.8 state: 'active' interval.current: 3 interval.total: 3
time: 1.7 state: 'active' interval.current: 3 interval.total: 3
time: 1.6 state: 'active' interval.current: 3 interval.total: 3
time: 1.5 state: 'active' interval.current: 3 interval.total: 3
time: 1.4 state: 'active' interval.current: 3 interval.total: 3
time: 1.3 state: 'active' interval.current: 3 interval.total: 3
time: 1.2 state: 'active' interval.current: 3 interval.total: 3
time: 1.1 state: 'active' interval.current: 3 interval.total: 3
time: 1 state: 'active' interval.current: 3 interval.total: 3
time: 0.9 state: 'active' interval.current: 3 interval.total: 3
time: 0.8 state: 'active' interval.current: 3 interval.total: 3
time: 0.7 state: 'active' interval.current: 3 interval.total: 3
time: 0.6 state: 'active' interval.current: 3 interval.total: 3
time: 0.5 state: 'active' interval.current: 3 interval.total: 3
time: 0.4 state: 'active' interval.current: 3 interval.total: 3
time: 0.3 state: 'active' interval.current: 3 interval.total: 3
time: 0.2 state: 'active' interval.current: 3 interval.total: 3
time: 0.1 state: 'active' interval.current: 3 interval.total: 3
time: 0 state: 'beep'
time: 0.1
time: 0.2
time: 0.3
time: 0.4
time: 0.5
time: 0.6
time: 0.7
time: 0.8
time: 0.9
time: 1
time: 1.1
time: 1.2
time: 1.3
time: 1.4
time: 1.5
time: 1.6
time: 1.7
time: 1.8
time: 1.9
time: 2
time: 2.1
time: 2.2
time: 2.3
time: 2.4
time: 2.5
time: 2.6
time: 2.7
time: 2.8
time: 2.9
time: 3 state: 'alert!'
time: 3.1 state: 'warning'
time: 3.2 state: 'warning'
time: 3.3 state: 'warning'
time: 3.4 state: 'warning'
time: 3.5 state: 'warning'
time: 3.6 state: 'warning'
time: 3.7 state: 'warning'
time: 3.8 state: 'warning'
time: 3.9 state: 'warning'
time: 4 state: 'alert!'
time: 4.1 state: 'warning'
time: 4.2 state: 'warning'
time: 4.3 state: 'warning'
time: 4.4 state: 'warning'
time: 4.5 state: 'warning'
time: 4.6 state: 'warning'
time: 4.7 state: 'warning'
time: 4.8 state: 'warning'
time: 4.9 state: 'warning'
Play final beep!
*/