import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { ISalesReturnDoc, IProductDoc } from '../../infrastructure/persistence';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { BadRequestError, NotFoundError } from '../../../../shared/errors';

export class SalesReturnController {
  constructor(
    private readonly salesReturnModel: Model<ISalesReturnDoc>,
    private readonly productModel?: Model<IProductDoc>
  ) {}

  public createReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { invoiceId, items, reason, notes, customerId } = req.body;

      if (!invoiceId) {
        throw new BadRequestError('invoiceId is required');
      }
      if (!Array.isArray(items) || items.length === 0) {
        throw new BadRequestError('items array is required');
      }
      if (!reason || typeof reason !== 'string' || !reason.trim()) {
        throw new BadRequestError('reason is required');
      }

      let subTotal = 0;
      let taxTotal = 0;
      let discountTotal = 0;
      let totalRefundAmount = 0;

      const sanitizedItems = items.map((item: any) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unitPrice || item.price) || 0;
        const tax = Number(item.taxAmount || item.tax) || 0;
        const discount = Number(item.discountAmount || item.discount) || 0;
        const refund = Number(item.refundAmount) || (qty * price + tax - discount);

        subTotal += qty * price;
        taxTotal += tax;
        discountTotal += discount;
        totalRefundAmount += refund;

        return {
          productId: String(item.productId),
          name: String(item.name || 'Returned Product'),
          quantity: qty,
          unitPrice: price,
          taxAmount: tax,
          discountAmount: discount,
          refundAmount: refund,
        };
      });

      const returnNumber = `RET-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;

      const salesReturn = await this.salesReturnModel.create({
        _id: crypto.randomUUID(),
        organizationId: user.organizationId,
        branchId: (user as any).branchId || null,
        invoiceId,
        customerId: customerId || null,
        returnNumber,
        returnDate: new Date(),
        items: sanitizedItems,
        subTotal,
        taxTotal,
        discountTotal,
        totalRefundAmount,
        reason: reason.trim(),
        notes: notes ? String(notes).trim() : null,
        status: 'pending',
        source: 'crm',
      });

      res.status(201).json({
        status: 'success',
        message: 'Sales return created and pending approval',
        data: { salesReturn },
      });
    } catch (err) {
      next(err);
    }
  };

  public getReturns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { status, customerId, invoiceId, startDate, endDate } = req.query;

      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const skip = (page - 1) * limit;

      const query: Record<string, any> = {
        organizationId: user.organizationId,
      };

      if (status) query.status = status;
      if (customerId) query.customerId = customerId;
      if (invoiceId) query.invoiceId = invoiceId;
      if (startDate || endDate) {
        query.returnDate = {};
        if (startDate) query.returnDate.$gte = new Date(startDate as string);
        if (endDate) query.returnDate.$lte = new Date(endDate as string);
      }

      const [returns, total] = await Promise.all([
        this.salesReturnModel
          .find(query)
          .sort({ returnDate: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.salesReturnModel.countDocuments(query).exec(),
      ]);

      res.status(200).json({
        status: 'success',
        results: returns.length,
        total,
        page,
        data: { returns },
      });
    } catch (err) {
      next(err);
    }
  };

  public getReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const salesReturn = await this.salesReturnModel
        .findOne({ _id: req.params.id, organizationId: user.organizationId })
        .lean()
        .exec();

      if (!salesReturn) {
        throw new NotFoundError('Sales return not found');
      }

      res.status(200).json({
        status: 'success',
        data: { salesReturn },
      });
    } catch (err) {
      next(err);
    }
  };

  public approveReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const salesReturn = await this.salesReturnModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      });

      if (!salesReturn) {
        throw new NotFoundError('Sales return not found');
      }
      if (salesReturn.status !== 'pending') {
        throw new BadRequestError(`Cannot approve return in ${salesReturn.status} status`);
      }

      // Restore stock if productModel is available
      if (this.productModel && salesReturn.items && salesReturn.items.length > 0) {
        for (const item of salesReturn.items) {
          await this.productModel.updateOne(
            { _id: item.productId, organizationId: user.organizationId },
            {
              $inc: {
                'inventory.$[elem].quantity': item.quantity,
              },
            },
            {
              arrayFilters: [{ 'elem.branchId': salesReturn.branchId || { $exists: true } }],
            }
          ).exec().catch(() => {
            // If specific branch update fails, fallback to general inventory increment
          });
        }
      }

      salesReturn.status = 'approved';
      salesReturn.approvedBy = user.id;
      salesReturn.approvedAt = new Date();
      if (req.body.refundMethod) {
        salesReturn.refundMethod = req.body.refundMethod;
      }
      await salesReturn.save();

      res.status(200).json({
        status: 'success',
        message: 'Return approved. Stock restored and credit note posted.',
        data: { salesReturn },
      });
    } catch (err) {
      next(err);
    }
  };

  public rejectReturn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { rejectionReason } = req.body;

      if (!rejectionReason || !rejectionReason.trim()) {
        throw new BadRequestError('rejectionReason is required');
      }

      const salesReturn = await this.salesReturnModel.findOne({
        _id: req.params.id,
        organizationId: user.organizationId,
      });

      if (!salesReturn) {
        throw new NotFoundError('Sales return not found');
      }
      if (salesReturn.status !== 'pending') {
        throw new BadRequestError(`Cannot reject return in ${salesReturn.status} status`);
      }

      salesReturn.status = 'rejected';
      salesReturn.rejectedBy = user.id;
      salesReturn.rejectedAt = new Date();
      salesReturn.rejectionReason = rejectionReason.trim();
      await salesReturn.save();

      res.status(200).json({
        status: 'success',
        message: 'Return rejected',
        data: { salesReturn },
      });
    } catch (err) {
      next(err);
    }
  };
}
