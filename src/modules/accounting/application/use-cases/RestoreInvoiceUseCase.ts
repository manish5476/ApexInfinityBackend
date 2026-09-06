import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { InvoiceResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class RestoreInvoiceUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.restore();
    await this.invoiceRepo.save(invoice);

    return AccountingMapper.toInvoiceDto(invoice);
  }
}
