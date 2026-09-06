import { ISalesOrderRepository } from '../../domain/ports/ISalesOrderRepository';

export class CancelSalesOrderUseCase {
  constructor(private readonly soRepo: ISalesOrderRepository) {}

  async execute(
    params: { salesOrderId: string },
    context: { organizationId: string }
  ): Promise<{ salesOrderId: string; status: string }> {
    const so = await this.soRepo.findById({
      id: params.salesOrderId,
      organizationId: context.organizationId,
    });

    if (!so) {
      throw new Error('Sales order not found');
    }

    so.cancel();
    await this.soRepo.save(so);

    return { salesOrderId: so.id, status: so.status };
  }
}
