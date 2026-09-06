import { IPaymentRepository } from '../../domain/ports/IPaymentRepository';
import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository';
import { Payment } from '../../domain/entities/Payment';
import { CreatePaymentDto, PaymentResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';
import { randomUUID } from 'crypto';

export class CreatePaymentUseCase {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly invoiceRepo: IInvoiceRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: CreatePaymentDto, context: { organizationId: string }): Promise<PaymentResponseDto> {
    const payment = Payment.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      branchId: dto.branchId,
      type: dto.type,
      customerId: dto.customerId,
      supplierId: dto.supplierId,
      invoiceId: dto.invoiceId,
      purchaseId: dto.purchaseId,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
      referenceNumber: dto.referenceNumber,
      transactionId: dto.transactionId,
      bankName: dto.bankName,
      remarks: dto.remarks,
    });

    await this.uow.runInTransaction(async () => {
      if (dto.invoiceId) {
        const invoice = await this.invoiceRepo.findById({ id: dto.invoiceId, organizationId: context.organizationId });
        if (invoice && invoice.status !== 'cancelled' && invoice.balanceAmount > 0) {
          const applied = Math.min(dto.amount, invoice.balanceAmount);
          invoice.recordPayment(applied);
          payment.allocate({
            type: 'invoice',
            documentId: invoice.id,
            amount: applied,
          });
          await this.invoiceRepo.save(invoice);
        }
      }

      await this.paymentRepo.save(payment);

      for (const event of payment.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      payment.clearDomainEvents();
    });

    return AccountingMapper.toPaymentDto(payment);
  }
}
