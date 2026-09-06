/**
 * Result pattern representing either success with a value or failure with an error.
 * Enables explicit failure handling without unhandled runtime exceptions.
 */
export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  public getValue(): T {
    if (!this.isSuccess) {
      throw new Error(`Cannot retrieve value from a failed Result: ${JSON.stringify(this._error)}`);
    }
    return this._value as T;
  }

  public getError(): E {
    if (this.isSuccess) {
      throw new Error('Cannot retrieve error from a successful Result.');
    }
    return this._error as E;
  }

  public static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  public static void<E = Error>(): Result<void, E> {
    return new Result<void, E>(true, undefined, undefined);
  }

  public static fail<T = void, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  public static combine(results: Result<unknown, unknown>[]): Result<void, unknown> {
    for (const res of results) {
      if (res.isFailure) {
        return Result.fail(res.getError());
      }
    }
    return Result.void();
  }
}
