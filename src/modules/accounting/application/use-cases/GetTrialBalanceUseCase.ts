import { IAccountEntryRepository, TrialBalanceItem } from '../../domain/ports/IAccountEntryRepository';
import { IAccountRepository } from '../../domain/ports/IAccountRepository';

export class GetTrialBalanceUseCase {
  constructor(
    private readonly entryRepo: IAccountEntryRepository,
    private readonly accountRepo: IAccountRepository
  ) {}

  async execute(
    query: { fromDate?: Date; toDate?: Date },
    context: { organizationId: string }
  ): Promise<TrialBalanceItem[]> {
    const rawItems = await this.entryRepo.getTrialBalance({
      organizationId: context.organizationId,
      fromDate: query.fromDate,
      toDate: query.toDate,
    });

    // Populate account names
    const enriched = await Promise.all(
      rawItems.map(async item => {
        const acc = await this.accountRepo.findById({
          id: item.accountId,
          organizationId: context.organizationId,
        });
        return {
          ...item,
          accountName: acc?.name || 'Unknown Account',
        };
      })
    );

    return enriched;
  }
}
