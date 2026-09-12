import { SalesReturnController } from '../../../src/modules/inventory/presentation/controllers/salesReturn.controller';

describe('Phase 4: Sales Returns, Purchases, Sales, and Ledger Extensions', () => {
  describe('SalesReturnController', () => {
    let mockSalesReturnModel: any;
    let mockProductModel: any;
    let controller: SalesReturnController;

    beforeEach(() => {
      mockSalesReturnModel = {
        create: jest.fn().mockImplementation((doc) => Promise.resolve(doc)),
        find: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue([
                    { _id: 'ret-1', returnNumber: 'RET-001', status: 'pending', totalRefundAmount: 500 },
                  ]),
                }),
              }),
            }),
          }),
        }),
        countDocuments: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(1),
        }),
        findOne: jest.fn().mockImplementation((query) => {
          if (query._id === 'ret-1') {
            const doc = {
              _id: 'ret-1',
              organizationId: 'org-1',
              status: 'pending',
              items: [{ productId: 'prod-10', quantity: 2 }],
              save: jest.fn().mockResolvedValue(true),
            };
            return Promise.resolve(doc);
          }
          return {
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue({ _id: query._id, returnNumber: 'RET-001' }),
            }),
          };
        }),
      };

      mockProductModel = {
        updateOne: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
        }),
      };

      controller = new SalesReturnController(mockSalesReturnModel, mockProductModel);
    });

    it('should create a pending sales return with computed totals', async () => {
      const req: any = {
        user: { id: 'u1', organizationId: 'org-1', roles: ['admin'] },
        body: {
          invoiceId: 'inv-123',
          customerId: 'cust-456',
          reason: 'Defective item',
          items: [
            { productId: 'prod-1', name: 'Widget A', quantity: 2, unitPrice: 100, taxAmount: 10, discountAmount: 0 },
          ],
        },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.createReturn(req, res, next);

      expect(mockSalesReturnModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: 'org-1',
          invoiceId: 'inv-123',
          customerId: 'cust-456',
          status: 'pending',
          totalRefundAmount: 210,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should approve a pending sales return and restore product inventory', async () => {
      const req: any = {
        params: { id: 'ret-1' },
        user: { id: 'u1', organizationId: 'org-1', roles: ['admin'] },
        body: { refundMethod: 'credit_note' },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.approveReturn(req, res, next);

      expect(mockProductModel.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'prod-10', organizationId: 'org-1' }),
        expect.any(Object),
        expect.any(Object)
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: expect.stringContaining('Return approved'),
        })
      );
    });

    it('should reject a pending sales return with rejection reason', async () => {
      const req: any = {
        params: { id: 'ret-1' },
        user: { id: 'u1', organizationId: 'org-1', roles: ['admin'] },
        body: { rejectionReason: 'Warranty period expired' },
      };
      const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const next = jest.fn();

      await controller.rejectReturn(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          message: 'Return rejected',
        })
      );
    });
  });
});
