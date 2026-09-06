import { IInvoiceRepository, ListInvoicesQuery } from '../../domain/ports/IInvoiceRepository';
import { InvoiceResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class ListInvoicesUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    query: Omit<ListInvoicesQuery, 'organizationId'>,
    context: { organizationId: string }
  ): Promise<{ data: InvoiceResponseDto[]; total: number }> {
    const result = await this.invoiceRepo.list({
      organizationId: context.organizationId,
      ...query,
    });

    return {
      data: result.data.map(inv => AccountingMapper.toInvoiceDto(inv)),
      total: result.total,
    };
  }
}
