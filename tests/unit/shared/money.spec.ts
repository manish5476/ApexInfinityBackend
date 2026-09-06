import { Money } from '../../../src/shared/value-objects/Money';
import { DomainError } from '../../../src/shared/errors';

describe('Money Value Object', () => {
  it('should store and compute monetary amounts using minor units without float drift', () => {
    // 0.1 + 0.2 in JS float is 0.30000000000000004
    const m1 = Money.fromMajor(0.1, 'USD');
    const m2 = Money.fromMajor(0.2, 'USD');
    const sum = m1.add(m2);

    expect(sum.amountInMinorUnits).toBe(30);
    expect(sum.toMajorUnits()).toBe(0.3);
  });

  it('should prevent currency mismatch operations', () => {
    const usd = Money.fromMajor(100, 'USD');
    const inr = Money.fromMajor(100, 'INR');

    expect(() => usd.add(inr)).toThrow(DomainError);
    expect(() => usd.subtract(inr)).toThrow(DomainError);
  });

  it('should multiply correctly by factor', () => {
    const price = Money.fromMajor(19.99, 'USD');
    const total = price.multiply(3); // 1999 * 3 = 5997 minor units

    expect(total.amountInMinorUnits).toBe(5997);
    expect(total.toMajorUnits()).toBe(59.97);
  });

  it('should format money properly', () => {
    const m = Money.fromMajor(1234.56, 'USD');
    const formatted = m.format('en-US');
    expect(formatted).toContain('1,234.56');
  });
});
