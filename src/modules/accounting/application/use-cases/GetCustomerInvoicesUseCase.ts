import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { InvoiceResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class GetCustomerInvoicesUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    input: { customerId: string; limit?: number },
    context: { organizationId: string }
  ): Promise<InvoiceResponseDto[]> {
    const invoices = await this.invoiceRepo.findByCustomerId({
      customerId: input.customerId,
      organizationId: context.organizationId,
      limit: input.limit,
    });

    return invoices.map(inv => AccountingMapper.toInvoiceDto(inv));
  }
}
