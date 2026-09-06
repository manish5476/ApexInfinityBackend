import { IProductRepository, ListProductsQuery } from '../../domain/ports/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductModel, IProductDoc } from '../persistence/product.model';
import { ProductStatus } from '../../domain/value-objects/InventoryEnums';

export class MongoProductRepository implements IProductRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Product | null> {
    const doc = await ProductModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<IProductDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByIds(query: { ids: string[]; organizationId: string }): Promise<Product[]> {
    if (!query.ids.length) return [];
    const docs = await ProductModel.find({ _id: { $in: query.ids }, organizationId: query.organizationId }).lean<IProductDoc[]>();
    return docs.map(d => this.mapToDomain(d));
  }

  async findBySku(query: { sku: string; organizationId: string }): Promise<Product | null> {
    const doc = await ProductModel.findOne({
      sku: query.sku.toUpperCase().trim(),
      organizationId: query.organizationId,
    }).lean<IProductDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByBarcode(query: { barcode: string; organizationId: string }): Promise<Product | null> {
    const doc = await ProductModel.findOne({
      barcode: query.barcode.trim(),
      organizationId: query.organizationId,
    }).lean<IProductDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByScan(query: { code: string; organizationId: string }): Promise<Product | null> {
    const code = query.code.trim();
    const doc = await ProductModel.findOne({
      organizationId: query.organizationId,
      $or: [
        { barcode: code },
        { sku: code.toUpperCase() },
      ],
    }).lean<IProductDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findLowStock(query: { organizationId: string; branchId?: string; limit?: number }): Promise<Product[]> {
    const limit = query.limit || 50;
    const docs = await ProductModel.find({
      organizationId: query.organizationId,
      isDeleted: false,
    }).lean<IProductDoc[]>();

    const domainProducts = docs.map(d => this.mapToDomain(d));
    const lowStock = domainProducts.filter(p => p.isLowStock(query.branchId));
    return lowStock.slice(0, limit);
  }

  async search(query: { organizationId: string; query: string; limit?: number }): Promise<Product[]> {
    const limit = query.limit || 20;
    const term = query.query.trim();
    if (!term) return [];

    const regex = new RegExp(term, 'i');
    const docs = await ProductModel.find({
      organizationId: query.organizationId,
      isDeleted: false,
      $or: [
        { name: regex },
        { sku: regex },
        { barcode: regex },
        { tags: regex },
      ],
    })
      .limit(limit)
      .lean<IProductDoc[]>();

    return docs.map(d => this.mapToDomain(d));
  }

  async save(product: Product): Promise<void> {
    await ProductModel.updateOne(
      { _id: product.id, organizationId: product.organizationId },
      { $set: product.props },
      { upsert: true }
    );
  }

  async list(query: ListProductsQuery): Promise<{ data: Product[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.isDeleted !== undefined) {
      filter.isDeleted = query.isDeleted;
    } else {
      filter.isDeleted = false;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.categoryId) {
      filter.categoryId = query.categoryId;
    }

    if (query.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ name: regex }, { sku: regex }, { barcode: regex }];
    }

    const [docs, total] = await Promise.all([
      ProductModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean<IProductDoc[]>(),
      ProductModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: IProductDoc): Product {
    return Product.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      name: doc.name,
      slug: doc.slug,
      description: doc.description,
      sku: doc.sku,
      barcode: doc.barcode,
      hsnCode: doc.hsnCode,
      categoryId: doc.categoryId,
      subCategoryId: doc.subCategoryId,
      brandId: doc.brandId,
      unitId: doc.unitId,
      purchasePrice: doc.purchasePrice,
      sellingPrice: doc.sellingPrice,
      mrp: doc.mrp,
      discountedPrice: doc.discountedPrice,
      taxRate: doc.taxRate,
      isTaxInclusive: doc.isTaxInclusive,
      status: doc.status as ProductStatus,
      inventory: doc.inventory || [],
      defaultSupplierId: doc.defaultSupplierId,
      tags: doc.tags || [],
      images: doc.images || [],
      isDeleted: doc.isDeleted || false,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
