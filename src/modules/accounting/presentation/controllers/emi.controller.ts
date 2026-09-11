import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { EmiDocument, EmiInstallment } from '../../infrastructure/persistence/emi.model';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { BadRequestError, NotFoundError } from '../../../../shared/errors';
import crypto from 'crypto';

export class EmiController {
  private readonly emiModel: Model<EmiDocument>;

  constructor(emiModel: Model<EmiDocument>) {
    this.emiModel = emiModel;
  }

  public getEmiAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const emis = await this.emiModel.find({ organizationId: user.organizationId }).lean().exec();

      let totalActivePlans = 0;
      let totalCompletedPlans = 0;
      let totalDisbursedAmount = 0;
      let totalCollectedAmount = 0;
      let totalOverdueAmount = 0;

      for (const plan of emis) {
        if (plan.status === 'active') totalActivePlans++;
        if (plan.status === 'completed') totalCompletedPlans++;
        totalDisbursedAmount += plan.totalAmount || 0;

        for (const inst of plan.installments || []) {
          totalCollectedAmount += inst.paidAmount || 0;
          if (inst.paymentStatus === 'overdue' || (inst.paymentStatus === 'pending' && new Date(inst.dueDate) < new Date())) {
            totalOverdueAmount += (inst.totalAmount - (inst.paidAmount || 0));
          }
        }
      }

      res.status(200).json({
        status: 'success',
        data: {
          totalPlans: emis.length,
          totalActivePlans,
          totalCompletedPlans,
          totalDisbursedAmount,
          totalCollectedAmount,
          totalOverdueAmount,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getEmiLedgerReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { fromDate, toDate } = req.query;

      const filter: Record<string, unknown> = { organizationId: user.organizationId };
      if (fromDate || toDate) {
        filter.emiStartDate = {};
        if (fromDate) (filter.emiStartDate as Record<string, unknown>).$gte = new Date(String(fromDate));
        if (toDate) (filter.emiStartDate as Record<string, unknown>).$lte = new Date(String(toDate));
      }

      const emis = await this.emiModel.find(filter).sort({ emiStartDate: -1 }).lean().exec();
      res.status(200).json({
        status: 'success',
        results: emis.length,
        data: emis,
      });
    } catch (err) {
      next(err);
    }
  };

  public markOverdueInstallments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const now = new Date();

      const activePlans = await this.emiModel.find({
        organizationId: user.organizationId,
        status: 'active',
      }).exec();

      let markedCount = 0;
      for (const plan of activePlans) {
        let modified = false;
        for (const inst of plan.installments) {
          if (inst.paymentStatus === 'pending' && new Date(inst.dueDate) < now) {
            inst.paymentStatus = 'overdue';
            modified = true;
            markedCount++;
          }
        }
        if (modified) {
          await plan.save();
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Overdue installments updated',
        data: { markedCount },
      });
    } catch (err) {
      next(err);
    }
  };

  public getEmiByInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const emi = await this.emiModel
        .findOne({ invoiceId: req.params.invoiceId, organizationId: user.organizationId })
        .lean()
        .exec();

      if (!emi) throw new NotFoundError('No EMI plan found for this invoice');

      res.status(200).json({
        status: 'success',
        data: { emi },
      });
    } catch (err) {
      next(err);
    }
  };

  public getAllEmis = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = { organizationId: user.organizationId };
      if (req.query.status) filter.status = req.query.status;
      if (req.query.customerId) filter.customerId = req.query.customerId;

      const total = await this.emiModel.countDocuments(filter).exec();
      const emis = await this.emiModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec();

      res.status(200).json({
        status: 'success',
        results: emis.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data: emis,
      });
    } catch (err) {
      next(err);
    }
  };

  public createEmiPlan = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const {
        invoiceId,
        customerId,
        downPayment = 0,
        numberOfInstallments,
        interestRate = 0,
        emiStartDate,
        totalAmount,
      } = req.body;

      if (!invoiceId || !numberOfInstallments || !emiStartDate) {
        throw new BadRequestError('invoiceId, numberOfInstallments and emiStartDate are required');
      }

      const numInstallments = Number(numberOfInstallments);
      const downPay = Number(downPayment) || 0;
      const principal = (Number(totalAmount) || 0) - downPay;
      const rate = Number(interestRate) || 0;
      const totalInterest = (principal * rate) / 100;
      const grandBalance = principal + totalInterest;
      const installmentAmount = Math.round((grandBalance / numInstallments) * 100) / 100;

      const startDate = new Date(emiStartDate);
      const installments: EmiInstallment[] = [];
      for (let i = 1; i <= numInstallments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));

        installments.push({
          _id: crypto.randomUUID(),
          installmentNumber: i,
          dueDate,
          principalAmount: Math.round((principal / numInstallments) * 100) / 100,
          interestAmount: Math.round((totalInterest / numInstallments) * 100) / 100,
          totalAmount: installmentAmount,
          paidAmount: 0,
          paymentStatus: 'pending',
        });
      }

      const planId = crypto.randomUUID();
      const emi = await this.emiModel.create({
        _id: planId,
        organizationId: user.organizationId,
        branchId: (user as any).branchId || undefined,
        invoiceId,
        customerId: customerId || 'unknown',
        totalAmount: Number(totalAmount) || grandBalance + downPay,
        downPayment: downPay,
        balanceAmount: grandBalance,
        numberOfInstallments: numInstallments,
        interestRate: rate,
        emiStartDate: startDate,
        emiEndDate: installments[installments.length - 1]?.dueDate,
        installments,
        status: 'active',
        advanceBalance: 0,
        createdBy: user.id,
      });

      res.status(201).json({
        status: 'success',
        message: 'EMI Plan created successfully',
        data: { emi },
      });
    } catch (err) {
      next(err);
    }
  };

  public getEmiById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const emi = await this.emiModel
        .findOne({ _id: req.params.id, organizationId: user.organizationId })
        .lean()
        .exec();

      if (!emi) throw new NotFoundError('EMI plan not found');

      res.status(200).json({
        status: 'success',
        data: { emi },
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteEmi = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const emi = await this.emiModel.findOne({ _id: req.params.id, organizationId: user.organizationId }).exec();
      if (!emi) throw new NotFoundError('EMI not found');

      const hasPayments = emi.installments.some((i) => i.paidAmount > 0);
      if (hasPayments) {
        throw new BadRequestError('Cannot delete EMI with processed payments. Cancel instead.');
      }

      await this.emiModel.deleteOne({ _id: req.params.id });
      res.status(200).json({
        status: 'success',
        message: 'EMI deleted',
      });
    } catch (err) {
      next(err);
    }
  };

  public payEmiInstallment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const emiId = req.params.id || req.body.emiId;
      const { installmentNumber, amount } = req.body;

      if (!emiId || !installmentNumber || !amount) {
        throw new BadRequestError('emiId, installmentNumber, and amount are required');
      }

      const emi = await this.emiModel.findOne({ _id: emiId, organizationId: user.organizationId }).exec();
      if (!emi) throw new NotFoundError('EMI plan not found');

      const inst = emi.installments.find((i) => i.installmentNumber === Number(installmentNumber));
      if (!inst) throw new NotFoundError('Installment not found');

      const payAmt = Number(amount);
      inst.paidAmount = (inst.paidAmount || 0) + payAmt;
      inst.paidAt = new Date();

      if (inst.paidAmount >= inst.totalAmount) {
        inst.paymentStatus = 'paid';
      } else {
        inst.paymentStatus = 'partial';
      }

      const allPaid = emi.installments.every((i) => i.paymentStatus === 'paid');
      if (allPaid) {
        emi.status = 'completed';
      }

      await emi.save();

      res.status(200).json({
        status: 'success',
        message: 'Payment recorded. Ledger updated and installment marked paid.',
        data: { emi, paidInstallment: inst },
      });
    } catch (err) {
      next(err);
    }
  };

  public getEmiHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const emi = await this.emiModel.findOne({ _id: req.params.id, organizationId: user.organizationId }).lean().exec();
      if (!emi) throw new NotFoundError('EMI not found');

      const history = emi.installments.filter((i) => (i.paidAmount || 0) > 0);
      res.status(200).json({
        status: 'success',
        results: history.length,
        data: { history },
      });
    } catch (err) {
      next(err);
    }
  };

  public applyAdvanceBalance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const emiId = req.params.id || req.body.emiId;
      const { installmentNumber } = req.body;

      if (!emiId || !installmentNumber) {
        throw new BadRequestError('emiId and installmentNumber are required');
      }

      const emi = await this.emiModel.findOne({ _id: emiId, organizationId: user.organizationId }).exec();
      if (!emi) throw new NotFoundError('EMI plan not found');

      const inst = emi.installments.find((i) => i.installmentNumber === Number(installmentNumber));
      if (!inst) throw new NotFoundError('Installment not found');

      const remaining = inst.totalAmount - (inst.paidAmount || 0);
      const applyAmt = Math.min(emi.advanceBalance || 0, remaining);

      inst.paidAmount = (inst.paidAmount || 0) + applyAmt;
      emi.advanceBalance = (emi.advanceBalance || 0) - applyAmt;
      if (inst.paidAmount >= inst.totalAmount) {
        inst.paymentStatus = 'paid';
      } else {
        inst.paymentStatus = 'partial';
      }

      await emi.save();

      res.status(200).json({
        status: 'success',
        data: { emi, appliedAmount: applyAmt, remainingAdvance: emi.advanceBalance },
      });
    } catch (err) {
      next(err);
    }
  };
}
