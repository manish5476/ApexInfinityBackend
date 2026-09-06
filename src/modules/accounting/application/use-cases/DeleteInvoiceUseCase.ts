import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';

export class DeleteInvoiceUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<{ message: string }> {
    const invoice = await this.invoiceRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.softDelete();
    await this.invoiceRepo.save(invoice);

    return { message: 'Invoice deleted successfully' };
  }
}
