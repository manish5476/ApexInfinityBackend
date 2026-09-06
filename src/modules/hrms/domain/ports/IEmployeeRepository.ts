import { ITenantRepository } from '../../../../core/domain/IRepository';
import { Employee } from '../entities/Employee';

export interface IEmployeeRepository extends ITenantRepository<Employee, string> {
  findByCode(organizationId: string, code: string): Promise<Employee | null>;
  findByUserId(organizationId: string, userId: string): Promise<Employee | null>;
  findByEmail(organizationId: string, email: string): Promise<Employee | null>;
  findAll(organizationId: string, filter?: { departmentId?: string; designationId?: string; status?: string; branchId?: string; search?: string }): Promise<Employee[]>;
}
