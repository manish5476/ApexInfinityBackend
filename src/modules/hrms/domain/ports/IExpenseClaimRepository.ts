import { ITenantRepository } from '../../../../core/domain/IRepository';
import { ExpenseClaim } from '../entities/ExpenseClaim';

export interface IExpenseClaimRepository extends ITenantRepository<ExpenseClaim, string> {
  findByUser(organizationId: string, userId: string): Promise<ExpenseClaim[]>;
  findAll(organizationId: string, filter?: { userId?: string; status?: string; branchId?: string }): Promise<ExpenseClaim[]>;
}
