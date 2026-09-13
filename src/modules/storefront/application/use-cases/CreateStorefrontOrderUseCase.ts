import { IStorefrontOrderRepository } from '../../domain/ports/IStorefrontOrderRepository';
import { StorefrontOrder, StorefrontOrderItem, StorefrontShippingAddress } from '../../domain/entities/StorefrontOrder';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';
import { IProductRepository } from '../../../inventory/domain/ports/IProductRepository';
import { randomUUID } from 'crypto';

export interface CreateStorefrontOrderItemInput {
  productId: string;
  quantity: number;
  name?: string;
  unitPrice?: number;
  lineTotal?: number;
}

export interface CreateStorefrontOrderDto {
  customerEmail: string;
  customerPhone?: string | null;
  customerId?: string | null;
  items: CreateStorefrontOrderItemInput[];
  shippingAddress: StorefrontShippingAddress;
  couponCode?: string;
  shippingFee?: number;
  discount?: number;
  tax?: number;
}

export class CreateStorefrontOrderUseCase {
  constructor(
    private readonly orderRepo: IStorefrontOrderRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork,
    private readonly productRepo?: IProductRepository
  ) {}

  async execute(dto: CreateStorefrontOrderDto, context: { organizationId: string }): Promise<{ orderId: string; orderNumber: string; grandTotal: number }> {
    if (!dto.items || dto.items.length === 0) {
      throw new Error('Storefront order must contain at least one item');
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const validatedItems: StorefrontOrderItem[] = [];
    let computedTax = 0;

    // Server-side repricing & inventory verification if product repository is provided
    if (this.productRepo) {
      for (const item of dto.items) {
        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Invalid quantity for product ${item.productId}`);
        }

        const product = await this.productRepo.findById({
          id: item.productId,
          organizationId: context.organizationId,
        });

        if (!product || product.isDeleted) {
          throw new Error(`Product ${item.productId} is not available`);
        }

        if (product.availableStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${product.availableStock}, requested: ${item.quantity}`);
        }

        const unitPrice = (product as any).props?.discountedPrice && (product as any).props?.discountedPrice < product.sellingPrice
          ? (product as any).props.discountedPrice
          : product.sellingPrice;

        const lineTotal = parseFloat((unitPrice * item.quantity).toFixed(2));

        if (product.taxRate && !product.props.isTaxInclusive) {
          computedTax += parseFloat(((lineTotal * product.taxRate) / 100).toFixed(2));
        }

        validatedItems.push({
          productId: product.id,
          name: product.name,
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }
    } else {
      // Fallback for tests or pure domain execution
      for (const item of dto.items) {
        const unitPrice = item.unitPrice ?? 0;
        const lineTotal = item.lineTotal ?? (unitPrice * item.quantity);
        validatedItems.push({
          productId: item.productId,
          name: item.name || 'Item',
          quantity: item.quantity,
          unitPrice,
          lineTotal,
        });
      }
    }

    const order = StorefrontOrder.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      orderNumber,
      customerEmail: dto.customerEmail,
      customerPhone: dto.customerPhone,
      customerId: dto.customerId,
      items: validatedItems,
      shippingAddress: dto.shippingAddress,
      shippingFee: dto.shippingFee ?? 0,
      discount: dto.discount ?? 0,
      tax: dto.tax !== undefined ? dto.tax : computedTax,
    });

    await this.uow.runInTransaction(async () => {
      // Deduct inventory within transaction if productRepo is available
      if (this.productRepo) {
        for (const item of validatedItems) {
          const product = await this.productRepo.findById({
            id: item.productId,
            organizationId: context.organizationId,
          });
          if (product) {
            product.adjustStock('default', -item.quantity);
            await this.productRepo.save(product);
          }
        }
      }

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
