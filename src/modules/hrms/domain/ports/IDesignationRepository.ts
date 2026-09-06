import { ITenantRepository } from '../../../../core/domain/IRepository';
import { Designation } from '../entities/Designation';

export interface IDesignationRepository extends ITenantRepository<Designation, string> {
  findByCode(organizationId: string, code: string): Promise<Designation | null>;
  findByDepartmentId(organizationId: string, departmentId: string): Promise<Designation[]>;
  findAll(organizationId: string, filter?: { departmentId?: string; isActive?: boolean; search?: string }): Promise<Designation[]>;
}
