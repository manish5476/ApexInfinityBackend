import { v4 as uuidv4 } from 'uuid';
import { DomainError } from '../../../../shared/errors';

export class UserId {
  public readonly value: string;

  constructor(value?: string) {
    if (value !== undefined) {
      if (!value || value.trim().length === 0) {
        throw new DomainError('UserId cannot be empty.');
      }
      this.value = value.trim();
    } else {
      this.value = uuidv4();
    }
    Object.freeze(this);
  }

  public equals(other?: UserId): boolean {
    if (!other) return false;
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
