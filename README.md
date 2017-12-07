sots (Sequence of Time Segments) is a JS module that allows you to structure complex sequences of time segments.  By chaining sots' `add` and `group` methods, a complex sequence can be created with little development time on your end.  It's capable of being stateful relative to individual time segments, states can be momentary or non-momentary.  When setting states, you can use a string or a number type. And when it's a number you have the option to set sots' to use the Bitwise AND comparison operator.  This is beneficial if you're setting states using binary Enums.

When compiled, this module's JS files weighs-in around 20kBs, excluding RxJS from this estimate.

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
First, create an instance of Sequencer.  Here it is given a period of 1 second, which will program it to emit every second:
```typescript
let seq:Sequencer = new Sequencer({period:1000});
```

When building your sequence, the only two "build" methods are: `add` and `group`.  And the only two types of time segments are `CountdownSegment` and `CountupSegment`.  Here `CountdownSegment` is passed into `add` method with a span of 5 seconds:
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

This example's coalesced code:
```typescript
import {Sequencer, CountdownSegment, TimeEmission} from 'sots';

let seq:Sequencer = new Sequencer({period:1000});
seq.add(CountdownSegment, {duration:5000});
seq.subscribe((value:TimeEmission)=>{
   console.log(value);
});
seq.start();
```

## Examples
The following are links to examples using sots.

### Example 1
This example contains:
* `add` call with descending segment having an instant state named 'Started!'.
* `add` call with ascending segment having an instant state named 'Halfway'.
* A callback function subscribe for the completed notification that will output: 'play audible for completed'

See this example here: https://github.com/marckassay/sots/blob/master/example/example-1.ts


### Example 2
This example contains:
* Usage of binary Enum for states by setting the `compareAsBitwise` to true in sequencer config.  You can override sequencer's `compareAsBitwise` by setting `compareAsBitwise` on individual segments if needed.
* `omitFirst` being used to omit the first segment of the first interval in the group.  This is beneficial when using sots for an interval timer for physical activity.  When joining a descending segment typically used for "counting down" before the activity, a rest segment is typically followed.  It would be awkward to have 2 consecutive counting down segments before activity, thus you can omit it with `omitFirst` set to true.
* `add` call with descending time having an instant state and spread state.  Followed by,
* `group` call that creates intervals of its `add` methods being passed into it.  Followed by,
* `add` call with ascending time having an instant state and spread state.
* A callback function subscribe for the completed notification

See this example here: https://github.com/marckassay/sots/blob/master/example/example-2.ts

## Contribute
If you want to fork sots and give it a go, deploy 'sotsHarness' and 'sots.code-workspace' from the harness folder.
This will enable multi-root workspace (for VS Code) and provide a test harness.

In PowerShell, dot-source the following file in harness folder to move the contents for you:
```
$ . .\Set-MultiRootWorkspace.ps1
```
Afterwards for Windows, right-click on 'sots.code-workspace' and from the context menu open VS Code.

## Issues
Please add any feedback, concerns, requests and/or bugs in the 'Issues' section of this repository.