import { Sequencer, CountdownSegment, CountupSegment, TimeEmission, add } from '../lib';

const sequencer: Sequencer = new Sequencer({ period: 100 });
sequencer.add(CountdownSegment, {
    duration: 10000,
    states: [
        { state: 'beep', timeAt: "10,2,1" },
        { state: 'warning', timeLessThanOrEqualTo: "5" }
    ]
    })
    .group(3, add(CountdownSegment, { duration: 1000 * 2, omitFirst: true }), add(CountdownSegment, { duration: 1000 * 2 }))
    .add(CountupSegment, {
        duration: 5000,
        states: [{ state: 'beep', timeAt: "3,4" },
        { state: 'warning', timeGreaterThanOrEqualTo: "3" }]
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