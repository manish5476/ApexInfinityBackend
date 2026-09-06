import { Result } from '../../../src/shared/result';

describe('Result<T, E>', () => {
  it('should create a successful Result with a value', () => {
    const result = Result.ok<string>('hello world');
    expect(result.isSuccess).toBe(true);
    expect(result.isFailure).toBe(false);
    expect(result.getValue()).toBe('hello world');
  });

  it('should create a failed Result with an error', () => {
    const err = new Error('Something went wrong');
    const result = Result.fail<string, Error>(err);
    expect(result.isSuccess).toBe(false);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBe(err);
  });

  it('should throw when accessing getValue on a failed Result', () => {
    const result = Result.fail(new Error('failure'));
    expect(() => result.getValue()).toThrow();
  });

  it('should throw when accessing getError on a successful Result', () => {
    const result = Result.ok('success');
    expect(() => result.getError()).toThrow();
  });

  it('should combine multiple results, returning the first failure', () => {
    const r1 = Result.ok(1);
    const r2 = Result.fail(new Error('error in r2'));
    const r3 = Result.fail(new Error('error in r3'));

    const combined = Result.combine([r1, r2, r3]);
    expect(combined.isFailure).toBe(true);
    expect((combined.getError() as Error).message).toBe('error in r2');
  });

  it('should combine all successful results into a void success', () => {
    const r1 = Result.ok(1);
    const r2 = Result.ok(2);
    const combined = Result.combine([r1, r2]);
    expect(combined.isSuccess).toBe(true);
  });
});
