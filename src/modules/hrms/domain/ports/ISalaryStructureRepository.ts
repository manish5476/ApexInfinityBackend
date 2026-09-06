import { ITenantRepository } from '../../../../core/domain/IRepository';
import { SalaryStructure } from '../entities/SalaryStructure';

export interface ISalaryStructureRepository extends ITenantRepository<SalaryStructure, string> {
  findByUser(organizationId: string, userId: string): Promise<SalaryStructure | null>;
  findAll(organizationId: string, filter?: { status?: string; search?: string }): Promise<SalaryStructure[]>;
}
