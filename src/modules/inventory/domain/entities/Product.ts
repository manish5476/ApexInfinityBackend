import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { ProductStatus } from '../value-objects/InventoryEnums';
import { ProductCreatedEvent } from '../events/ProductCreatedEvent';

export interface ProductInventoryEntry {
  branchId: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  rackLocation?: string | null;
}

export interface ProductProps {
  organizationId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  hsnCode?: string | null;
  categoryId?: string | null;
  subCategoryId?: string | null;
  brandId?: string | null;
  unitId?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  mrp?: number | null;
  discountedPrice?: number | null;
  taxRate: number;
  isTaxInclusive: boolean;
  status: ProductStatus;
  inventory: ProductInventoryEntry[];
  defaultSupplierId?: string | null;
  tags: string[];
  images?: string[];
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductParams {
  id: string;
  organizationId: string;
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
  images?: string[];
}

export interface UpdateProductDetailsParams {
  name?: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  hsnCode?: string | null;
  categoryId?: string | null;
  purchasePrice?: number;
  sellingPrice?: number;
  mrp?: number | null;
  taxRate?: number;
  defaultSupplierId?: string | null;
  tags?: string[];
  images?: string[];
  status?: ProductStatus;
}

export class Product extends AggregateRoot<string> {
  private _organizationId: string;
  private _name: string;
  private _slug: string | null;
  private _description: string | null;
  private _sku: string | null;
  private _barcode: string | null;
  private _hsnCode: string | null;
  private _categoryId: string | null;
  private _subCategoryId: string | null;
  private _brandId: string | null;
  private _unitId: string | null;
  private _purchasePrice: number;
  private _sellingPrice: number;
  private _mrp: number | null;
  private _discountedPrice: number | null;
  private _taxRate: number;
  private _isTaxInclusive: boolean;
  private _status: ProductStatus;
  private _inventory: ProductInventoryEntry[];
  private _defaultSupplierId: string | null;
  private _tags: string[];
  private _images: string[];
  private _isDeleted: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: string, props: ProductProps) {
    super(id);
    this._organizationId = props.organizationId;
    this._name = props.name;
    this._slug = props.slug ?? null;
    this._description = props.description ?? null;
    this._sku = props.sku ?? null;
    this._barcode = props.barcode ?? null;
    this._hsnCode = props.hsnCode ?? null;
    this._categoryId = props.categoryId ?? null;
    this._subCategoryId = props.subCategoryId ?? null;
    this._brandId = props.brandId ?? null;
    this._unitId = props.unitId ?? null;
    this._purchasePrice = props.purchasePrice;
    this._sellingPrice = props.sellingPrice;
    this._mrp = props.mrp ?? null;
    this._discountedPrice = props.discountedPrice ?? null;
    this._taxRate = props.taxRate;
    this._isTaxInclusive = props.isTaxInclusive;
    this._status = props.status;
    this._inventory = props.inventory;
    this._defaultSupplierId = props.defaultSupplierId ?? null;
    this._tags = props.tags ?? [];
    this._images = props.images ?? [];
    this._isDeleted = props.isDeleted ?? false;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(params: CreateProductParams): Product {
    if (params.sellingPrice < 0) throw new Error('Selling price cannot be negative');
    if (params.mrp !== undefined && params.mrp !== null && params.mrp < params.sellingPrice) {
      throw new Error('MRP cannot be less than selling price');
    }
    const now = new Date();
    const product = new Product(params.id, {
      organizationId: params.organizationId,
      name: params.name,
      slug: null,
      description: params.description ?? null,
      sku: params.sku ? params.sku.toUpperCase().trim() : null,
      barcode: params.barcode ? params.barcode.trim() : null,
      hsnCode: params.hsnCode ?? null,
      categoryId: params.categoryId ?? null,
      subCategoryId: null,
      brandId: null,
      unitId: null,
      purchasePrice: params.purchasePrice ?? 0,
      sellingPrice: params.sellingPrice,
      mrp: params.mrp ?? null,
      discountedPrice: null,
      taxRate: params.taxRate ?? 0,
      isTaxInclusive: false,
      status: ProductStatus.ACTIVE,
      inventory: [],
      defaultSupplierId: params.defaultSupplierId ?? null,
      tags: params.tags ?? [],
      images: params.images ?? [],
      isDeleted: false,
      createdAt: now,
      updatedAt: now,
    });
    product.addDomainEvent(new ProductCreatedEvent(params.id, params.organizationId));
    return product;
  }

  static reconstitute(props: ProductProps & { id: string }): Product {
    return new Product(props.id, props);
  }

  get organizationId() { return this._organizationId; }
  get name() { return this._name; }
  get slug() { return this._slug; }
  get description() { return this._description; }
  get sku() { return this._sku; }
  get barcode() { return this._barcode; }
  get hsnCode() { return this._hsnCode; }
  get categoryId() { return this._categoryId; }
  get purchasePrice() { return this._purchasePrice; }
  get sellingPrice() { return this._sellingPrice; }
  get mrp() { return this._mrp; }
  get taxRate() { return this._taxRate; }
  get status() { return this._status; }
  get inventory() { return this._inventory; }
  get defaultSupplierId() { return this._defaultSupplierId; }
  get tags() { return [...this._tags]; }
  get images() { return [...this._images]; }
  get isDeleted() { return this._isDeleted; }
  get createdAt() { return this._createdAt; }
  get updatedAt() { return this._updatedAt; }

  get totalStock(): number {
    return this._inventory.reduce((sum, i) => sum + i.quantity, 0);
  }

  get availableStock(): number {
    return this._inventory.reduce((sum, i) => sum + (i.quantity - (i.reservedQuantity || 0)), 0);
  }

  updateStock(branchId: string, quantity: number): void {
    const entry = this._inventory.find(i => i.branchId === branchId);
    if (entry) {
      entry.quantity = Math.max(0, entry.quantity + quantity);
    } else {
      this._inventory.push({ branchId, quantity: Math.max(0, quantity), reservedQuantity: 0, reorderLevel: 10 });
    }
    this._updatedAt = new Date();
  }

  adjustStock(branchId: string, delta: number, reason?: string): void {
    const entry = this._inventory.find(i => i.branchId === branchId);
    if (entry) {
      entry.quantity = Math.max(0, entry.quantity + delta);
    } else {
      this._inventory.push({
        branchId,
        quantity: Math.max(0, delta),
        reservedQuantity: 0,
        reorderLevel: 10,
        rackLocation: reason ?? null,
      });
    }
    this._updatedAt = new Date();
  }

  transferStock(fromBranchId: string, toBranchId: string, quantity: number): void {
    if (quantity <= 0) throw new Error('Transfer quantity must be greater than zero');
    if (fromBranchId === toBranchId) throw new Error('Source and destination branches cannot be the same');

    const fromEntry = this._inventory.find(i => i.branchId === fromBranchId);
    const currentFromQty = fromEntry ? fromEntry.quantity : 0;
    if (currentFromQty < quantity) {
      throw new Error(`Insufficient stock in source branch. Available: ${currentFromQty}, Requested: ${quantity}`);
    }

    fromEntry!.quantity -= quantity;

    let toEntry = this._inventory.find(i => i.branchId === toBranchId);
    if (toEntry) {
      toEntry.quantity += quantity;
    } else {
      this._inventory.push({ branchId: toBranchId, quantity, reservedQuantity: 0, reorderLevel: 10 });
    }
    this._updatedAt = new Date();
  }

  updateDetails(params: UpdateProductDetailsParams): void {
    if (params.name !== undefined) {
      if (!params.name.trim()) throw new Error('Product name cannot be empty');
      this._name = params.name.trim();
    }
    if (params.description !== undefined) this._description = params.description;
    if (params.sku !== undefined) this._sku = params.sku ? params.sku.toUpperCase().trim() : null;
    if (params.barcode !== undefined) this._barcode = params.barcode ? params.barcode.trim() : null;
    if (params.hsnCode !== undefined) this._hsnCode = params.hsnCode ? params.hsnCode.trim() : null;
    if (params.categoryId !== undefined) this._categoryId = params.categoryId;
    if (params.purchasePrice !== undefined) {
      if (params.purchasePrice < 0) throw new Error('Purchase price cannot be negative');
      this._purchasePrice = params.purchasePrice;
    }
    if (params.sellingPrice !== undefined) {
      if (params.sellingPrice < 0) throw new Error('Selling price cannot be negative');
      this._sellingPrice = params.sellingPrice;
    }
    if (params.mrp !== undefined) {
      if (params.mrp !== null && params.mrp < this._sellingPrice) {
        throw new Error('MRP cannot be less than selling price');
      }
      this._mrp = params.mrp;
    }
    if (params.taxRate !== undefined) this._taxRate = params.taxRate;
    if (params.defaultSupplierId !== undefined) this._defaultSupplierId = params.defaultSupplierId;
    if (params.tags !== undefined) this._tags = params.tags.filter(t => t && t.trim().length > 0).map(t => t.trim());
    if (params.images !== undefined) this._images = params.images;
    if (params.status !== undefined) this._status = params.status;

    this._updatedAt = new Date();
  }

  isLowStock(branchId?: string): boolean {
    if (branchId) {
      const entry = this._inventory.find(i => i.branchId === branchId);
      return entry ? entry.quantity <= (entry.reorderLevel || 10) : true;
    }
    return this._inventory.some(i => i.quantity <= (i.reorderLevel || 10));
  }

  softDelete(): void {
    this._isDeleted = true;
    this._status = ProductStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  restore(): void {
    this._isDeleted = false;
    this._status = ProductStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._status = ProductStatus.INACTIVE;
    this._updatedAt = new Date();
  }

  get props(): ProductProps {
    return {
      organizationId: this._organizationId,
      name: this._name,
      slug: this._slug,
      description: this._description,
      sku: this._sku,
      barcode: this._barcode,
      hsnCode: this._hsnCode,
      categoryId: this._categoryId,
      subCategoryId: this._subCategoryId,
      brandId: this._brandId,
      unitId: this._unitId,
      purchasePrice: this._purchasePrice,
      sellingPrice: this._sellingPrice,
      mrp: this._mrp,
      discountedPrice: this._discountedPrice,
      taxRate: this._taxRate,
      isTaxInclusive: this._isTaxInclusive,
      status: this._status,
      inventory: this._inventory,
      defaultSupplierId: this._defaultSupplierId,
      tags: [...this._tags],
      images: [...this._images],
      isDeleted: this._isDeleted,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

