import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { InvoiceResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class GetOutstandingInvoicesReportUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    input: { customerId?: string },
    context: { organizationId: string }
  ): Promise<{ totalOutstanding: number; invoices: InvoiceResponseDto[] }> {
    const invoices = await this.invoiceRepo.findOutstanding({
      organizationId: context.organizationId,
      customerId: input.customerId,
    });

    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.balanceAmount, 0);

    return {
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      invoices: invoices.map(inv => AccountingMapper.toInvoiceDto(inv)),
    };
  }
}
