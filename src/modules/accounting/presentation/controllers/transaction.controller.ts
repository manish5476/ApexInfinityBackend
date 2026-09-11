import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { IAccountEntryDoc } from '../../infrastructure/persistence/accountEntry.model';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { BadRequestError } from '../../../../shared/errors';

export class TransactionController {
  private readonly entryModel: Model<IAccountEntryDoc>;

  constructor(entryModel: Model<IAccountEntryDoc>) {
    this.entryModel = entryModel;
  }

  public getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = { organizationId: user.organizationId };
      if (req.query.accountId) filter.accountId = req.query.accountId;
      if (req.query.type) filter.referenceType = req.query.type;

      if (req.query.startDate || req.query.endDate) {
        filter.date = {};
        if (req.query.startDate) (filter.date as Record<string, unknown>).$gte = new Date(String(req.query.startDate));
        if (req.query.endDate) (filter.date as Record<string, unknown>).$lte = new Date(String(req.query.endDate));
      }

      const total = await this.entryModel.countDocuments(filter).exec();
      const entries = await this.entryModel.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean().exec();

      res.status(200).json({
        status: 'success',
        results: entries.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data: entries,
      });
    } catch (err) {
      next(err);
    }
  };

  public exportTransactionsCsv = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const filter: Record<string, unknown> = { organizationId: user.organizationId };

      if (req.query.startDate || req.query.endDate) {
        filter.date = {};
        if (req.query.startDate) (filter.date as Record<string, unknown>).$gte = new Date(String(req.query.startDate));
        if (req.query.endDate) (filter.date as Record<string, unknown>).$lte = new Date(String(req.query.endDate));
      }

      const entries = await this.entryModel.find(filter).sort({ date: -1 }).limit(1000).lean().exec();

      let csv = 'Date,ReferenceType,ReferenceNumber,Debit,Credit,Description\n';
      for (const e of entries) {
        csv += `"${e.date.toISOString()}","${e.referenceType || ''}","${e.referenceNumber || ''}",${e.debit},${e.credit},"${(e.description || '').replace(/"/g, '""')}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  };

  public getCustomerTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { id } = req.params;
      if (!id) throw new BadRequestError('Customer ID is required');

      const entries = await this.entryModel
        .find({ organizationId: user.organizationId, customerId: id })
        .sort({ date: -1 })
        .limit(100)
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: entries.length,
        data: entries,
      });
    } catch (err) {
      next(err);
    }
  };

  public getSupplierTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { id } = req.params;
      if (!id) throw new BadRequestError('Supplier ID is required');

      const entries = await this.entryModel
        .find({ organizationId: user.organizationId, supplierId: id })
        .sort({ date: -1 })
        .limit(100)
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: entries.length,
        data: entries,
      });
    } catch (err) {
      next(err);
    }
  };
}
