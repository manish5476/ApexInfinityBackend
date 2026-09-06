import { IProductRepository } from '../../domain/ports/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { randomUUID } from 'crypto';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';

export interface CreateProductDto {
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  hsnCode?: string | null;
  categoryId?: string | null;
  purchasePrice?: number;
  sellingPrice: number;
  mrp?: number | null;
  taxRate?: number;
  defaultSupplierId?: string | null;
  tags?: string[];
}

export interface CreateProductResult {
  id: string;
  name: string;
  sku: string | null;
  sellingPrice: number;
  status: string;
}

export class CreateProductUseCase {
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(dto: CreateProductDto, context: { organizationId: string }): Promise<CreateProductResult> {
    if (dto.sku) {
      const existing = await this.productRepo.findBySku({ sku: dto.sku.toUpperCase(), organizationId: context.organizationId });
      if (existing) throw new Error(`Product with SKU '${dto.sku}' already exists`);
    }

    const product = Product.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      ...dto,
    });

    await this.productRepo.save(product);
    for (const event of product.domainEvents) {
      await this.eventBus.publishDomainEvent(event);
    }
    product.clearDomainEvents();

    return { id: product.id, name: product.name, sku: product.sku, sellingPrice: product.sellingPrice, status: product.status };
  }
}
