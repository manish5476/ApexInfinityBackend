import { ITenantRepository } from '../../../../core/domain/IRepository';
import { Department } from '../entities/Department';

export interface IDepartmentRepository extends ITenantRepository<Department, string> {
  findByCode(organizationId: string, code: string): Promise<Department | null>;
  findByParentId(organizationId: string, parentId?: string): Promise<Department[]>;
  findAll(organizationId: string, filter?: { isActive?: boolean; search?: string }): Promise<Department[]>;
}
