//import {CountdownSegment, CountupSegment, add, Sequencer} from "./Sots";
import { CountdownSegment, CountupSegment, add } from "./Segments";
import { Sequencer } from "./Sequencer";
import { TimeEmission } from "./Interfaces";

// "S='warning' T<=3 && T>=0"
const sequencer: Sequencer = new Sequencer({ period: 1000 });
sequencer.add(CountdownSegment, { duration: 5000, states: ["S='beep', T==(3|2|1)"] })
    .group(3, add(CountdownSegment, { duration: 1000 }), add(CountdownSegment, { duration: 2000 }))
    .add(CountupSegment, { duration: 5000 });

sequencer.publish().subscribe((value: TimeEmission) => {
    let output: string;

    output = "time: " + value.time;
    output += " state: " + value.state;

    if (value.interval) {
        output += " interval.current: " + value.interval.current;
        output += " interval.total: " + value.interval.total;
    }

    console.log(output);
});
sequencer.start();