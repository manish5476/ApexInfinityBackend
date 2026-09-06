import { DomainError } from '../errors';

/**
 * Validated, normalized EmailAddress value object.
 */
export class EmailAddress {
  public readonly value: string;

  private static readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  private constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!EmailAddress.EMAIL_REGEX.test(normalized)) {
      throw new DomainError(`Invalid email address format: '${value}'`);
    }
    this.value = normalized;
    Object.freeze(this);
  }

  public static create(value: string): EmailAddress {
    return new EmailAddress(value);
  }

  public equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
