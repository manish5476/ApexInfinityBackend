import { IPaymentRepository } from '../../domain/ports/IPaymentRepository';
import { PaymentResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class GetPaymentByIdUseCase {
  constructor(private readonly paymentRepo: IPaymentRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return AccountingMapper.toPaymentDto(payment);
  }
}
