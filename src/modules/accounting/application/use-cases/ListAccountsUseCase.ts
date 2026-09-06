import { IAccountRepository, ListAccountsQuery } from '../../domain/ports/IAccountRepository';
import { AccountResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class ListAccountsUseCase {
  constructor(private readonly accountRepo: IAccountRepository) {}

  async execute(
    query: Omit<ListAccountsQuery, 'organizationId'>,
    context: { organizationId: string }
  ): Promise<{ data: AccountResponseDto[]; total: number }> {
    const result = await this.accountRepo.list({
      organizationId: context.organizationId,
      ...query,
    });

    return {
      data: result.data.map(a => AccountingMapper.toAccountDto(a)),
      total: result.total,
    };
  }
}
