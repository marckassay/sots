sots (Sequence of Time Segments) is a JS module that allows you to structure complex sequences of time segments.  By chaining sots' `add` and `group` methods, a complex sequence can be created with little development time on your end.

sots is capable of being stateful relative to individual time segments, states can be momentary or non-momentary.  When setting states, you can use a string or a number type. And when its a number type you have the option to set sots' to use the Bitwise AND comparison operator.  This is beneficial, if for instance, you're setting states using binary Enums.

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

## Explanation of Basic Usage
First, create an instance of Sequencer.  Here it is given a period of 1 second, which will program it to emit every second:
```typescript
let seq: Sequencer = new Sequencer({ period: 1000 });
```

When building your sequence, the only two "build" methods are: `add` and `group`.  And the only two types of time segments are `CountdownSegment` and `CountupSegment`.  Here `CountdownSegment` is passed into `add` method with a span of 5 seconds:
```typescript
seq.add(CountdownSegment, { duration: 5000 });
```

Now we can subscribe and perform a `start` call:
```typescript
seq.subscribe((value: TimeEmission) => {
  console.log(value);
});
seq.start();
```

This example's coalesced code:
```typescript
let seq: Sequencer = new Sequencer({ period: 1000 });
seq.add(CountdownSegment, { duration: 5000 });
seq.subscribe((value: TimeEmission) => {
  console.log(value);
});
seq.start();
```

## Definitions
* instant (state): 
These states are momentary, as they are emitted only at a specific instant in time.  The time value needs to be defined in units of a second.  A value can have a modulo operator prefixed in the form of (`mod[n]` or `%[n]`) that will be applied to its segment.  See Example 3 on how this is used.

* spread (state): 
These states are non-momentary, as they "spread" over time until termination of its time segment.  The time value needs to be defined in units of a second. 

* duration: 
Defines the length of a segment defined in milliseconds. 

* period: 
As defined the same as in RxJS; the unit of time between emissions defined in milliseconds.

## API
The 2 build methods for creating a sequence are the following:
* `add<T extends TimeSegment>(ctor: SegmentType<T>, config: SegmentConfigShape): T` 
 The first parameter can only take: CountdownSegment or CountupSegment class type.  The second parameter configures this segment's duration, to be used with bitwise operator, states, and a flag to indicate to be omitted in first interval.  In addition to this method, there is a static version of this that's identical.  This static version is used inside `group` parentheses. 

* `group<T extends TimeSegment>(intervals?: number, ...segments: GroupParameter<T>[]): T` 
 Used to create groups, a.k.a intervals.  The first parameter specifies the number of intervals and the second takes static calls of `add`.  See `add` API for more information.

The 3 control methods for iterating a sots' sequence, are the following:
* `start(): void` 
Starts sequence or if sots is paused will resume sequence.

* `pause(): void` 
Pauses the running sequence.  Since this has idempotent behavior, a call to `start` is needed to restart/resume the sequence.

* `reset(): void` 
Can only be used if `subscribe` has been called with an observer.  This method will unsubscribe and subscribe the sequence.  See Example 3 on how this is being used.

The only method (2 overloads) for subscribing to a sots' sequence, are the following:
* `subscribe(next?: (value: TimeEmission) => void, error?: (error: any) => void, complete?: () => void): Subscription` 
In order to make observations of sots' emissions, this is needed to be called.  See 'Explanation of Basic Usage' section on how this is called with value for its `next` parameter.

* `subscribe(observer: PartialObserver<TimeEmission>): Subscription` 
Used when a sequence will be needed to reset.  The `observer` parameter must have the same shape as `PartialObserver<TimeEmission>`.  See Example 3 on how this is used.

The emitted value (TimeEmission) has 1 property method:
* `valueOf: (state?: string | number, compareAsBitwise?: boolean) => boolean | number` 
When called with a value for state, this method will return a boolean value of true if found.  If this method is called with no value, then all numeric states totaled for this emission will be returned.  See Example 3 on how this is used both with and without arguments.

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
* A shape of `PartialObserver<TimeEmission>` is passed in `subscribe` since in this example resetting is performed.
* This example is also using `valueOf` with and without arguments.
* The `mod` (modulo) operator is being used in the first segement to have an instant state of AppStates.Beep be applied to every whole second.

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