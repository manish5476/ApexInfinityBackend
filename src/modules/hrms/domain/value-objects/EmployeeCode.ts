import { DomainError } from '../../../../shared/errors';

export class EmployeeCode {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(code: string): EmployeeCode {
    if (!code || typeof code !== 'string') {
      throw new DomainError('Employee code is required.');
    }

    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 2 || trimmed.length > 30) {
      throw new DomainError('Employee code must be between 2 and 30 characters.');
    }

    if (!/^[A-Z0-9_-]+$/.test(trimmed)) {
      throw new DomainError('Employee code can only contain letters, numbers, hyphens, and underscores.');
    }

    return new EmployeeCode(trimmed);
  }

  public get value(): string {
    return this._value;
  }

  public equals(other?: EmployeeCode): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
