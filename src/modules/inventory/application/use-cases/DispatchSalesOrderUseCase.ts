import { ISalesOrderRepository } from '../../domain/ports/ISalesOrderRepository';
import { IProductRepository } from '../../domain/ports/IProductRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class DispatchSalesOrderUseCase {
  constructor(
    private readonly soRepo: ISalesOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

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

    await this.uow.runInTransaction(async () => {
      so.dispatch();

      for (const item of so.items) {
        const product = await this.productRepo.findById({
          id: item.productId,
          organizationId: context.organizationId,
        });
        if (product) {
          product.updateStock(so.branchId, -item.quantity);
          await this.productRepo.save(product);
        }
      }

      await this.soRepo.save(so);

      for (const event of so.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      so.clearDomainEvents();
    });

    return { salesOrderId: so.id, status: so.status };
  }
}
