import {
  IAccountEntryRepository,
  ListLedgerEntriesQuery,
  TrialBalanceItem,
  ProfitLossSummary,
  BalanceSheetSummary,
} from '../../domain/ports/IAccountEntryRepository';
import { AccountEntry } from '../../domain/entities/AccountEntry';

export class InMemoryAccountEntryRepository implements IAccountEntryRepository {
  public entries: AccountEntry[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<AccountEntry | null> {
    const e = this.entries.find(x => x.id === query.id && x.organizationId === query.organizationId);
    return e ? AccountEntry.reconstitute({ ...e.props, id: e.id }) : null;
  }

  async save(entry: AccountEntry): Promise<void> {
    const idx = this.entries.findIndex(x => x.id === entry.id);
    if (idx >= 0) {
      this.entries[idx] = AccountEntry.reconstitute({ ...entry.props, id: entry.id });
    } else {
      this.entries.push(AccountEntry.reconstitute({ ...entry.props, id: entry.id }));
    }
  }

  async saveMany(entries: AccountEntry[]): Promise<void> {
    for (const e of entries) {
      await this.save(e);
    }
  }

  async list(query: ListLedgerEntriesQuery): Promise<{ data: AccountEntry[]; total: number }> {
    let filtered = this.entries.filter(x => x.organizationId === query.organizationId);

    if (query.accountId) filtered = filtered.filter(x => x.accountId === query.accountId);
    if (query.customerId) filtered = filtered.filter(x => x.customerId === query.customerId);
    if (query.supplierId) filtered = filtered.filter(x => x.supplierId === query.supplierId);
    if (query.invoiceId) filtered = filtered.filter(x => x.invoiceId === query.invoiceId);
    if (query.paymentId) filtered = filtered.filter(x => x.paymentId === query.paymentId);
    if (query.referenceNumber) filtered = filtered.filter(x => x.referenceNumber === query.referenceNumber);
    if (query.referenceType) filtered = filtered.filter(x => x.referenceType === query.referenceType);

    if (query.fromDate) filtered = filtered.filter(x => x.date >= query.fromDate!);
    if (query.toDate) filtered = filtered.filter(x => x.date <= query.toDate!);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map(x => AccountEntry.reconstitute({ ...x.props, id: x.id })),
      total: filtered.length,
    };
  }

  async getTrialBalance(query: { organizationId: string; fromDate?: Date; toDate?: Date }): Promise<TrialBalanceItem[]> {
    let filtered = this.entries.filter(x => x.organizationId === query.organizationId);
    if (query.fromDate) filtered = filtered.filter(x => x.date >= query.fromDate!);
    if (query.toDate) filtered = filtered.filter(x => x.date <= query.toDate!);

    const map = new Map<string, { totalDebit: number; totalCredit: number }>();
    for (const e of filtered) {
      const current = map.get(e.accountId) || { totalDebit: 0, totalCredit: 0 };
      current.totalDebit += e.debit;
      current.totalCredit += e.credit;
      map.set(e.accountId, current);
    }

    const result: TrialBalanceItem[] = [];
    for (const [accountId, totals] of map.entries()) {
      result.push({
        accountId,
        totalDebit: parseFloat(totals.totalDebit.toFixed(2)),
        totalCredit: parseFloat(totals.totalCredit.toFixed(2)),
        balance: parseFloat((totals.totalDebit - totals.totalCredit).toFixed(2)),
      });
    }
    return result;
  }

  async getProfitLoss(query: { organizationId: string; fromDate?: Date; toDate?: Date }): Promise<ProfitLossSummary> {
    let filtered = this.entries.filter(x => x.organizationId === query.organizationId);
    if (query.fromDate) filtered = filtered.filter(x => x.date >= query.fromDate!);
    if (query.toDate) filtered = filtered.filter(x => x.date <= query.toDate!);

    let revenue = 0;
    let expense = 0;

    for (const e of filtered) {
      if (e.credit > 0) revenue += e.credit;
      if (e.debit > 0) expense += e.debit;
    }

    return {
      revenue: parseFloat(revenue.toFixed(2)),
      expense: parseFloat(expense.toFixed(2)),
      netProfit: parseFloat((revenue - expense).toFixed(2)),
    };
  }

  async getBalanceSheet(query: { organizationId: string; asOfDate?: Date }): Promise<BalanceSheetSummary> {
    let filtered = this.entries.filter(x => x.organizationId === query.organizationId);
    if (query.asOfDate) filtered = filtered.filter(x => x.date <= query.asOfDate!);

    let totalDebit = 0;
    let totalCredit = 0;

    for (const e of filtered) {
      totalDebit += e.debit;
      totalCredit += e.credit;
    }

    return {
      assets: parseFloat(totalDebit.toFixed(2)),
      liabilities: parseFloat(totalCredit.toFixed(2)),
      equity: parseFloat((totalDebit - totalCredit).toFixed(2)),
    };
  }
}
