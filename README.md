sots (Sequence of Time Segments) is a JS module that allows you to structure complex sequences of time segments.  By chaining sots' `add` and `group` methods, a complex sequence can be created with little development time on your end.

sots is capable of being stateful relative to individual time segments, states can be momentary or non-momentary.  When setting states, you can use a string or a number type. And when its a number type you have the option to set sots' to use the Bitwise AND comparison operator.  This is beneficial if you're setting states using binary Enums.

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
* instant (state): These states are momentary, as they are emitted only at a specific instant in time.  The time value needs to be defined in units of a second.
* spread (state): These states are non-momentary, as they "spread" over time until termination of its time segment.  The time value needs to be defined in units of a second.
* duration: Defines the length of a segment defined in milliseconds.
* period: As defined the same as in RxJS; the unit of time between emissions defined in milliseconds.

## API
The 3 control methods for iterating a sots' sequence, are the following:
* `start(): void`  
Starts sequence or if sots is paused will resume sequence.

* `pause(): void`  
Pauses the running sequence.  Since this has idempotent behavior, a call to `start()` is needed to restart/resume the sequence.

* `reset(): void`  
Can only be used if `subscribeWith()` has been called since a callback instance is needed.  This method will unsubscribe and subscribe the sequence again.

The 2 methods for subscribing to a sots' sequence, are the following:
* `subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription`  
In order to make observations of sots' emissions, this is needed to be called or `subscribeWith()`.  See 'Explanation of Basic Usage' section on how this is called with value for its `next` parameter.

* `subscribeWith(callback: SequencerCallback): Subscription`  
Used when a sequence will be needed to reset.  The `callback` parameter must be an instance the implements `SequencerCallback`.  See example-3 on how this is used.

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
The following are links to examples using sots.  These examples will run as-is if copied-and-pasted into the index.ts file of sotsHarness folder *if* that folder is setup as explained in the 'Contribute' section.

### Example 1
This example contains:
* `add` call with descending segment having an instant state named 'Started!'.
* `add` call with ascending segment having an instant state named 'Halfway'.
* A callback function subscribe for the completed notification that will output: 'play audible for completed'

See this example here: https://github.com/marckassay/sots/blob/master/example/example-1.ts


### Example 2
This example contains:
* Usage of binary Enum for states by setting the `compareAsBitwise` to `true` in sequencer config.  You can override sequencer's `compareAsBitwise` by setting `compareAsBitwise` on individual segments if needed.
* `omitFirst` being used to omit the first segment of the first interval in the group.  This is beneficial when using sots for an interval timer for physical activity.  When joining a descending segment typically used for to "count down" before the activity, a rest segment is typically followed.  It would be awkward to have 2 consecutive counting down segments before activity, thus you can omit it with `omitFirst` set to `true`.
* `add` call with descending time having an instant state and spread state.  Followed by,
* `group` call that creates intervals of its `add` methods being passed into it.  Followed by,
* `add` call with ascending time having an instant state and spread state.
* A callback function subscribe for the completed notification

See this example here: https://github.com/marckassay/sots/blob/master/example/example-2.ts


### Example 3
This example is derived from example 2 and in an addition demonstrates the usage of control methods:
* The JS `setTimeout` will be used to call the following methods in sequential order: `start`, `pause`, `reset`, and `start` .
* `ExampleCallback` that implements `SequencerCallback` is used in this example since resetting is performed.

See this example here: https://github.com/marckassay/sots/blob/master/example/example-3.ts

## Contribute
If you want to fork sots and give it a go, deploy 'sotsHarness' and 'sots.code-workspace' from the harness folder into the parent directory of sots.
This will enable: multi-root workspace (for VS Code) with tasks and a debug launch configuration, and provide a test harness.  Any example files can be copied-and-pasted into index.ts file of 'sotsHarness'.

In PowerShell, dot-source the following file in harness folder to move the contents for you:
```
$ . .\Set-MultiRootWorkspace.ps1
```
Afterwards for Windows, right-click on 'sots.code-workspace' and from the context menu open VS Code.

### Issues
Please add any feedback, concerns, requests and/or bugs in the 'Issues' section of this repository.