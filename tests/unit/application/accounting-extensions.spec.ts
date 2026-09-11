import { EmiController } from '../../../src/modules/accounting/presentation/controllers/emi.controller';
import { ReconciliationController } from '../../../src/modules/accounting/presentation/controllers/reconciliation.controller';
import { TransactionController } from '../../../src/modules/accounting/presentation/controllers/transaction.controller';

describe('Accounting Extensions (EMI, Reconciliation, Transactions)', () => {
  describe('EmiController', () => {
    let mockEmiModel: any;
    let controller: EmiController;

    beforeEach(() => {
      mockEmiModel = {
        find: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([
              {
                status: 'active',
                totalAmount: 1200,
                installments: [
                  { totalAmount: 100, paidAmount: 100, paymentStatus: 'paid' },
                  { totalAmount: 100, paidAmount: 0, paymentStatus: 'pending', dueDate: new Date() },
                ],
              },
            ]),
          }),
        }),
        create: jest.fn().mockImplementation((doc) => Promise.resolve(doc)),
      };
      controller = new EmiController(mockEmiModel);
    });

    it('should compute EMI analytics correctly', async () => {
      const req: any = {
        user: { id: 'u1', organizationId: 'org-1', roles: ['admin'] },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.getEmiAnalytics(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            totalPlans: 1,
            totalActivePlans: 1,
            totalDisbursedAmount: 1200,
            totalCollectedAmount: 100,
          }),
        })
      );
    });

    it('should create an EMI plan with installments schedule', async () => {
      const req: any = {
        user: { id: 'u1', organizationId: 'org-1', roles: ['admin'], branchId: 'b1' },
        body: {
          invoiceId: 'inv-100',
          customerId: 'cust-100',
          totalAmount: 1200,
          downPayment: 200,
          numberOfInstallments: 10,
          interestRate: 0,
          emiStartDate: '2026-10-01',
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.createEmiPlan(req, res, next);

      expect(mockEmiModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          invoiceId: 'inv-100',
          balanceAmount: 1000,
          numberOfInstallments: 10,
          status: 'active',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('ReconciliationController', () => {
    let mockPendingModel: any;
    let mockEmiModel: any;
    let controller: ReconciliationController;

    beforeEach(() => {
      mockPendingModel = {
        create: jest.fn().mockImplementation((doc) => Promise.resolve(doc)),
      };
      mockEmiModel = {};
      controller = new ReconciliationController(mockPendingModel, mockEmiModel);
    });

    it('should acknowledge payment gateway webhook', async () => {
      const req: any = {
        body: {
          paymentId: 'pay_xyz123',
          orderId: 'inv-500',
          amount: 500,
          status: 'captured',
          organizationId: 'org-1',
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.paymentGatewayWebhook(req, res, next);

      expect(mockPendingModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          invoiceId: 'inv-500',
          amount: 500,
          status: 'pending',
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('TransactionController', () => {
    let mockEntryModel: any;
    let controller: TransactionController;

    beforeEach(() => {
      mockEntryModel = {
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue([
                    {
                      date: new Date('2026-09-01'),
                      debit: 100,
                      credit: 0,
                      referenceType: 'invoice',
                    },
                  ]),
                }),
              }),
            }),
          }),
        }),
        countDocuments: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(1),
        }),
      };
      controller = new TransactionController(mockEntryModel);
    });

    it('should list transactions scoped to organization', async () => {
      const req: any = {
        user: { id: 'u1', organizationId: 'org-1' },
        query: {},
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.getTransactions(req, res, next);

      expect(mockEntryModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ organizationId: 'org-1' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          results: 1,
        })
      );
    });
  });
});
