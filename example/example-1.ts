import { Sequencer, CountdownSegment, TimeEmission, add } from '../lib';

let sequencer: Sequencer = new Sequencer({ period: 1000 });
sequencer.add(CountdownSegment, {
    duration: 5000,
    states: [
        { state: 'warning', timeLessThanOrEqualTo: "3" },
        { state: 'beep', timeAt: "2,1," }
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