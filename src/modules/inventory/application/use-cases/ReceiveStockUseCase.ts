import { IPurchaseOrderRepository } from '../../domain/ports/IPurchaseOrderRepository';
import { IProductRepository } from '../../domain/ports/IProductRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class ReceiveStockUseCase {
  constructor(
    private readonly poRepo: IPurchaseOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(params: { purchaseOrderId: string }, context: { organizationId: string }): Promise<{ purchaseOrderId: string; status: string }> {
    const po = await this.poRepo.findById({ id: params.purchaseOrderId, organizationId: context.organizationId });
    if (!po) throw new Error('Purchase order not found');

    await this.uow.runInTransaction(async () => {
      po.receive(); // triggers StockReceivedEvent

      // Update stock for each product
      for (const item of po.items) {
        const product = await this.productRepo.findById({ id: item.productId, organizationId: context.organizationId });
        if (product) {
          product.updateStock(po.branchId, item.quantity);
          await this.productRepo.save(product);
        }
      }

      await this.poRepo.save(po);

      for (const event of po.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      po.clearDomainEvents();
    });

    return { purchaseOrderId: po.id, status: po.status };
  }
}
