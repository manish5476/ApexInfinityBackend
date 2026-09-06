import { ITenantRepository } from '../../../../core/domain/IRepository';
import { Payslip } from '../entities/Payslip';

export interface IPayslipRepository extends ITenantRepository<Payslip, string> {
  findByUserAndPeriod(organizationId: string, userId: string, month: number, year: number): Promise<Payslip | null>;
  findByUser(organizationId: string, userId: string): Promise<Payslip[]>;
  findAll(organizationId: string, filter?: { userId?: string; month?: number; year?: number; status?: string }): Promise<Payslip[]>;
  saveMany(payslips: Payslip[]): Promise<void>;
}
