import { IAccountEntryRepository, ProfitLossSummary } from '../../domain/ports/IAccountEntryRepository';
import { IAccountRepository } from '../../domain/ports/IAccountRepository';

export class GetProfitLossUseCase {
  constructor(
    private readonly entryRepo: IAccountEntryRepository,
    private readonly accountRepo: IAccountRepository
  ) {}

  async execute(
    query: { fromDate?: Date; toDate?: Date },
    context: { organizationId: string }
  ): Promise<ProfitLossSummary> {
    const trialBalance = await this.entryRepo.getTrialBalance({
      organizationId: context.organizationId,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });

    let revenue = 0;
    let expense = 0;

    for (const item of trialBalance) {
      const account = await this.accountRepo.findById({
        id: item.accountId,
        organizationId: context.organizationId,
      });

      if (!account) continue;

      if (account.type === 'revenue' || account.type === 'income') {
        revenue += Math.max(0, item.totalCredit - item.totalDebit);
      } else if (account.type === 'expense') {
        expense += Math.max(0, item.totalDebit - item.totalCredit);
      }
    }

    return {
      revenue: Math.round(revenue * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      netProfit: Math.round((revenue - expense) * 100) / 100,
    };
  }
}
