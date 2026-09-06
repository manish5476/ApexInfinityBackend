import { ITenantRepository } from '../../../../core/domain/IRepository';
import { LeaveBalance } from '../entities/LeaveBalance';

export interface ILeaveBalanceRepository extends ITenantRepository<LeaveBalance, string> {
  findByUserAndYear(organizationId: string, userId: string, financialYear: string): Promise<LeaveBalance | null>;
  findAll(organizationId: string, filter?: { financialYear?: string; branchId?: string }): Promise<LeaveBalance[]>;
  saveMany(balances: LeaveBalance[]): Promise<void>;
}
