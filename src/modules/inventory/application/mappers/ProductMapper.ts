import { Product } from '../../domain/entities/Product';
import { ProductResponseDto } from '../dto/inventory.dto';

export class ProductMapper {
  static toDto(product: Product): ProductResponseDto {
    const p = product.props;
    return {
      id: product.id,
      organizationId: p.organizationId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      sku: p.sku,
      barcode: p.barcode,
      hsnCode: p.hsnCode,
      categoryId: p.categoryId,
      subCategoryId: p.subCategoryId,
      brandId: p.brandId,
      unitId: p.unitId,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp,
      discountedPrice: p.discountedPrice,
      taxRate: p.taxRate,
      isTaxInclusive: p.isTaxInclusive,
      status: p.status,
      inventory: p.inventory,
      defaultSupplierId: p.defaultSupplierId,
      tags: p.tags,
      images: p.images || [],
      isDeleted: p.isDeleted ?? false,
      totalStock: product.totalStock,
      availableStock: product.availableStock,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
