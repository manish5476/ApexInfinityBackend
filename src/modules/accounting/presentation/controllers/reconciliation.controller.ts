import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { PendingReconciliationDocument, EmiDocument } from '../../infrastructure/persistence';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { BadRequestError, NotFoundError } from '../../../../shared/errors';
import crypto from 'crypto';

export class ReconciliationController {
  private readonly pendingModel: Model<PendingReconciliationDocument>;
  private readonly emiModel: Model<EmiDocument>;

  constructor(
    pendingModel: Model<PendingReconciliationDocument>,
    emiModel: Model<EmiDocument>
  ) {
    this.pendingModel = pendingModel;
    this.emiModel = emiModel;
  }

  public paymentGatewayWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { paymentId, orderId, amount, status = 'pending', organizationId } = req.body;

      if (!amount) {
        throw new BadRequestError('amount is required');
      }

      const recId = crypto.randomUUID();
      const rec = await this.pendingModel.create({
        _id: recId,
        organizationId: organizationId || 'default-org',
        invoiceId: orderId,
        amount: Number(amount),
        transactionId: paymentId || recId,
        status: status === 'success' || status === 'captured' ? 'pending' : 'pending',
      });

      res.status(200).json({
        status: 'success',
        data: { reconciliationId: rec._id },
      });
    } catch (err) {
      next(err);
    }
  };

  public topMismatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const pending = await this.pendingModel
        .find({ organizationId: user.organizationId, status: 'pending' })
        .limit(20)
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: pending.length,
        data: { mismatches: pending },
      });
    } catch (err) {
      next(err);
    }
  };

  public detail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { id, type } = req.query;

      if (!id) throw new BadRequestError('ID query param is required.');

      const record = await this.pendingModel
        .findOne({ _id: String(id), organizationId: user.organizationId })
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        data: { record, type },
      });
    } catch (err) {
      next(err);
    }
  };

  public getPendingReconciliations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const pending = await this.pendingModel
        .find({ organizationId: user.organizationId, status: 'pending' })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: pending.length,
        data: pending,
      });
    } catch (err) {
      next(err);
    }
  };

  public manualReconcilePayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { reconciliationId, installments, notes } = req.body;

      if (!reconciliationId) throw new BadRequestError('reconciliationId is required');

      const pending = await this.pendingModel.findOne({
        _id: reconciliationId,
        organizationId: user.organizationId,
      }).exec();

      if (!pending) throw new NotFoundError('Reconciliation record not found');

      let emiPlan = null;
      if (pending.invoiceId) {
        emiPlan = await this.emiModel.findOne({
          invoiceId: pending.invoiceId,
          organizationId: user.organizationId,
        }).exec();
      }

      if (emiPlan) {
        let remaining = pending.amount;
        for (const inst of emiPlan.installments) {
          if (remaining <= 0) break;
          if (inst.paymentStatus === 'paid') continue;

          const toApply = Math.min(remaining, inst.totalAmount - (inst.paidAmount || 0));
          inst.paidAmount = (inst.paidAmount || 0) + toApply;
          remaining -= toApply;
          if (inst.paidAmount >= inst.totalAmount) {
            inst.paymentStatus = 'paid';
            inst.paidAt = new Date();
          } else {
            inst.paymentStatus = 'partial';
          }
        }
        await emiPlan.save();
      }

      pending.status = 'matched';
      pending.reconciledBy = user.id;
      pending.reconciledAt = new Date();
      pending.notes = notes;
      await pending.save();

      res.status(200).json({
        status: 'success',
        message: 'Payment manually reconciled',
        data: { reconciliation: pending },
      });
    } catch (err) {
      next(err);
    }
  };

  public getReconciliationSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const pendingCount = await this.pendingModel.countDocuments({
        organizationId: user.organizationId,
        status: 'pending',
      }).exec();
      const matchedCount = await this.pendingModel.countDocuments({
        organizationId: user.organizationId,
        status: 'matched',
      }).exec();

      res.status(200).json({
        status: 'success',
        data: {
          reconciliation: [
            { _id: 'pending', count: pendingCount },
            { _id: 'matched', count: matchedCount },
          ],
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
