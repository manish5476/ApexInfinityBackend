import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { CustomerInvoiceSummaryDto } from '../dto/accounting.dto';

export class GetCustomerInvoiceSummaryUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    input: { customerId: string },
    context: { organizationId: string }
  ): Promise<CustomerInvoiceSummaryDto> {
    const invoices = await this.invoiceRepo.findByCustomerId({
      customerId: input.customerId,
      organizationId: context.organizationId,
    });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    for (const inv of invoices) {
      if (inv.status !== 'cancelled') {
        totalBilled += inv.grandTotal;
        totalPaid += inv.paidAmount;
        totalOutstanding += inv.balanceAmount;
      }
    }

    return {
      customerId: input.customerId,
      totalInvoices: invoices.length,
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
    };
  }
}
