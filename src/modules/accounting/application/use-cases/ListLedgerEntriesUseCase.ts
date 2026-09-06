import { IAccountEntryRepository, ListLedgerEntriesQuery } from '../../domain/ports/IAccountEntryRepository';
import { LedgerEntryResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class ListLedgerEntriesUseCase {
  constructor(private readonly entryRepo: IAccountEntryRepository) {}

  async execute(
    query: Omit<ListLedgerEntriesQuery, 'organizationId'>,
    context: { organizationId: string }
  ): Promise<{ data: LedgerEntryResponseDto[]; total: number }> {
    const result = await this.entryRepo.list({
      organizationId: context.organizationId,
      ...query,
    });

    return {
      data: result.data.map(e => AccountingMapper.toLedgerEntryDto(e)),
      total: result.total,
    };
  }
}
