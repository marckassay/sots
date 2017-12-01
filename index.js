var sot = require("./dist/index");
var seq = new sot.Sequencer({period:1000});
seq.add(sot.CountdownSegment, {duration: 4000});
seq.subscribe((value)=>{
    console.log(value);
});
seq.start();