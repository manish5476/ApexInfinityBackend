import { IPaymentRepository } from '../../domain/ports/IPaymentRepository';
import { PaymentResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class GetCustomerPaymentsUseCase {
  constructor(private readonly paymentRepo: IPaymentRepository) {}

  async execute(
    input: { customerId: string },
    context: { organizationId: string }
  ): Promise<PaymentResponseDto[]> {
    const payments = await this.paymentRepo.findByCustomerId({
      customerId: input.customerId,
      organizationId: context.organizationId,
    });

    return payments.map(p => AccountingMapper.toPaymentDto(p));
  }
}
