import { IPurchaseOrderRepository } from '../../domain/ports/IPurchaseOrderRepository';

export class CancelPurchaseOrderUseCase {
  constructor(private readonly poRepo: IPurchaseOrderRepository) {}

  async execute(
    params: { purchaseOrderId: string },
    context: { organizationId: string }
  ): Promise<{ purchaseOrderId: string; status: string }> {
    const po = await this.poRepo.findById({
      id: params.purchaseOrderId,
      organizationId: context.organizationId,
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    po.cancel();
    await this.poRepo.save(po);

    return { purchaseOrderId: po.id, status: po.status };
  }
}
