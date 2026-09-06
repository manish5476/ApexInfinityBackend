import { IPayslipRepository } from '../../domain/ports/IPayslipRepository';
import { ISalaryStructureRepository } from '../../domain/ports/ISalaryStructureRepository';
import { IExpenseClaimRepository } from '../../domain/ports/IExpenseClaimRepository';
import { IEmployeeRepository } from '../../domain/ports/IEmployeeRepository';

import { Payslip } from '../../domain/entities/Payslip';
import { SalaryStructure } from '../../domain/entities/SalaryStructure';
import { ExpenseClaim } from '../../domain/entities/ExpenseClaim';

import { PayslipMapper } from '../mappers/PayslipMapper';
import { SalaryStructureMapper } from '../mappers/SalaryStructureMapper';
import { ExpenseClaimMapper } from '../mappers/ExpenseClaimMapper';

import { NotFoundError } from '../../../../shared/errors';

export class PayrollAndExpensesUseCases {
  constructor(
    private readonly payslipRepo: IPayslipRepository,
    private readonly payslipMapper: PayslipMapper,
    private readonly salaryStructureRepo: ISalaryStructureRepository,
    private readonly salaryStructureMapper: SalaryStructureMapper,
    private readonly expenseClaimRepo: IExpenseClaimRepository,
    private readonly expenseClaimMapper: ExpenseClaimMapper,
    private readonly employeeRepo?: IEmployeeRepository
  ) {}

  // ====================================================
  // 1. PAYROLL & PAYSLIPS
  // ====================================================

  public async createPayrollRun(
    organizationId: string,
    params: { month: number; year: number; branchId?: string; userIds?: string[] }
  ): Promise<{ runId: string; generatedPayslips: number; payslips: any[] }> {
    const employees = this.employeeRepo
      ? await this.employeeRepo.findAll(organizationId, { status: 'active', branchId: params.branchId })
      : [];

    const targetUsers = params.userIds || employees.filter((e) => e.userId).map((e) => e.userId!);
    const createdList: Payslip[] = [];

    const periodStart = new Date(params.year, params.month - 1, 1);
    const periodEnd = new Date(params.year, params.month, 0);

    for (const userId of targetUsers) {
      const existing = await this.payslipRepo.findByUserAndPeriod(organizationId, userId, params.month, params.year);
      if (existing) continue;

      const struct = await this.salaryStructureRepo.findByUser(organizationId, userId);
      const earnings = struct
        ? struct.components.filter((c) => c.category === 'earning' || c.category === 'benefit').map((c) => ({
            code: c.code,
            name: c.name,
            amount: c.amount,
            taxable: c.taxable,
          }))
        : [{ code: 'BASIC', name: 'Basic Salary', amount: 30000, taxable: true }];

      const deductions = struct
        ? struct.components.filter((c) => c.category === 'deduction').map((c) => ({
            code: c.code,
            name: c.name,
            amount: c.amount,
            taxable: c.taxable,
          }))
        : [{ code: 'PF', name: 'Provident Fund', amount: 1800, taxable: false }];

      const payslip = Payslip.create({
        organizationId,
        branchId: params.branchId,
        userId,
        salaryStructureId: struct?.id,
        month: params.month,
        year: params.year,
        periodStart,
        periodEnd,
        earnings,
        deductions,
      });

      await this.payslipRepo.save(payslip);
      createdList.push(payslip);
    }

    return {
      runId: `RUN-${params.year}${String(params.month).padStart(2, '0')}`,
      generatedPayslips: createdList.length,
      payslips: createdList.map((p) => this.payslipMapper.toDto(p)),
    };
  }

  public async bulkUpdatePayslipsStatus(
    organizationId: string,
    payslipIds: string[],
    status: any
  ): Promise<{ updatedCount: number }> {
    let count = 0;
    for (const id of payslipIds) {
      const p = await this.payslipRepo.findById({ id, organizationId });
      if (p) {
        p.updateStatus(status);
        await this.payslipRepo.save(p);
        count++;
      }
    }
    return { updatedCount: count };
  }

  public async getMyPayslips(organizationId: string, userId: string): Promise<any[]> {
    const list = await this.payslipRepo.findByUser(organizationId, userId);
    return list.map((p) => this.payslipMapper.toDto(p));
  }

  public async listPayslips(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.payslipRepo.findAll(organizationId, filter);
    return list.map((p) => this.payslipMapper.toDto(p));
  }

  public async getPayslipById(organizationId: string, id: string): Promise<any> {
    const payslip = await this.payslipRepo.findById({ id, organizationId });
    if (!payslip) throw new NotFoundError('Payslip', id);
    return this.payslipMapper.toDto(payslip);
  }

  public async updatePayslip(organizationId: string, id: string, params: { status?: any; paymentMode?: any; referenceNo?: string }): Promise<any> {
    const payslip = await this.payslipRepo.findById({ id, organizationId });
    if (!payslip) throw new NotFoundError('Payslip', id);

    if (params.status === 'paid' && params.paymentMode) {
      payslip.markAsPaid(params.paymentMode, params.referenceNo);
    } else if (params.status) {
      payslip.updateStatus(params.status);
    }

    await this.payslipRepo.save(payslip);
    return this.payslipMapper.toDto(payslip);
  }

  // ====================================================
  // 2. SALARY STRUCTURES
  // ====================================================

  public async createSalaryStructure(organizationId: string, params: any): Promise<any> {
    const struct = SalaryStructure.create({ organizationId, ...params });
    await this.salaryStructureRepo.save(struct);
    return this.salaryStructureMapper.toDto(struct);
  }

  public async listSalaryStructures(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.salaryStructureRepo.findAll(organizationId, filter);
    return list.map((s) => this.salaryStructureMapper.toDto(s));
  }

  public async getSalaryStructureById(organizationId: string, id: string): Promise<any> {
    const struct = await this.salaryStructureRepo.findById({ id, organizationId });
    if (!struct) throw new NotFoundError('SalaryStructure', id);
    return this.salaryStructureMapper.toDto(struct);
  }

  public async updateSalaryStructure(organizationId: string, id: string, params: any): Promise<any> {
    const struct = await this.salaryStructureRepo.findById({ id, organizationId });
    if (!struct) throw new NotFoundError('SalaryStructure', id);

    struct.updateDetails(params);
    if (params.status === 'active') struct.activate();
    if (params.status === 'archived') struct.archive();

    await this.salaryStructureRepo.save(struct);
    return this.salaryStructureMapper.toDto(struct);
  }

  public async deleteSalaryStructure(organizationId: string, id: string): Promise<void> {
    const struct = await this.salaryStructureRepo.findById({ id, organizationId });
    if (!struct) throw new NotFoundError('SalaryStructure', id);
    await this.salaryStructureRepo.delete({ id, organizationId });
  }

  // ====================================================
  // 3. EXPENSE CLAIMS
  // ====================================================

  public async createExpenseClaim(organizationId: string, params: any): Promise<any> {
    const claim = ExpenseClaim.create({ organizationId, ...params });
    if (params.submitNow) claim.submit();
    await this.expenseClaimRepo.save(claim);
    return this.expenseClaimMapper.toDto(claim);
  }

  public async listExpenseClaims(organizationId: string, filter?: any): Promise<any[]> {
    const list = await this.expenseClaimRepo.findAll(organizationId, filter);
    return list.map((c) => this.expenseClaimMapper.toDto(c));
  }

  public async getExpenseClaimById(organizationId: string, id: string): Promise<any> {
    const claim = await this.expenseClaimRepo.findById({ id, organizationId });
    if (!claim) throw new NotFoundError('ExpenseClaim', id);
    return this.expenseClaimMapper.toDto(claim);
  }

  public async updateExpenseClaim(organizationId: string, id: string, params: any): Promise<any> {
    const claim = await this.expenseClaimRepo.findById({ id, organizationId });
    if (!claim) throw new NotFoundError('ExpenseClaim', id);

    claim.updateDetails(params);
    if (params.submit) claim.submit();

    await this.expenseClaimRepo.save(claim);
    return this.expenseClaimMapper.toDto(claim);
  }

  public async deleteExpenseClaim(organizationId: string, id: string): Promise<void> {
    const claim = await this.expenseClaimRepo.findById({ id, organizationId });
    if (!claim) throw new NotFoundError('ExpenseClaim', id);
    await this.expenseClaimRepo.delete({ id, organizationId });
  }

  public async approveExpenseClaim(organizationId: string, id: string, approverId: string, approvedAmount?: number, comments?: string): Promise<any> {
    const claim = await this.expenseClaimRepo.findById({ id, organizationId });
    if (!claim) throw new NotFoundError('ExpenseClaim', id);

    claim.approve(approverId, approvedAmount, comments);
    await this.expenseClaimRepo.save(claim);
    return this.expenseClaimMapper.toDto(claim);
  }

  public async rejectExpenseClaim(organizationId: string, id: string, approverId: string, comments?: string): Promise<any> {
    const claim = await this.expenseClaimRepo.findById({ id, organizationId });
    if (!claim) throw new NotFoundError('ExpenseClaim', id);

    claim.reject(approverId, comments);
    await this.expenseClaimRepo.save(claim);
    return this.expenseClaimMapper.toDto(claim);
  }
}
