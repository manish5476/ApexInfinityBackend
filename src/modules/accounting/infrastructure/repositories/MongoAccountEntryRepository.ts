import {
  IAccountEntryRepository,
  ListLedgerEntriesQuery,
  TrialBalanceItem,
  ProfitLossSummary,
  BalanceSheetSummary,
} from '../../domain/ports/IAccountEntryRepository';
import { AccountEntry } from '../../domain/entities/AccountEntry';
import { AccountEntryModel, IAccountEntryDoc } from '../persistence/accountEntry.model';

export class MongoAccountEntryRepository implements IAccountEntryRepository {
  async findById(query: { id: string; organizationId: string }): Promise<AccountEntry | null> {
    const doc = await AccountEntryModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<IAccountEntryDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async save(entry: AccountEntry): Promise<void> {
    await AccountEntryModel.updateOne(
      { _id: entry.id, organizationId: entry.organizationId },
      { $set: entry.props },
      { upsert: true }
    );
  }

  async saveMany(entries: AccountEntry[]): Promise<void> {
    if (!entries.length) return;
    const ops = entries.map(e => ({
      updateOne: {
        filter: { _id: e.id, organizationId: e.organizationId },
        update: { $set: e.props },
        upsert: true,
      },
    }));
    await AccountEntryModel.bulkWrite(ops);
  }

  async list(query: ListLedgerEntriesQuery): Promise<{ data: AccountEntry[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.accountId) filter.accountId = query.accountId;
    if (query.customerId) filter.customerId = query.customerId;
    if (query.supplierId) filter.supplierId = query.supplierId;
    if (query.invoiceId) filter.invoiceId = query.invoiceId;
    if (query.paymentId) filter.paymentId = query.paymentId;
    if (query.referenceNumber) filter.referenceNumber = query.referenceNumber;
    if (query.referenceType) filter.referenceType = query.referenceType;

    if (query.fromDate || query.toDate) {
      filter.date = {};
      if (query.fromDate) filter.date.$gte = query.fromDate;
      if (query.toDate) filter.date.$lte = query.toDate;
    }

    const [docs, total] = await Promise.all([
      AccountEntryModel.find(filter).sort({ date: -1, _id: -1 }).skip(skip).limit(limit).lean<IAccountEntryDoc[]>(),
      AccountEntryModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  async getTrialBalance(query: { organizationId: string; fromDate?: Date; toDate?: Date }): Promise<TrialBalanceItem[]> {
    const match: Record<string, any> = { organizationId: query.organizationId };
    if (query.fromDate || query.toDate) {
      match.date = {};
      if (query.fromDate) match.date.$gte = query.fromDate;
      if (query.toDate) match.date.$lte = query.toDate;
    }

    const results = await AccountEntryModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$accountId',
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
        },
      },
      {
        $project: {
          accountId: '$_id',
          totalDebit: { $round: ['$totalDebit', 2] },
          totalCredit: { $round: ['$totalCredit', 2] },
          balance: { $round: [{ $subtract: ['$totalDebit', '$totalCredit'] }, 2] },
        },
      },
    ]);

    return results;
  }

  async getProfitLoss(query: { organizationId: string; fromDate?: Date; toDate?: Date }): Promise<ProfitLossSummary> {
    const match: Record<string, any> = { organizationId: query.organizationId };
    if (query.fromDate || query.toDate) {
      match.date = {};
      if (query.fromDate) match.date.$gte = query.fromDate;
      if (query.toDate) match.date.$lte = query.toDate;
    }

    const results = await AccountEntryModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$credit' },
          totalExpense: { $sum: '$debit' },
        },
      },
    ]);

    const rev = results[0]?.totalRevenue || 0;
    const exp = results[0]?.totalExpense || 0;

    return {
      revenue: Math.round(rev * 100) / 100,
      expense: Math.round(exp * 100) / 100,
      netProfit: Math.round((rev - exp) * 100) / 100,
    };
  }

  async getBalanceSheet(query: { organizationId: string; asOfDate?: Date }): Promise<BalanceSheetSummary> {
    const match: Record<string, any> = { organizationId: query.organizationId };
    if (query.asOfDate) {
      match.date = { $lte: query.asOfDate };
    }

    const results = await AccountEntryModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalDebit: { $sum: '$debit' },
          totalCredit: { $sum: '$credit' },
        },
      },
    ]);

    const assets = results[0]?.totalDebit || 0;
    const liabilities = results[0]?.totalCredit || 0;

    return {
      assets: Math.round(assets * 100) / 100,
      liabilities: Math.round(liabilities * 100) / 100,
      equity: Math.round((assets - liabilities) * 100) / 100,
    };
  }

  private mapToDomain(doc: IAccountEntryDoc): AccountEntry {
    return AccountEntry.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      branchId: doc.branchId,
      accountId: doc.accountId,
      customerId: doc.customerId,
      supplierId: doc.supplierId,
      invoiceId: doc.invoiceId,
      purchaseId: doc.purchaseId,
      paymentId: doc.paymentId,
      date: doc.date,
      debit: doc.debit,
      credit: doc.credit,
      description: doc.description,
      referenceNumber: doc.referenceNumber,
      referenceType: doc.referenceType,
      createdBy: doc.createdBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
