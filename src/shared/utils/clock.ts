export interface IClock {
  now(): Date;
  nowIso(): string;
  nowEpoch(): number;
}

export class SystemClock implements IClock {
  public now(): Date {
    return new Date();
  }

  public nowIso(): string {
    return new Date().toISOString();
  }

  public nowEpoch(): number {
    return Date.now();
  }
}

/**
 * Deterministic Clock for automated tests.
 */
export class FrozenClock implements IClock {
  private frozenDate: Date;

  constructor(date: Date = new Date()) {
    this.frozenDate = new Date(date);
  }

  public setDate(date: Date): void {
    this.frozenDate = new Date(date);
  }

  public advance(ms: number): void {
    this.frozenDate = new Date(this.frozenDate.getTime() + ms);
  }

  public now(): Date {
    return new Date(this.frozenDate);
  }

  public nowIso(): string {
    return this.frozenDate.toISOString();
  }

  public nowEpoch(): number {
    return this.frozenDate.getTime();
  }
}
