import { ISalesOrderRepository } from '../../domain/ports/ISalesOrderRepository';
import { IProductRepository } from '../../domain/ports/IProductRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';
import { randomUUID } from 'crypto';
import { SalesOrder } from '../../domain/entities/SalesOrder';

export interface CreateSalesOrderDto {
  branchId: string;
  customerId?: string | null;
  items: Array<{ productId: string; name: string; quantity: number; price: number; taxRate?: number; discount?: number }>;
  notes?: string | null;
  createdBy?: string | null;
}

export class CreateSalesOrderUseCase {
  constructor(
    private readonly soRepo: ISalesOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: CreateSalesOrderDto, context: { organizationId: string }): Promise<{ id: string; grandTotal: number; status: string }> {
    // Validate stock availability
    for (const item of dto.items) {
      const product = await this.productRepo.findById({ id: item.productId, organizationId: context.organizationId });
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.availableStock < item.quantity) throw new Error(`Insufficient stock for product '${product.name}'`);
    }

    const so = SalesOrder.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      items: dto.items.map(i => ({ ...i, taxRate: i.taxRate ?? 0, discount: i.discount ?? 0 })),
      notes: dto.notes,
      createdBy: dto.createdBy,
    });

    await this.uow.runInTransaction(async () => {
      await this.soRepo.save(so);
    });

    return { id: so.id, grandTotal: so.grandTotal, status: so.status };
  }
}
