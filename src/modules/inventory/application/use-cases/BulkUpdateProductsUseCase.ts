import { IProductRepository } from '../../domain/ports/IProductRepository';
import { BulkUpdateProductsDto, ProductResponseDto } from '../dto/inventory.dto';
import { ProductMapper } from '../mappers/ProductMapper';
import { ProductStatus } from '../../domain/value-objects/InventoryEnums';

export class BulkUpdateProductsUseCase {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(
    input: BulkUpdateProductsDto,
    context: { organizationId: string }
  ): Promise<{ updatedCount: number; products: ProductResponseDto[] }> {
    const updatedProducts: ProductResponseDto[] = [];

    for (const item of input.items) {
      const product = await this.productRepo.findById({
        id: item.id,
        organizationId: context.organizationId,
      });

      if (!product) continue;

      product.updateDetails({
        name: item.data.name,
        description: item.data.description,
        sku: item.data.sku,
        barcode: item.data.barcode,
        hsnCode: item.data.hsnCode,
        categoryId: item.data.categoryId,
        purchasePrice: item.data.purchasePrice,
        sellingPrice: item.data.sellingPrice,
        mrp: item.data.mrp,
        taxRate: item.data.taxRate,
        defaultSupplierId: item.data.defaultSupplierId,
        tags: item.data.tags,
        images: item.data.images,
        status: item.data.status as ProductStatus | undefined,
      });

      await this.productRepo.save(product);
      updatedProducts.push(ProductMapper.toDto(product));
    }

    return {
      updatedCount: updatedProducts.length,
      products: updatedProducts,
    };
  }
}
