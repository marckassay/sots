import { Sequencer, CountdownSegment, CountupSegment, TimeEmission, add } from '../lib';

const sequencer: Sequencer = new Sequencer({ period: 100 });
sequencer.add(CountdownSegment, {
    duration: 10000,
    states: [
        { state: 'beep', timeAt: "10,2,1" },
        { state: 'warning', timeLessThanOrEqualTo: "5" }
    ]
});

sequencer.subscribe((value: TimeEmission) => {
    let output: string;

    output = "time: " + value.time;
    if (value.state) {
        output += " state.instant: " + value.state.instant.toString();
        output += " state.spread: " + value.state.spread.toString();
    }

    if (value.interval) {
        output += " interval.current: " + value.interval.current;
        output += " interval.total: " + value.interval.total;
    }
    console.log(output);
}, (error) => {
    console.error(error);
}, () => {
    console.log("Play final beep!");
});

sequencer.start();

// Output from console.log():
/**
time: 10 state.instant: beep state.spread:
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
time: 5 state.instant:  state.spread: warning
time: 4.9 state.instant:  state.spread: warning
time: 4.8 state.instant:  state.spread: warning
time: 4.7 state.instant:  state.spread: warning
time: 4.6 state.instant:  state.spread: warning
time: 4.5 state.instant:  state.spread: warning
time: 4.4 state.instant:  state.spread: warning
time: 4.3 state.instant:  state.spread: warning
time: 4.2 state.instant:  state.spread: warning
time: 4.1 state.instant:  state.spread: warning
time: 4 state.instant:  state.spread: warning
time: 3.9 state.instant:  state.spread: warning
time: 3.8 state.instant:  state.spread: warning
time: 3.7 state.instant:  state.spread: warning
time: 3.6 state.instant:  state.spread: warning
time: 3.5 state.instant:  state.spread: warning
time: 3.4 state.instant:  state.spread: warning
time: 3.3 state.instant:  state.spread: warning
time: 3.2 state.instant:  state.spread: warning
time: 3.1 state.instant:  state.spread: warning
time: 3 state.instant:  state.spread: warning
time: 2.9 state.instant:  state.spread: warning
time: 2.8 state.instant:  state.spread: warning
time: 2.7 state.instant:  state.spread: warning
time: 2.6 state.instant:  state.spread: warning
time: 2.5 state.instant:  state.spread: warning
time: 2.4 state.instant:  state.spread: warning
time: 2.3 state.instant:  state.spread: warning
time: 2.2 state.instant:  state.spread: warning
time: 2.1 state.instant:  state.spread: warning
time: 2 state.instant: beep state.spread: warning
time: 1.9 state.instant:  state.spread: warning
time: 1.8 state.instant:  state.spread: warning
time: 1.7 state.instant:  state.spread: warning
time: 1.6 state.instant:  state.spread: warning
time: 1.5 state.instant:  state.spread: warning
time: 1.4 state.instant:  state.spread: warning
time: 1.3 state.instant:  state.spread: warning
time: 1.2 state.instant:  state.spread: warning
time: 1.1 state.instant:  state.spread: warning
time: 1 state.instant: beep state.spread: warning
time: 0.9 state.instant:  state.spread: warning
time: 0.8 state.instant:  state.spread: warning
time: 0.7 state.instant:  state.spread: warning
time: 0.6 state.instant:  state.spread: warning
time: 0.5 state.instant:  state.spread: warning
time: 0.4 state.instant:  state.spread: warning
time: 0.3 state.instant:  state.spread: warning
time: 0.2 state.instant:  state.spread: warning
time: 0.1 state.instant:  state.spread: warning
Play final beep!
 */