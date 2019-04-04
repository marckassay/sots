import { StateEmission } from './StateEmission';
import { ISegmentConfigShape, ISequenceConfigShape } from './types/Segment';
import { StateConfig1, StateConfig2, StateConfig3, StateConfig4, StateConfig5 } from './types/StateConfigs';

export class StateExpression {
  // holds instant and spread states that the user defined.
  private instantEmissions: Map<number, StateEmission>;
  // when a state is "spread", this map accumalates such emissions
  // until segment terminates.
  private spreadEmissions: Map<number, StateEmission>;
  // this map simply holds all mod states of the segment.  this will
  // need to be check every time the seq emits.
  private moduloInstantEmissions: Map<number, string | number>;

  constructor(public config: ISegmentConfigShape, public seqConfig: ISequenceConfigShape, public countingUp: boolean) {
    this.instantEmissions = new Map<number, StateEmission>();
    this.spreadEmissions = new Map<number, StateEmission>();
    this.moduloInstantEmissions = new Map<number, string | number>();
    this.parse(config);
  }

  public getStateEmission(time: number): StateEmission | undefined {
    let emissions: StateEmission | undefined;
    emissions = this.instantEmissions.get(time);
    // determine if any moduloInstantEmissions apply to this moment in time
    this.moduloInstantEmissions.forEach((value: string | number, key: number): void => {
      /// const timeFloat: number = (typeof value === 'string') ? parseFloat(value) : value;
      if (time % key === 0) {
        if (!emissions) {
          emissions = new StateEmission(this.seqConfig.compareAsBitwise, new Set([value]));
        } else {
          emissions.instant.add(value);
        }
      }
    });
    // get keys greater-equal or lesser-equal in value of time, then add to emissions
    this.spreadEmissions.forEach((value: StateEmission, key: number): void => {
      if ((!this.countingUp) ? key >= time : key <= time) {
        if (!emissions) {
          emissions = new StateEmission(this.seqConfig.compareAsBitwise, undefined, value.spread);
        } else {
          emissions.mapToSpread(value.spread);
        }
      }
    });
    return emissions;
  }

  private parse(config: ISegmentConfigShape): void {
    if (config.states) {
      const states: Array<StateConfig1 |
        StateConfig2 |
        StateConfig3 |
        StateConfig4 |
        StateConfig5> = config.states;
      const statesLength: number = states.length;
      for (let index = 0; index < statesLength; index++) {
        for (const property in states[index]) {
          const state: string | number = states[index].state;
          switch (property) {
            case 'timeAt':
              this.setInstantStates((states[index] as StateConfig1).timeAt, state);
              break;
            case 'timeLessThan':
              const lessThan = parseFloat((states[index] as StateConfig2).timeLessThan);
              const lessThanComputedValue: number = lessThan - (this.seqConfig.period * .001);
              this.setSpreadState(lessThanComputedValue, state);
              break;
            case 'timeLessThanOrEqualTo':
              const lessThanOrEqual = parseFloat((states[index] as StateConfig3).timeLessThanOrEqualTo);
              this.setSpreadState(lessThanOrEqual, state);
              break;
            case 'timeGreaterThan':
              const greaterThan = parseFloat((states[index] as StateConfig4).timeGreaterThan);
              const greaterThanComputedValue = greaterThan + (this.seqConfig.period * .001);
              this.setSpreadState(greaterThanComputedValue, state);
              break;
            case 'timeGreaterThanOrEqualTo':
              const greaterThanOrEqualRaw = (states[index] as StateConfig5).timeGreaterThanOrEqualTo;
              const greaterThanOrEqual = parseFloat(greaterThanOrEqualRaw);
              this.setSpreadState(greaterThanOrEqual, state);
              break;
          }
        }
      }
    }
  }

  private setInstantStates(times: string, state: string | number): void {
    const excludeCommaExpression: RegExp = /[^,]+/g;
    const moduloExpression: RegExp = /(mod\s*|%\s*)\d+/;
    const results: RegExpMatchArray | null = times.match(excludeCommaExpression);
    const insertInstantState = (value: number): void => {
      if (!this.instantEmissions.has(value)) {
        this.instantEmissions.set(value, new StateEmission(this.seqConfig.compareAsBitwise, new Set([state])));
      } else {
        this.instantEmissions.get(value)!.instant.add(state);
      }
    };
    if (results) {
      results.map((value: string) => {
        if (value.search(moduloExpression) === -1) {
          const time: number = parseFloat(value);
          insertInstantState(time);
        } else {
          const modTime: number = parseInt(value.match(/\d+/)![0]);
          if (!this.moduloInstantEmissions.has(modTime)) {
            this.moduloInstantEmissions.set(modTime, state);
          } else {
            const currentValue: string | number = this.moduloInstantEmissions.get(modTime)!;
            this.moduloInstantEmissions.set(modTime, currentValue + ',' + state);
          }
        }
      });
    }
  }

  private setSpreadState(time: number, state: string | number): void {
    if (!this.spreadEmissions.has(time)) {
      this.spreadEmissions.set(
        time, new StateEmission(this.seqConfig.compareAsBitwise, undefined, new Set([state]))
      );
    } else {
      this.spreadEmissions.get(time)!.spread.add(state);
    }
  }
}
