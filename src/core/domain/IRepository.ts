import { PaginationParams, PaginatedResult } from '../../shared/pagination';

/**
 * Universal Repository Port for Global Entities (e.g. Platform Settings, Organizations)
 */
export interface IRepository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<boolean>;
}

export interface TenantScopedId<TId> {
  organizationId: string;
  id: TId;
}

export interface TenantQueryCriteria {
  organizationId: string;
  filter?: Record<string, unknown>;
  pagination?: PaginationParams;
  sort?: { field: string; direction: 'asc' | 'desc' | 1 | -1 };
}

/**
 * Tenant-Aware Repository Port for Organization-Owned Entities
 * (e.g. Employee, Customer, Product, Invoice, Leave, Attendance).
 * Enforces explicit multi-tenancy in method signatures.
 */
export interface ITenantRepository<TEntity, TId> {
  findById(scope: TenantScopedId<TId>): Promise<TEntity | null>;
  find(query: TenantQueryCriteria): Promise<PaginatedResult<TEntity>>;
  save(entity: TEntity): Promise<TEntity>;
  delete(scope: TenantScopedId<TId>): Promise<boolean>;
  exists(scope: TenantScopedId<TId>): Promise<boolean>;
}
