import { DomainError } from '../errors';

/**
 * Immutable TenantScope value object representing organization and branch tenancy boundaries.
 */
export class TenantScope {
  public readonly organizationId: string;
  public readonly branchId?: string;

  private constructor(organizationId: string, branchId?: string) {
    if (!organizationId || organizationId.trim().length === 0) {
      throw new DomainError('TenantScope requires a non-empty organizationId.');
    }
    this.organizationId = organizationId.trim();
    this.branchId = branchId ? branchId.trim() : undefined;
    Object.freeze(this);
  }

  public static create(organizationId: string, branchId?: string): TenantScope {
    return new TenantScope(organizationId, branchId);
  }

  public equals(other: TenantScope): boolean {
    return this.organizationId === other.organizationId && this.branchId === other.branchId;
  }
}
