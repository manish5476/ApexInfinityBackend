import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { UpdateInvoiceDto, InvoiceResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class UpdateInvoiceUseCase {
  constructor(private readonly invoiceRepo: IInvoiceRepository) {}

  async execute(
    input: { id: string; data: UpdateInvoiceDto },
    context: { organizationId: string }
  ): Promise<InvoiceResponseDto> {
    const invoice = await this.invoiceRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.updateDetails({
      dueDate: input.data.dueDate ? new Date(input.data.dueDate) : undefined,
      notes: input.data.notes,
      billingAddress: input.data.billingAddress,
      shippingAddress: input.data.shippingAddress,
      paymentMethod: input.data.paymentMethod,
    });

    await this.invoiceRepo.save(invoice);

    return AccountingMapper.toInvoiceDto(invoice);
  }
}
