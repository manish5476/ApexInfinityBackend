import { IProductRepository, ListProductsQuery } from '../../domain/ports/IProductRepository';
import { Product } from '../../domain/entities/Product';

export class InMemoryProductRepository implements IProductRepository {
  public products: Product[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Product | null> {
    const p = this.products.find(x => x.id === query.id && x.organizationId === query.organizationId);
    return p ? Product.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async findByIds(query: { ids: string[]; organizationId: string }): Promise<Product[]> {
    const set = new Set(query.ids);
    return this.products
      .filter(x => set.has(x.id) && x.organizationId === query.organizationId)
      .map(p => Product.reconstitute({ ...p.props, id: p.id }));
  }

  async findBySku(query: { sku: string; organizationId: string }): Promise<Product | null> {
    const s = query.sku.toUpperCase().trim();
    const p = this.products.find(x => x.sku === s && x.organizationId === query.organizationId);
    return p ? Product.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async findByBarcode(query: { barcode: string; organizationId: string }): Promise<Product | null> {
    const b = query.barcode.trim();
    const p = this.products.find(x => x.barcode === b && x.organizationId === query.organizationId);
    return p ? Product.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async findByScan(query: { code: string; organizationId: string }): Promise<Product | null> {
    const c = query.code.trim();
    const cUpper = c.toUpperCase();
    const p = this.products.find(
      x =>
        x.organizationId === query.organizationId &&
        ((x.barcode && x.barcode === c) || (x.sku && x.sku.toUpperCase() === cUpper))
    );
    return p ? Product.reconstitute({ ...p.props, id: p.id }) : null;
  }

  async findLowStock(query: { organizationId: string; branchId?: string; limit?: number }): Promise<Product[]> {
    const filtered = this.products.filter(
      p => p.organizationId === query.organizationId && !p.isDeleted && p.isLowStock(query.branchId)
    );
    const limit = query.limit ?? 50;
    return filtered.slice(0, limit).map(p => Product.reconstitute({ ...p.props, id: p.id }));
  }

  async search(query: { organizationId: string; query: string; limit?: number }): Promise<Product[]> {
    const q = query.query.toLowerCase().trim();
    const limit = query.limit ?? 20;
    const filtered = this.products.filter(p => {
      if (p.organizationId !== query.organizationId || p.isDeleted) return false;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    });
    return filtered.slice(0, limit).map(p => Product.reconstitute({ ...p.props, id: p.id }));
  }

  async save(product: Product): Promise<void> {
    const idx = this.products.findIndex(x => x.id === product.id);
    if (idx >= 0) {
      this.products[idx] = Product.reconstitute({ ...product.props, id: product.id });
    } else {
      this.products.push(Product.reconstitute({ ...product.props, id: product.id }));
    }
  }

  async list(query: ListProductsQuery): Promise<{ data: Product[]; total: number }> {
    let filtered = this.products.filter(p => p.organizationId === query.organizationId);

    if (query.isDeleted !== undefined) {
      filtered = filtered.filter(p => p.isDeleted === query.isDeleted);
    } else {
      filtered = filtered.filter(p => !p.isDeleted);
    }

    if (query.status) {
      filtered = filtered.filter(p => p.status === query.status);
    }

    if (query.categoryId) {
      filtered = filtered.filter(p => p.categoryId === query.categoryId);
    }

    if (query.search) {
      const s = query.search.toLowerCase().trim();
      filtered = filtered.filter(
        p =>
          p.name.toLowerCase().includes(s) ||
          (p.sku ?? '').toLowerCase().includes(s) ||
          (p.barcode ?? '').toLowerCase().includes(s)
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;
    return {
      data: filtered.slice(start, start + limit).map(p => Product.reconstitute({ ...p.props, id: p.id })),
      total: filtered.length,
    };
  }
}
