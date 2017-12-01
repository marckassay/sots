sots (Sequence of Time Segments) is a JS module that allows you to structure complex sequences of time segments with just a small amount of code.  It's capable of being stateful relative to indivdual time segments and a state can be momentary or non-momentary. 

When compiled, this module's JS files weighs-in around 16kBs, excluding RxJS from this estimate.

## Install
### npm
```bash
npm install sots
```
link: [npmjs.com/package/sots](https://www.npmjs.com/package/sots)

### yarn
```bash
yarn add sots
```
link: [yarnpkg.com/en/package/sots](https://yarnpkg.com/en/package/sots)

## Definitions
* instant (state): These states are momentary, as they are emitted only at a specific instant in time.
* spread (state): These states are non-momentary, as they "spread" over time until termination of its time segment.
* duration: Defines the length of a segment (in time).
* period: As defined the same as in RxJS; the unit of time between emissions defined in milliseconds.

## Explanation of Basic Usage
First, create an instance of Sequencer.  Here it is given a period of 1 second:
```typescript
let seq:Sequencer = new Sequencer({period:1000});
```

When building your sequence, the only two "build" methods are: `add` and `group`.  And the only two types of segments are `CountdownSegment` and `CountupSegment`.  Here `CountdownSegment` is passed into `add` method with a span of 5 seconds:
```typescript
seq.add(CountdownSegment, {duration:5000});
```

Now we can subscribe and perform a `start` call:
```typescript
seq.subscribe((value:TimeEmission)=>{
    console.log(value);
});
seq.start();
```

The following is the coalesced code:
```typescript
import {Sequencer, CountdownSegment, TimeEmission, add} from 'sots';

let seq:Sequencer = new Sequencer({period:1000});
seq.add(CountdownSegment, {duration:5000});
seq.subscribe((value:TimeEmission)=>{
    console.log(value);
});
seq.start();
```
See this demo in JS here: https://runkit.com/marckassay/sots-demo-1

## Examples
The following are links to examples using sots.

### Example 1
This example contains: 
* `add` call with descending time having an instant state and spread state.

See this example here: https://github.com/marckassay/sots/blob/master/example/example-1.ts

### Example 2
This example contains: 
* `add` call with descending time having an instant state and spread state.  Followed by,
* `group` call that creates intervals of its `add` methods being passed into it.  Followed by,
* `add` call with ascending time having an instant state and spread state.

See this example here: https://github.com/marckassay/sots/blob/master/example/example-2.ts

## Issues
 Please add any feedback, concerns, requests and/or bugs in the 'Issues' section of this repository.