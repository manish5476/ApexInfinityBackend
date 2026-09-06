import { DomainError } from '../errors';

/**
 * Immutable Money value object.
 * Stores monetary amounts in integer minor currency units (e.g. cents/paise)
 * to prevent IEEE-754 floating-point drift.
 */
export class Money {
  public readonly amountInMinorUnits: number;
  public readonly currency: string;

  private constructor(amountInMinorUnits: number, currency: string) {
    if (!Number.isInteger(amountInMinorUnits)) {
      throw new DomainError(`Money amount in minor units must be an integer. Received: ${amountInMinorUnits}`);
    }
    if (!currency || currency.trim().length !== 3) {
      throw new DomainError(`Money currency must be a 3-letter ISO code. Received: '${currency}'`);
    }

    this.amountInMinorUnits = amountInMinorUnits;
    this.currency = currency.toUpperCase().trim();
    Object.freeze(this);
  }

  public static fromMinor(amountInMinorUnits: number, currency = 'USD'): Money {
    return new Money(Math.round(amountInMinorUnits), currency);
  }

  public static fromMajor(amountInMajorUnits: number, currency = 'USD'): Money {
    const minor = Math.round(amountInMajorUnits * 100);
    return new Money(minor, currency);
  }

  public static zero(currency = 'USD'): Money {
    return new Money(0, currency);
  }

  public toMajorUnits(): number {
    return this.amountInMinorUnits / 100;
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountInMinorUnits + other.amountInMinorUnits, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.amountInMinorUnits - other.amountInMinorUnits, this.currency);
  }

  public multiply(multiplier: number): Money {
    return new Money(Math.round(this.amountInMinorUnits * multiplier), this.currency);
  }

  public equals(other: Money): boolean {
    return this.amountInMinorUnits === other.amountInMinorUnits && this.currency === other.currency;
  }

  public isPositive(): boolean {
    return this.amountInMinorUnits > 0;
  }

  public isNegative(): boolean {
    return this.amountInMinorUnits < 0;
  }

  public isZero(): boolean {
    return this.amountInMinorUnits === 0;
  }

  public format(locale = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this.currency,
    }).format(this.toMajorUnits());
  }

  private assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new DomainError(
        `Cannot perform currency operation between mismatched currencies: '${this.currency}' and '${other.currency}'.`
      );
    }
  }
}
