import {Sequencer, CountdownSegment, CountupSegment, TimeEmission, add} from 'sots';

const sequencer: Sequencer = new Sequencer({ period: 100 });
sequencer.add(CountdownSegment, { duration: 10000, 
                                  states: [{state: 'beep', timeAt: "2,1,0"},
                                           {state: 'warning', timeLessThanOrEqualTo: "5"}] })
         .group(3, add(CountdownSegment, { duration: 1000*2, omitFirst: true }), add(CountdownSegment, { duration: 1000*2 }))
         .add(CountupSegment, { duration: 5000, 
                                states: [{state: 'beep', timeAt: "3,4,5"},
                                        {state: 'warning', timeGreaterThanOrEqualTo: "3"}] });

sequencer.subscribe((value: TimeEmission) => {
    let output: string;

    output = "time: " + value.time;
    if(value.state){
        if(value.state.instant) {
            output += " state.instant: " + value.state.instant.toString();
        }
        if(value.state.spread) {
            output += " state.spread: " + value.state.spread.toString();
        }
    }

    if (value.interval) {
        output += " interval.current: " + value.interval.current;
        output += " interval.total: " + value.interval.total;
    }

    console.log(output);
});

sequencer.start();