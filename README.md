sots (Sequence of Time Segments) is a JS module that allows you to structure complex sequences of time segments with just a small amount of code.  It's capable of being stateful relative to indivdual time segments and a state can be momentary or non-momentary. 

When minifed this module weighs-in at just XX.X kb, as it has only RxJS as a dependency.

## Definitions
* instant (state):  these states are momentary, as they are emitted only at a specific instant in time.
* spread (state):  these states are non-momentary, as they spread by over time until termination of its time segment.
* duration: Is the length of a segment (in time).
* period: As defined the same as in RxJS; the unit of time between emissions defined in milliseconds.

## API (simplified)
```typescript
/*
    Initiates a sequence.

    constructor({period: number}): Sequencer must be instantiated with a value for period that is read in milliseconds.  This value becomes static and global to its segments.
    add(): adds a TimeSegment along with its config, that creates a single Observable and returns a TimeSegment.
    group(): multiply its combined add() invocations and returns a TimeSegment.
    start(): starts internal Observable to start emitting after the publish().subscribe() is called.
    pause(): pauses internal Observable from emitting.
    publish(): Returns an Observable that you call its subscribe method and afterwards the start() can be called to start emitting.
*/
class Sequencer implements SegmentInterface {
    constructor({period: number});
    add(type: TimeSegment, config: SegmentConfig): TimeSegment;
    group(intervals: number, add()): TimeSegment;
    start(): void;
    pause(): void;
    publish(): Observable<TimeEmission>;
}
```
```typescript
/*
    duration: The length of the segment represented in milliseconds.
    negate1st?: Nullifies this config's first segment.  This is ideal in a sequence enters into a group of sequences.  Such as, an interval timer used by an athlete; where the first segment in the group is considered a rest segment.
    states?: Creates a state for the segment. 
        {
            state: an arbitrary name that is validate for regex's word character meta sequence ([A-Za-z0-9_].).
            time[X]: Out of the variants, the only instant state is the 'timeAt', all others are 'spread' states.  'timeAt' property is a string of integers separated by commas.  Or a single integer.  All spread states timeLessX or timeGreatX, needs to be a single integer value.
        }
*/
interface SegmentConfig {
    duration: number;
    negate1st?: boolean;
    states?: Array< {state: string, timeAt: string} | 
                    {state: string, timeLessThan: string} | 
                    {state: string, timeLessThanOrEqualTo: string} | 
                    {state: string, timeGreaterThan: string} | 
                    {state: string, timeGreaterThanOrEqualTo: string} >;
}
```
```typescript
// see Sequencer's add()
add(type: <TimeSegment>, config: SegmentConfig): TimeSegment;
```
```typescript
// see Sequencer's group()
group(intervals: number, add()): TimeSegment;
```
```typescript
// One of the two time segments, which its time value will descend in value.
class CountdownSegment extends TimeSegment{
    constructor(config: SegmentConfig);
}
```
```typescript
// One of the two time segments, which its time value will ascend in value.
class CountupSegment extends TimeSegment{
    constructor(config: SegmentConfig);
}
```
```typescript
/*
    This is what is emitted from the internal Observable.

    time: expressed in seconds with precision to '1 thou' (.001)
    state: this is used to set a state(s). States are helpful rather than calculating time value every period to determine to do what ever needs to done during the sequence.
    interval: when group() is used, it will give value to this property to indicate what interval its on.  Helpful since group() iterates its segments any number of times.
*/
interface TimeEmission {
    time: number;
    state?: [{instant: string[], spread: string[]}];
    interval?: {current: number, total: number};
}
```
## Examples
This example instantiate a Sequencer by setting 1000 milliseconds for its period and a countdown time segment with a duration of 5 seconds.  In this CountdownSegment instance a spread and an instant state are defined; the spread state is for this example the object with timeLessThanOrEqualTo as a property.  And instant state being the one with timeAt as a property.
```typescript
const sequencer: Sequencer = new Sequencer({ period: 1000 });
sequencer.add(CountdownSegment, { duration: 5000, 
                                  states: [ {state: 'warning', timeLessThanOrEqualTo: "3"},
                                            {state: 'beep', timeAt: "2,1,0"} ]);

sequencer.publish().subscribe((value: TimeEmission) => {

    console.log("time: " + value.time);

    if(value.state){
        if(value.state.spread.indexOf('warning')) {
            // eg: indicate to UI that we are in warning state...
        }
        if(value.state.instant.indexOf('beep')) {
            // eg: execute 'beep' audible...
        }
    } }
    }
});
sequencer.start();
```

A typically sequence for an interval timer.  Where there is a sequence with a period of 100 milliseconds that begins with a countdown of 10 seconds.  This countdown is emitting a warning (spread) state from the beginning to end and it has instant state named 'beep' that is emitted at the 2,1 and 0 second.

Followed by that segment is a group of 2 segments that gets iterated 3 times.  The first segment of the first interval, is negated (removed).  It has a 10 second duration and its sibling segment has a 50 second duration.

The final segment could be used as a cooldown segment for an athlete. Here it is set for 10 minutes.
```typescript
const sequencer: Sequencer = new Sequencer({ period: 100 });
sequencer.add(CountdownSegment, { duration: 10000, 
                                  states: [{state: 'beep', timeAt: "2,1,0"},
                                           {state: 'warning', timeLessThanOrEqualTo: "5"}] })
         .group(10, add(CountdownSegment, { duration: 1000*10, negate1st: true }), add(CountdownSegment, { duration: 1000*50 }))
         .add(CountupSegment, { duration: 1000*60*10, 
                                states: [{state: 'beep', timeAt: "3,4,5"},
                                        {state: 'warning', timeGreaterThanOrEqualTo: "3"}] })

sequencer.publish().subscribe((value: TimeEmission) => {
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
```