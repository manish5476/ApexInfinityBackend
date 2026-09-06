import { IStorefrontOrderRepository } from '../../domain/ports/IStorefrontOrderRepository';
import { StorefrontOrder, StorefrontOrderItem, StorefrontShippingAddress } from '../../domain/entities/StorefrontOrder';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';
import { randomUUID } from 'crypto';

export interface CreateStorefrontOrderDto {
  customerEmail: string;
  customerPhone?: string | null;
  customerId?: string | null;
  items: StorefrontOrderItem[];
  shippingAddress: StorefrontShippingAddress;
  shippingFee?: number;
  discount?: number;
  tax?: number;
}

export class CreateStorefrontOrderUseCase {
  constructor(
    private readonly orderRepo: IStorefrontOrderRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: CreateStorefrontOrderDto, context: { organizationId: string }): Promise<{ orderId: string; orderNumber: string; grandTotal: number }> {
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = StorefrontOrder.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      orderNumber,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      customerId: dto.customerId,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      shippingFee: dto.shippingFee,
      discount: dto.discount,
      tax: dto.tax,
    });

    await this.uow.runInTransaction(async () => {
      await this.orderRepo.save(order);
      for (const event of order.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      order.clearDomainEvents();
    });

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      grandTotal: order.totals.grandTotal,
    };
  }
}
