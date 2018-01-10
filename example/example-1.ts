import { Sequencer, CountdownSegment, CountupSegment, TimeEmission } from '../sots/dist/index';

const sequencer: Sequencer = new Sequencer({ period: 1000 });
sequencer.add(CountdownSegment, {
  duration: 3000,
  states: [
    { state: "Started!", timeAt: "3" }
  ]
})
  .add(CountupSegment, {
    duration: 3000,
    states: [
      { state: "Halfway", timeAt: "0" }
    ]
  });

sequencer.subscribe((value: TimeEmission) => {
  let output: string;

  output = "time: " + value.time;
  if (value.state) {

    if (value.state.valueOf("Started!")) {
      output += "<play audible for start>";
    }
    else if (value.state.valueOf("Halfway")) {
      output += "<play audible for halfway point>";
    }
  }
  console.log(output);
}, (error) => {
  console.error(error);
}, () => {
  console.log("<play audible for completed>");
});

sequencer.start();

/*
time: 3<play audible for start>
time: 2
time: 1
time: 0<play audible for halfway point>
time: 1
time: 2
<play audible for completed>
*/
