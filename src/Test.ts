//import {CountdownSegment, CountupSegment, add, Sequencer} from "./Sots";
import { CountdownSegment, CountupSegment, add } from "./Segments";
import { Sequencer } from "./Sequencer";
import { TimeEmission } from "./Interfaces";

const sequencer: Sequencer = new Sequencer({ period: 100 });
sequencer.add(CountdownSegment, { duration: 5000, 
                                  states: [{state: 'beep', timeAt: "2,1,0"},
                                           {state: 'warning', timeLessThanOrEqualTo: "5"}] })
         .group(3, add(CountdownSegment, { duration: 1000 }), add(CountdownSegment, { duration: 2000 }))
         .add(CountupSegment, { duration: 5000, 
                                states: [{state: 'beep', timeAt: "3,4,5"},
                                        {state: 'warning', timeGreaterThanOrEqualTo: "3"}] })

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