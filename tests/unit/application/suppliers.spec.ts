import { SupplierController } from '../../../src/modules/crm/presentation/controllers/supplier.controller';

describe('SupplierController', () => {
  let mockModel: any;
  let controller: SupplierController;

  beforeEach(() => {
    mockModel = {
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
        select: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      }),
      findOneAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
        exec: jest.fn().mockResolvedValue(null),
      }),
      countDocuments: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      }),
      create: jest.fn().mockImplementation((doc) => Promise.resolve(doc)),
    };

    controller = new SupplierController(mockModel);
  });

  it('should search suppliers scoped to organization', async () => {
    const req: any = {
      user: { id: 'u1', organizationId: 'org-100', roles: ['admin'], permissions: [] },
      query: { q: 'Acme' },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await controller.searchSuppliers(req, res, next);

    expect(mockModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-100',
        isDeleted: false,
      })
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
      })
    );
  });

  it('should create a supplier with valid payload', async () => {
    const req: any = {
      user: { id: 'u1', organizationId: 'org-100', roles: ['admin'], permissions: [] },
      body: {
        companyName: 'Acme Supplies',
        phone: '1234567890',
      },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await controller.createSupplier(req, res, next);

    expect(mockModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyName: 'Acme Supplies',
        organizationId: 'org-100',
        createdBy: 'u1',
        isActive: true,
        isDeleted: false,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('should reject creating a supplier without companyName', async () => {
    const req: any = {
      user: { id: 'u1', organizationId: 'org-100', roles: ['admin'], permissions: [] },
      body: {},
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await controller.createSupplier(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Supplier company name is required'),
      })
    );
  });
});
