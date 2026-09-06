import { IPaymentRepository } from '../../domain/ports/IPaymentRepository';

export class CancelPaymentUseCase {
  constructor(private readonly paymentRepo: IPaymentRepository) {}

  async execute(
    input: { id: string },
    context: { organizationId: string }
  ): Promise<{ message: string; status: string }> {
    const payment = await this.paymentRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    payment.cancel();
    await this.paymentRepo.save(payment);

    return { message: 'Payment cancelled successfully', status: payment.status };
  }
}
