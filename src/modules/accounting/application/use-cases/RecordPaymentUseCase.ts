import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { IPaymentRepository } from '../../domain/ports/IPaymentRepository';
import { Payment } from '../../domain/entities/Payment';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';
import { randomUUID } from 'crypto';
import { PaymentMethod, PaymentType } from '../../domain/value-objects/AccountingEnums';

export interface RecordPaymentDto {
  invoiceId: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  referenceNumber?: string | null;
  transactionId?: string | null;
  bankName?: string | null;
  remarks?: string | null;
  createdBy?: string | null;
}

export class RecordPaymentUseCase {
  constructor(
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly paymentRepo: IPaymentRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: RecordPaymentDto, context: { organizationId: string }): Promise<{ paymentId: string; invoiceStatus: string; balanceAmount: number }> {
    const invoice = await this.invoiceRepo.findById({ id: dto.invoiceId, organizationId: context.organizationId });
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'cancelled') throw new Error('Cannot record payment on a cancelled invoice');
    if (invoice.balanceAmount <= 0) throw new Error('Invoice is already fully paid');

    const payment = Payment.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      type: PaymentType.INFLOW,
      invoiceId: dto.invoiceId,
      customerId: invoice.customerId ?? undefined,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      transactionId: dto.transactionId,
      bankName: dto.bankName,
      remarks: dto.remarks,
      createdBy: dto.createdBy,
    });

    // Apply payment to invoice — atomic
    await this.uow.runInTransaction(async () => {
      invoice.recordPayment(dto.amount);
      await this.invoiceRepo.save(invoice);
      await this.paymentRepo.save(payment);

      for (const event of payment.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      payment.clearDomainEvents();
    });

    return { paymentId: payment.id, invoiceStatus: invoice.status, balanceAmount: invoice.balanceAmount };
  }
}
