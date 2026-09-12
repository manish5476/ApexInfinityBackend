import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { SupplierDocument } from '../../infrastructure/persistence';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { BadRequestError, NotFoundError } from '../../../../shared/errors';
import crypto from 'crypto';

export class SupplierController {
  private readonly supplierModel: Model<SupplierDocument>;

  constructor(supplierModel: Model<SupplierDocument>) {
    this.supplierModel = supplierModel;
  }

  public searchSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const q = String(req.query.q || req.query.search || '').trim();

      const filter: Record<string, unknown> = {
        organizationId: user.organizationId,
        isDeleted: false,
      };

      if (q) {
        filter.$or = [
          { companyName: { $regex: q, $options: 'i' } },
          { contactPerson: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { gstNumber: { $regex: q, $options: 'i' } },
        ];
      }

      const suppliers = await this.supplierModel.find(filter).limit(50).lean().exec();

      res.status(200).json({
        status: 'success',
        results: suppliers.length,
        data: suppliers,
      });
    } catch (err) {
      next(err);
    }
  };

  public getSupplierList = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const suppliers = await this.supplierModel
        .find({ organizationId: user.organizationId, isDeleted: false, isActive: true })
        .select('_id companyName phone email outstandingBalance')
        .sort({ companyName: 1 })
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: suppliers.length,
        data: suppliers,
      });
    } catch (err) {
      next(err);
    }
  };

  public createbulkSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const suppliers = req.body.suppliers || req.body;

      if (!Array.isArray(suppliers) || !suppliers.length) {
        throw new BadRequestError('Array of suppliers is required.');
      }

      const created = [];
      for (const item of suppliers) {
        if (!item.companyName) continue;
        const doc = await this.supplierModel.create({
          ...item,
          _id: crypto.randomUUID(),
          organizationId: user.organizationId,
          createdBy: user.id,
          isActive: true,
          isDeleted: false,
        });
        created.push(doc);
      }

      res.status(201).json({
        status: 'success',
        results: created.length,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  };

  public getAllSuppliers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {
        organizationId: user.organizationId,
      };

      if (req.query.includeDeleted !== 'true') {
        filter.isDeleted = false;
      }
      if (req.query.status === 'active') filter.isActive = true;
      if (req.query.status === 'inactive') filter.isActive = false;

      const total = await this.supplierModel.countDocuments(filter).exec();
      const suppliers = await this.supplierModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: suppliers.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data: suppliers,
      });
    } catch (err) {
      next(err);
    }
  };

  public createSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { companyName } = req.body;

      if (!companyName) throw new BadRequestError('Supplier company name is required.');

      const supplierId = crypto.randomUUID();
      const supplier = await this.supplierModel.create({
        ...req.body,
        _id: supplierId,
        organizationId: user.organizationId,
        createdBy: user.id,
        isActive: true,
        isDeleted: false,
      });

      res.status(201).json({
        status: 'success',
        data: supplier,
      });
    } catch (err) {
      next(err);
    }
  };

  public getSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const doc = await this.supplierModel
        .findOne({ _id: req.params.id, organizationId: user.organizationId })
        .lean()
        .exec();

      if (!doc) throw new NotFoundError('Supplier not found.');

      res.status(200).json({
        status: 'success',
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  };

  public updateSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const doc = await this.supplierModel
        .findOneAndUpdate(
          { _id: req.params.id, organizationId: user.organizationId },
          { $set: req.body },
          { new: true, runValidators: true }
        )
        .lean()
        .exec();

      if (!doc) throw new NotFoundError('Supplier not found.');

      res.status(200).json({
        status: 'success',
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const doc = await this.supplierModel.findOneAndUpdate(
        { _id: req.params.id, organizationId: user.organizationId },
        { $set: { isDeleted: true, isActive: false } },
        { new: true }
      ).exec();

      if (!doc) throw new NotFoundError('Supplier not found.');

      res.status(200).json({
        status: 'success',
        message: 'Supplier deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  public restoreSupplier = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const doc = await this.supplierModel.findOneAndUpdate(
        { _id: req.params.id, organizationId: user.organizationId },
        { $set: { isDeleted: false, isActive: true } },
        { new: true }
      ).lean().exec();

      if (!doc) throw new NotFoundError('Supplier not found.');

      res.status(200).json({
        status: 'success',
        message: 'Supplier restored successfully.',
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  };

  public uploadKycDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { docType, url } = req.body;
      const file = req.file;

      const docUrl = url || (file ? `/uploads/kyc/${file.filename || file.originalname}` : '');
      if (!docType || !docUrl) {
        throw new BadRequestError('Document type and file/url are required.');
      }

      const docId = crypto.randomUUID();
      const newDoc = {
        _id: docId,
        docType,
        url: docUrl,
        uploadedAt: new Date(),
        verified: false,
      };

      const updated = await this.supplierModel.findOneAndUpdate(
        { _id: req.params.id, organizationId: user.organizationId },
        { $push: { documents: newDoc } },
        { new: true }
      ).lean().exec();

      if (!updated) throw new NotFoundError('Supplier not found.');

      res.status(200).json({
        status: 'success',
        message: 'KYC document uploaded.',
        data: newDoc,
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteKycDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { id, docId } = req.params;

      const updated = await this.supplierModel.findOneAndUpdate(
        { _id: id, organizationId: user.organizationId },
        { $pull: { documents: { _id: docId } } },
        { new: true }
      ).lean().exec();

      if (!updated) throw new NotFoundError('Supplier not found.');

      res.status(200).json({
        status: 'success',
        message: 'KYC document removed.',
      });
    } catch (err) {
      next(err);
    }
  };

  public downloadSupplierLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const supplier = await this.supplierModel
        .findOne({ _id: req.params.id, organizationId: user.organizationId })
        .lean()
        .exec();

      if (!supplier) throw new NotFoundError('Supplier not found.');

      const csv = `Date,Type,Reference,Debit,Credit,Balance\n${new Date().toISOString()},Opening Balance,-,0,${supplier.openingBalance},${supplier.openingBalance}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="supplier_${supplier.companyName}_ledger.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };

  public getSupplierDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const supplier = await this.supplierModel
        .findOne({ _id: req.params.id, organizationId: user.organizationId })
        .lean()
        .exec();

      if (!supplier) throw new NotFoundError('Supplier not found.');

      res.status(200).json({
        status: 'success',
        data: {
          supplierId: supplier._id,
          companyName: supplier.companyName,
          outstandingBalance: supplier.outstandingBalance,
          creditLimit: supplier.creditLimit,
          totalPurchases: 0,
          pendingDeliveries: 0,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
