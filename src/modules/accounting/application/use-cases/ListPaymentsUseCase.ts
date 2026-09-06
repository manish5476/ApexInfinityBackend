import { IPaymentRepository, ListPaymentsQuery } from '../../domain/ports/IPaymentRepository';
import { PaymentResponseDto } from '../dto/accounting.dto';
import { AccountingMapper } from '../mappers/AccountingMapper';

export class ListPaymentsUseCase {
  constructor(private readonly paymentRepo: IPaymentRepository) {}

  async execute(
    query: Omit<ListPaymentsQuery, 'organizationId'>,
    context: { organizationId: string }
  ): Promise<{ data: PaymentResponseDto[]; total: number }> {
    const result = await this.paymentRepo.list({
      organizationId: context.organizationId,
      ...query,
    });

    return {
      data: result.data.map(p => AccountingMapper.toPaymentDto(p)),
      total: result.total,
    };
  }
}
