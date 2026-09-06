import { IAccountEntryRepository, BalanceSheetSummary } from '../../domain/ports/IAccountEntryRepository';
import { IAccountRepository } from '../../domain/ports/IAccountRepository';

export class GetBalanceSheetUseCase {
  constructor(
    private readonly entryRepo: IAccountEntryRepository,
    private readonly accountRepo: IAccountRepository
  ) {}

  async execute(
    query: { asOfDate?: Date },
    context: { organizationId: string }
  ): Promise<BalanceSheetSummary> {
    const trialBalance = await this.entryRepo.getTrialBalance({
      organizationId: context.organizationId,
      toDate: query.asOfDate,
    });

    let assets = 0;
    let liabilities = 0;
    let equity = 0;

    for (const item of trialBalance) {
      const account = await this.accountRepo.findById({
        id: item.accountId,
        organizationId: context.organizationId,
      });

      if (!account) continue;

      if (account.type === 'asset') {
        assets += Math.max(0, item.totalDebit - item.totalCredit);
      } else if (account.type === 'liability') {
        liabilities += Math.max(0, item.totalCredit - item.totalDebit);
      } else if (account.type === 'equity') {
        equity += Math.max(0, item.totalCredit - item.totalDebit);
      }
    }

    return {
      assets: Math.round(assets * 100) / 100,
      liabilities: Math.round(liabilities * 100) / 100,
      equity: Math.round(equity * 100) / 100,
    };
  }
}
