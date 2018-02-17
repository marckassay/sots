import { SequenceConfigShape } from './api/Segment';

export class StateEmission implements StateEmission {
  instant: Set<string | number>;
  spread: Set<string | number>;

  constructor(public compareAsBitwise?: boolean, instant: Set<string | number> = new Set<string | number>(),
    spread: Set<string | number> = new Set<string | number>()) {
    this.instant = instant;
    this.spread = spread;
  }

  valueOf(state?: string | number, compareAsBitwise?: boolean): boolean | number {
    let results: boolean | number;
    if (state !== undefined) {
      results = (this.getStateValues(state, compareAsBitwise) > 0);
    } else {
      results = this.getStateValues(-1, true);
    }
    console.log('-' + this.spread.size)
    return results;
  }

  mapToSpread(value: Set<string | number>) {
    value.forEach(val => this.spread.add(val))
  }

  private getStateValues(state: string | number, compareAsBitwise?: boolean): number {
    let useBitwiseCompare: boolean;

    if (compareAsBitwise != undefined) {
      useBitwiseCompare = compareAsBitwise;
    }
    else if (this.compareAsBitwise != undefined) {
      useBitwiseCompare = this.compareAsBitwise;
    }
    else {
      useBitwiseCompare = false;
    }

    if (useBitwiseCompare === false) {
      // here returning numbers (1,0) and not boolean to conform to this method's return type
      if (this.instant.has(state) === false) {
        return (this.spread.has(state) ? 1 : 0);
      } else {
        return 1;
      }
    } else if (typeof state === 'string') {
      throw "valueOf() has been called with a string and flagged to use bitwise comparisons."
    } else {
      let total: number = 0;
      this.instant.forEach((value: string | number) => {
        if (typeof value === 'number') {
          total += value;
        }
      }, total);

      this.spread.forEach((value: string | number) => {
        if (typeof value === 'number') {
          total += value;
        }
      }, total);

      if (state === -1) {
        return total;
      } else {
        return ((total & state) === state) ? 1 : -1;
      }
    }
  }
}
