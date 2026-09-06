import { ITenantRepository } from '../../../../core/domain/IRepository';
import { EmployeeDocument } from '../entities/EmployeeDocument';

export interface IEmployeeDocumentRepository extends ITenantRepository<EmployeeDocument, string> {
  findByUser(organizationId: string, userId: string): Promise<EmployeeDocument[]>;
  findByEmployeeRef(organizationId: string, employeeRef: string): Promise<EmployeeDocument[]>;
  findAll(organizationId: string, filter?: { userId?: string; employeeRef?: string; documentType?: string; status?: string }): Promise<EmployeeDocument[]>;
}
