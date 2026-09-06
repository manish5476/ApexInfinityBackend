import { PayrollAndExpensesUseCases } from '../../../../src/modules/hrms/application/use-cases/PayrollAndExpensesUseCases';
import { InMemoryPayslipRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryPayslipRepository';
import { InMemorySalaryStructureRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemorySalaryStructureRepository';
import { InMemoryExpenseClaimRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryExpenseClaimRepository';
import { InMemoryEmployeeRepository } from '../../../../src/modules/hrms/infrastructure/repositories/InMemoryEmployeeRepository';
import { PayslipMapper } from '../../../../src/modules/hrms/application/mappers/PayslipMapper';
import { SalaryStructureMapper } from '../../../../src/modules/hrms/application/mappers/SalaryStructureMapper';
import { ExpenseClaimMapper } from '../../../../src/modules/hrms/application/mappers/ExpenseClaimMapper';
import { Employee } from '../../../../src/modules/hrms/domain/entities/Employee';
import { NotFoundError } from '../../../../src/shared/errors';

describe('PayrollAndExpensesUseCases (Unit Tests)', () => {
  let payslipRepo: InMemoryPayslipRepository;
  let salaryStructureRepo: InMemorySalaryStructureRepository;
  let expenseClaimRepo: InMemoryExpenseClaimRepository;
  let employeeRepo: InMemoryEmployeeRepository;

  let payslipMapper: PayslipMapper;
  let salaryStructureMapper: SalaryStructureMapper;
  let expenseClaimMapper: ExpenseClaimMapper;

  let useCases: PayrollAndExpensesUseCases;

  const orgId = 'org-payroll-test';
  const userId = 'usr-finance-emp';

  beforeEach(() => {
    payslipRepo = new InMemoryPayslipRepository();
    salaryStructureRepo = new InMemorySalaryStructureRepository();
    expenseClaimRepo = new InMemoryExpenseClaimRepository();
    employeeRepo = new InMemoryEmployeeRepository();

    payslipMapper = new PayslipMapper();
    salaryStructureMapper = new SalaryStructureMapper();
    expenseClaimMapper = new ExpenseClaimMapper();

    useCases = new PayrollAndExpensesUseCases(
      payslipRepo,
      payslipMapper,
      salaryStructureRepo,
      salaryStructureMapper,
      expenseClaimRepo,
      expenseClaimMapper,
      employeeRepo
    );
  });

  describe('Salary Structures', () => {
    it('should create and retrieve a salary structure with earnings and deductions', async () => {
      const struct = await useCases.createSalaryStructure(orgId, {
        userId,
        title: 'Standard Full-Time Package',
        currency: 'INR',
        components: [
          { code: 'BASIC', name: 'Basic Salary', category: 'earning', calculationType: 'fixed', amount: 50000, taxable: true },
          { code: 'HRA', name: 'House Rent Allowance', category: 'earning', calculationType: 'fixed', amount: 20000, taxable: true },
          { code: 'PF', name: 'Provident Fund', category: 'deduction', calculationType: 'fixed', amount: 1800, taxable: false },
        ],
      });

      expect(struct.id).toBeDefined();
      expect(struct.userId).toBe(userId);
      expect(struct.title).toBe('Standard Full-Time Package');
      expect(struct.components.length).toBe(3);
      expect(struct.grossMonthly).toBe(70000);
      expect(struct.netMonthly).toBe(68200);

      const retrieved = await useCases.getSalaryStructureById(orgId, struct.id);
      expect(retrieved.title).toBe('Standard Full-Time Package');
      expect(retrieved.status).toBe('draft');
    });

    it('should activate and update a salary structure', async () => {
      const struct = await useCases.createSalaryStructure(orgId, {
        userId,
        title: 'Executive Package',
      });

      const updated = await useCases.updateSalaryStructure(orgId, struct.id, {
        title: 'Executive Senior Package',
        status: 'active',
      });

      expect(updated.title).toBe('Executive Senior Package');
      expect(updated.status).toBe('active');
    });

    it('should delete salary structure and throw NotFoundError on subsequent access', async () => {
      const struct = await useCases.createSalaryStructure(orgId, {
        userId,
        title: 'Temporary Structure',
      });
      await useCases.deleteSalaryStructure(orgId, struct.id);
      await expect(useCases.getSalaryStructureById(orgId, struct.id)).rejects.toThrow(NotFoundError);
    });
  });

  describe('Payroll Runs & Payslips', () => {
    beforeEach(async () => {
      // Create employee
      const emp = Employee.create({
        organizationId: orgId,
        employeeCode: 'EMP-FIN-01',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@apexinfinity.com',
        userId,
      });
      await employeeRepo.save(emp);

      // Create salary structure
      const struct = await useCases.createSalaryStructure(orgId, {
        userId,
        title: 'General Employee Compensation',
        components: [
          { code: 'BASIC', name: 'Basic Salary', category: 'earning', calculationType: 'fixed', amount: 40000, taxable: true },
          { code: 'HRA', name: 'House Rent Allowance', category: 'earning', calculationType: 'fixed', amount: 15000, taxable: true },
          { code: 'PF', name: 'Provident Fund', category: 'deduction', calculationType: 'fixed', amount: 1800, taxable: false },
        ],
      });
      await useCases.updateSalaryStructure(orgId, struct.id, { status: 'active' });
    });

    it('should run monthly payroll and generate payslip with net salary calculation', async () => {
      const result = await useCases.createPayrollRun(orgId, {
        month: 9,
        year: 2026,
        userIds: [userId],
      });

      expect(result.runId).toBe('RUN-202609');
      expect(result.generatedPayslips).toBe(1);

      const payslip = result.payslips[0];
      expect(payslip.userId).toBe(userId);
      expect(payslip.month).toBe(9);
      expect(payslip.year).toBe(2026);
      expect(payslip.grossPay).toBe(55000);
      expect(payslip.deductionTotal).toBe(1800);
      expect(payslip.netPay).toBe(53200);
      expect(payslip.status).toBe('draft');
    });

    it('should mark payslip as paid with payment mode and reference number', async () => {
      const run = await useCases.createPayrollRun(orgId, {
        month: 9,
        year: 2026,
        userIds: [userId],
      });
      const payslipId = run.payslips[0].id;

      const paid = await useCases.updatePayslip(orgId, payslipId, {
        status: 'paid',
        paymentMode: 'bank_transfer',
        referenceNo: 'UTR-987654321',
      });

      expect(paid.status).toBe('paid');
      expect(paid.paymentMode).toBe('bank_transfer');
      expect(paid.referenceNo).toBe('UTR-987654321');
      expect(paid.paidAt).toBeDefined();
    });

    it('should bulk update payslips status', async () => {
      const run = await useCases.createPayrollRun(orgId, {
        month: 9,
        year: 2026,
        userIds: [userId],
      });
      const payslipId = run.payslips[0].id;

      const res = await useCases.bulkUpdatePayslipsStatus(orgId, [payslipId], 'approved');
      expect(res.updatedCount).toBe(1);

      const fetched = await useCases.getPayslipById(orgId, payslipId);
      expect(fetched.status).toBe('approved');
    });
  });

  describe('Expense Claims', () => {
    it('should create, submit, and approve an expense claim', async () => {
      const claim = await useCases.createExpenseClaim(orgId, {
        userId,
        title: 'Client Lunch in Mumbai',
        currency: 'INR',
        items: [
          { category: 'food', expenseDate: new Date(), amount: 4500, description: 'Lunch with client' },
        ],
        submitNow: true,
      });

      expect(claim.id).toBeDefined();
      expect(claim.status).toBe('submitted');
      expect(claim.totalAmount).toBe(4500);

      const approved = await useCases.approveExpenseClaim(
        orgId,
        claim.id,
        'usr-mgr',
        4000,
        'Approved up to capped policy limit'
      );

      expect(approved.status).toBe('partially_approved');
      expect(approved.approvedAmount).toBe(4000);
      expect(approved.approvalFlow[0].comments).toBe('Approved up to capped policy limit');
    });

    it('should reject an expense claim with comments', async () => {
      const claim = await useCases.createExpenseClaim(orgId, {
        userId,
        title: 'Taxi to airport',
        currency: 'INR',
        items: [
          { category: 'travel', expenseDate: new Date(), amount: 1200, description: 'Airport cab' },
        ],
      });

      const rejected = await useCases.rejectExpenseClaim(
        orgId,
        claim.id,
        'usr-mgr',
        'Missing formal receipt document'
      );

      expect(rejected.status).toBe('rejected');
      expect(rejected.approvalFlow[0].comments).toBe('Missing formal receipt document');
    });
  });
});
