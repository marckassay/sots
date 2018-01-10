"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("../sots/dist/index");
var sequencer = new index_1.Sequencer({ period: 100 });
sequencer.add(index_1.CountdownSegment, {
  duration: 10000,
  states: [
    { state: 'beep', timeAt: "10,2,1" },
    { state: 'warning', timeLessThanOrEqualTo: "5" }
  ]
})
  .group(3, index_1.add(index_1.CountdownSegment, { duration: 1000 * 2, omitFirst: true }), index_1.add(index_1.CountdownSegment, { duration: 1000 * 2 }))
  .add(index_1.CountupSegment, {
    duration: 5000,
    states: [{ state: 'beep', timeAt: "3,4" },
    { state: 'warning', timeGreaterThanOrEqualTo: "3" }]
  });
sequencer.subscribe(function (value) {
  var output;
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
}, function (error) {
  console.error(error);
}, function () {
  console.log("Play final beep!");
});
sequencer.start();
//# sourceMappingURL=index.js.map
