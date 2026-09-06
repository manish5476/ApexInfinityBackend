import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { Invoice, CreateInvoiceParams } from '../../domain/entities/Invoice';
import { randomUUID } from 'crypto';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export type CreateInvoiceDto = Omit<CreateInvoiceParams, 'id' | 'organizationId'>;

export class CreateInvoiceUseCase {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: CreateInvoiceDto, context: { organizationId: string }): Promise<{ id: string; invoiceNumber: string; grandTotal: number; status: string }> {
    const existing = await this.invoiceRepo.findByInvoiceNumber({ invoiceNumber: dto.invoiceNumber, organizationId: context.organizationId });
    if (existing) throw new Error(`Invoice number '${dto.invoiceNumber}' already exists`);

    const invoice = Invoice.create({ id: randomUUID(), organizationId: context.organizationId, ...dto });

    await this.uow.runInTransaction(async () => {
      await this.invoiceRepo.save(invoice);
      for (const event of invoice.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      invoice.clearDomainEvents();
    });

    return { id: invoice.id, invoiceNumber: invoice.invoiceNumber, grandTotal: invoice.grandTotal, status: invoice.status };
  }
}
