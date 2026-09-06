import { AccountEntry } from '../entities/AccountEntry';

export interface ListLedgerEntriesQuery {
  organizationId: string;
  accountId?: string;
  customerId?: string;
  supplierId?: string;
  invoiceId?: string;
  paymentId?: string;
  referenceNumber?: string;
  referenceType?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface TrialBalanceItem {
  accountId: string;
  accountName?: string;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface ProfitLossSummary {
  revenue: number;
  expense: number;
  netProfit: number;
}

export interface BalanceSheetSummary {
  assets: number;
  liabilities: number;
  equity: number;
}

export interface IAccountEntryRepository {
  findById(query: { id: string; organizationId: string }): Promise<AccountEntry | null>;
  save(entry: AccountEntry): Promise<void>;
  saveMany(entries: AccountEntry[]): Promise<void>;
  list(query: ListLedgerEntriesQuery): Promise<{ data: AccountEntry[]; total: number }>;
  getTrialBalance(query: { organizationId: string; fromDate?: Date; toDate?: Date }): Promise<TrialBalanceItem[]>;
  getProfitLoss(query: { organizationId: string; fromDate?: Date; toDate?: Date }): Promise<ProfitLossSummary>;
  getBalanceSheet(query: { organizationId: string; asOfDate?: Date }): Promise<BalanceSheetSummary>;
}
