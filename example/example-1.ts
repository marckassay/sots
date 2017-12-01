import {Sequencer, CountdownSegment, TimeEmission, add} from '../lib/index';

let sequencer: Sequencer = new Sequencer({ period: 1000 });
sequencer.add(CountdownSegment, { duration: 5000, states: [{ state: 'warning', timeLessThanOrEqualTo: "3"},
                                                            {state: 'beep', timeAt: "2,1,0"}
                                                            ]} );

sequencer.subscribe((value: TimeEmission) => {

    console.log("time: " + value.time);

    if(value.state){
        if(value.state.spread && value.state.spread.indexOf('warning')) {
            // eg: indicate to UI that we are in warning state...
        }
        if(value.state.instant && value.state.instant.indexOf('beep')) {
            // eg: execute 'beep' audible...
        }
    } 
});
sequencer.start();