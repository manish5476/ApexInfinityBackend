import { IProductRepository } from '../../domain/ports/IProductRepository';
import { UpdateProductDto, ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';
import { ProductStatus } from '../../domain/value-objects/InventoryEnums';

export class UpdateProductUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: { id: string; data: UpdateProductDto },
    context: { organizationId: string }
  ): Promise<ProductResponseDto> {
    const product = await this.productRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (input.data.sku && input.data.sku.toUpperCase().trim() !== (product.sku || '')) {
      const existing = await this.productRepo.findBySku({
        sku: input.data.sku.toUpperCase().trim(),
        organizationId: context.organizationId,
      });
      if (existing && existing.id !== product.id) {
        throw new Error(`Product with SKU '${input.data.sku}' already exists`);
      }
    }

    product.updateDetails({
      name: input.data.name,
      description: input.data.description,
      sku: input.data.sku,
      barcode: input.data.barcode,
      hsnCode: input.data.hsnCode,
      categoryId: input.data.categoryId,
      purchasePrice: input.data.purchasePrice,
      sellingPrice: input.data.sellingPrice,
      mrp: input.data.mrp,
      taxRate: input.data.taxRate,
      defaultSupplierId: input.data.defaultSupplierId,
      tags: input.data.tags,
      images: input.data.images,
      status: input.data.status as ProductStatus | undefined,
    });

    await this.productRepo.save(product);

    return ProductMapper.toDto(product);
  }
}
