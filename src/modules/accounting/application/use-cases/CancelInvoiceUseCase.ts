import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';

export class CancelInvoiceUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<{ message: string; status: string }> {
    const invoice = await this.invoiceRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.cancel();
    await this.invoiceRepo.save(invoice);

    return { message: 'Invoice cancelled successfully', status: invoice.status };
  }
}
