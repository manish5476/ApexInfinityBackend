import { Request, Response, NextFunction } from "express";
import { GetPublicPageBySlugUseCase } from "../../application/use-cases/GetPublicPageBySlugUseCase";
import { CreateStorefrontOrderUseCase } from "../../application/use-cases/CreateStorefrontOrderUseCase";
import { ProductModel } from "../../../inventory/infrastructure/persistence";
import {
  StorefrontCouponModel,
  StorefrontCustomerModel,
  StorefrontOrderModel,
  StorefrontLayoutModel,
  StorefrontCartModel,
  StorefrontCartItemModel,
  StorefrontCustomerAddressModel,
  StorefrontWishlistModel,
} from "../../infrastructure/persistence";
import { OrganizationModel } from "../../../organization/infrastructure/persistence";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

const STOREFRONT_JWT_SECRET = process.env.STOREFRONT_JWT_SECRET || process.env.JWT_SECRET || "changeme";
const STOREFRONT_JWT_EXPIRES_IN = "7d";
const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Canonical filter for publicly visible, active products â€” fixes FUNC-007 */
const ACTIVE_PRODUCT_FILTER = { status: "active", storefrontVisible: true, isDeleted: false } as const;

export class StorefrontPublicController {
  constructor(
    private readonly getPageBySlug: GetPublicPageBySlugUseCase,
    private readonly createOrder: CreateStorefrontOrderUseCase
  ) {}

  // â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async resolveOrg(slug: string): Promise<any> {
    return OrganizationModel.findOne({
      $or: [{ slug }, { uniqueShopId: slug }, { _id: slug }],
    }).lean();
  }

  private getPortalCustomer(req: Request): { customerId: string; organizationId: string } | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) return null;
    const token = authHeader.split(" ")[1];
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, STOREFRONT_JWT_SECRET) as {
        customerId?: string; organizationId?: string; type?: string;
      };
      if (decoded.type !== "storefront_customer" || !decoded.customerId || !decoded.organizationId) return null;
      return { customerId: decoded.customerId, organizationId: decoded.organizationId };
    } catch { return null; }
  }

  private async resolveOrGetCart(
    organizationId: string,
    sessionId: string,
    customerId?: string,
  ): Promise<any> {
    const filter: Record<string, unknown> = { organizationId, status: "active" };
    if (customerId) filter.customerId = customerId;
    else filter.sessionId = sessionId;

    let cart = await StorefrontCartModel.findOne(filter as any).lean();
    if (!cart) {
      cart = (await StorefrontCartModel.create({
        _id: randomUUID(),
        organizationId,
        customerId: customerId || null,
        sessionId: sessionId || null,
        status: "active",
        expiresAt: new Date(Date.now() + CART_TTL_MS),
      })).toObject() as any;
    }
    return cart;
  }

  // â”€â”€â”€ 1. Store Info & Sitemap â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  public getOrganizationInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      res.status(200).json({
        status: "success",
        data: {
          id: org._id,
          name: org.name,
          slug: org.slug || org.uniqueShopId,
          logo: org.logo,
          currency: (org as any).settings?.currency || "INR",
          settings: (org as any).settings,
        },
      });
    } catch (err) { next(err); }
  };

  public getSitemap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const products = await ProductModel.find({ organizationId: org._id, ...ACTIVE_PRODUCT_FILTER })
        .select("name sku slug updatedAt").limit(200).lean();
      res.status(200).json({
        status: "success",
        data: {
          pages: ["/", "/products", "/about", "/contact"],
          products: products.map((p: any) => `/products/${p.slug || p.sku || p._id}`),
        },
      });
    } catch (err) { next(err); }
  };

  public getStoreMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const [categories, layout] = await Promise.all([
        ProductModel.distinct("categoryId", { organizationId: org._id, ...ACTIVE_PRODUCT_FILTER }),
        StorefrontLayoutModel.findOne({ organizationId: org._id }).lean(),
      ]);
      res.status(200).json({
        status: "success",
        data: { currency: "INR", categories, theme: (layout as any)?.theme || "default" },
      });
    } catch (err) { next(err); }
  };

  public getShopFilters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const baseFilter = { organizationId: org._id, ...ACTIVE_PRODUCT_FILTER };
      const [categories, brands, tags, priceStats] = await Promise.all([
        ProductModel.distinct("categoryId", baseFilter),
        ProductModel.distinct("brandId", baseFilter),
        ProductModel.distinct("tags", baseFilter),
        ProductModel.aggregate([
          { $match: baseFilter },
          { $group: { _id: null, minPrice: { $min: "$sellingPrice" }, maxPrice: { $max: "$sellingPrice" } } },
        ]),
      ]);
      res.status(200).json({
        status: "success",
        data: {
          categories,
          brands,
          tags,
          minPrice: priceStats[0]?.minPrice ?? 0,
          maxPrice: priceStats[0]?.maxPrice ?? 10000,
        },
      });
    } catch (err) { next(err); }
  };

  // â”€â”€â”€ 2. Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  public searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const q = ((req.query.q as string) || "").trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
      const filter: Record<string, unknown> = { organizationId: org._id, ...ACTIVE_PRODUCT_FILTER };
      if (q) {
        (filter as any).$or = [
          { name: { $regex: q, $options: "i" } },
          { sku: { $regex: q, $options: "i" } },
        ];
      }
      const products = await ProductModel.find(filter as any)
        .select("name sku slug sellingPrice images categoryId description").limit(limit).lean();
      res.status(200).json({ status: "success", results: products.length, data: products });
    } catch (err) { next(err); }
  };

  public getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const categories = await ProductModel.distinct("categoryId", { organizationId: org._id, ...ACTIVE_PRODUCT_FILTER });
      res.status(200).json({ status: "success", data: categories });
    } catch (err) { next(err); }
  };

  public getBrands = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const brands = await ProductModel.distinct("brandId", { organizationId: org._id, ...ACTIVE_PRODUCT_FILTER });
      res.status(200).json({ status: "success", data: brands });
    } catch (err) { next(err); }
  };

  public getTags = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const tags = await ProductModel.distinct("tags", { organizationId: org._id, ...ACTIVE_PRODUCT_FILTER });
      res.status(200).json({ status: "success", data: tags });
    } catch (err) { next(err); }
  };

  public getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const filter: Record<string, unknown> = { organizationId: org._id, ...ACTIVE_PRODUCT_FILTER };
      if (req.query.category) filter.categoryId = req.query.category;
      if (req.query.brand) filter.brandId = req.query.brand;
      if (req.query.tag) filter.tags = req.query.tag;
      const [products, total] = await Promise.all([
        ProductModel.find(filter as any)
          .select("name sku slug sellingPrice mrp discountedPrice images categoryId brandId tags description")
          .skip((page - 1) * limit).limit(limit).lean(),
        ProductModel.countDocuments(filter as any),
      ]);
      res.status(200).json({
        status: "success",
        results: products.length,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: products,
      });
    } catch (err) { next(err); }
  };

  public getProductBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const slug = req.params.productSlug as string;
      const product = await ProductModel.findOne({
        organizationId: org._id,
        $or: [{ slug }, { sku: slug }, { _id: slug }],
        ...ACTIVE_PRODUCT_FILTER,
      }).lean();
      if (!product) { res.status(404).json({ status: "fail", message: "Product not found" }); return; }
      res.status(200).json({ status: "success", data: product });
    } catch (err) { next(err); }
  };

  // â”€â”€â”€ 3. Cart Operations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  public getCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const sessionId = (req.headers["x-session-id"] as string) || "";
      const cp = this.getPortalCustomer(req);
      const cart = await this.resolveOrGetCart(String(org._id), sessionId, cp?.customerId) as any;
      const items = await StorefrontCartItemModel.find({ cartId: String(cart._id), organizationId: org._id }).lean();
      res.status(200).json({ status: "success", data: { ...cart, items } });
    } catch (err) { next(err); }
  };

  public addItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const { productId, quantity = 1, variantId } = req.body as {
        productId?: string; quantity?: number; variantId?: string;
      };
      if (!productId) { res.status(400).json({ status: "fail", message: "productId is required" }); return; }

      const product = await ProductModel.findOne({
        _id: productId, organizationId: org._id, ...ACTIVE_PRODUCT_FILTER,
      }).lean() as any;
      if (!product) { res.status(404).json({ status: "fail", message: "Product not found or not available" }); return; }

      const totalAvailable = ((product.inventory as any[]) || [])
        .reduce((s: number, i: any) => s + (i.quantity - (i.reservedQuantity || 0)), 0);
      if (totalAvailable < quantity) {
        res.status(400).json({ status: "fail", message: "Insufficient stock", available: totalAvailable }); return;
      }

      const sessionId = (req.headers["x-session-id"] as string) || "";
      const cp = this.getPortalCustomer(req);
      const cart = await this.resolveOrGetCart(String(org._id), sessionId, cp?.customerId) as any;

      const unitPrice = product.discountedPrice && product.discountedPrice < product.sellingPrice
        ? product.discountedPrice : product.sellingPrice;

      const existing = await StorefrontCartItemModel.findOne({
        cartId: cart._id, productId, variantId: variantId || null,
      }).lean() as any;
      if (existing) {
        const newQty = existing.quantity + quantity;
        if (totalAvailable < newQty) {
          res.status(400).json({ status: "fail", message: "Insufficient stock", available: totalAvailable }); return;
        }
        await StorefrontCartItemModel.findByIdAndUpdate(existing._id, {
          quantity: newQty, lineTotal: existing.unitPrice * newQty,
        });
      } else {
        await StorefrontCartItemModel.create({
          _id: randomUUID(), cartId: cart._id, organizationId: org._id,
          productId, variantId: variantId || null,
          snapshot: {
            name: product.name, sku: product.sku, image: product.images?.[0] || null,
            sellingPrice: product.sellingPrice, taxRate: product.taxRate,
            isTaxInclusive: product.isTaxInclusive, hsnCode: product.hsnCode,
          },
          quantity, unitPrice, lineTotal: unitPrice * quantity,
        });
      }

      const allItems = await StorefrontCartItemModel.find({ cartId: cart._id }).lean() as any[];
      const subtotal = allItems.reduce((s, i) => s + i.lineTotal, 0);
      await StorefrontCartModel.findByIdAndUpdate(cart._id, {
        "totals.subtotal": subtotal,
        "totals.total": subtotal - ((cart.totals as any)?.discount || 0),
        expiresAt: new Date(Date.now() + CART_TTL_MS),
      });

      res.status(200).json({ status: "success", message: "Item added to cart" });
    } catch (err) { next(err); }
  };

  public updateItemQuantity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const { itemId } = req.params;
      const { quantity } = req.body as { quantity?: number };
      if (!quantity || quantity < 1) { res.status(400).json({ status: "fail", message: "quantity must be >= 1" }); return; }
      const item = await StorefrontCartItemModel.findOne({ _id: itemId, organizationId: org._id }).lean() as any;
      if (!item) { res.status(404).json({ status: "fail", message: "Cart item not found" }); return; }
      const product = await ProductModel.findOne({ _id: item.productId, organizationId: org._id }).lean() as any;
      const available = ((product?.inventory as any[]) || [])
        .reduce((s: number, i: any) => s + (i.quantity - (i.reservedQuantity || 0)), 0);
      if (available < quantity) {
        res.status(400).json({ status: "fail", message: "Insufficient stock", available }); return;
      }
      await StorefrontCartItemModel.findByIdAndUpdate(item._id, { quantity, lineTotal: item.unitPrice * quantity });
      const allItems = await StorefrontCartItemModel.find({ cartId: item.cartId }).lean() as any[];
      const subtotal = allItems.reduce((s, i) => s + (i._id === itemId ? item.unitPrice * quantity : i.lineTotal), 0);
      await StorefrontCartModel.findByIdAndUpdate(item.cartId, {
        "totals.subtotal": subtotal, "totals.total": subtotal,
      });
      res.status(200).json({ status: "success", message: "Cart item updated" });
    } catch (err) { next(err); }
  };

  public removeItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const item = await StorefrontCartItemModel.findOneAndDelete({ _id: req.params.itemId, organizationId: org._id }).lean() as any;
      if (!item) { res.status(404).json({ status: "fail", message: "Cart item not found" }); return; }
      const allItems = await StorefrontCartItemModel.find({ cartId: item.cartId }).lean() as any[];
      await StorefrontCartModel.findByIdAndUpdate(item.cartId, {
        "totals.subtotal": allItems.reduce((s, i) => s + i.lineTotal, 0),
        "totals.total": allItems.reduce((s, i) => s + i.lineTotal, 0),
      });
      res.status(200).json({ status: "success", message: "Cart item removed" });
    } catch (err) { next(err); }
  };

  public clearCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const sessionId = (req.headers["x-session-id"] as string) || "";
      const cp = this.getPortalCustomer(req);
      const cart = await this.resolveOrGetCart(String(org._id), sessionId, cp?.customerId) as any;
      await StorefrontCartItemModel.deleteMany({ cartId: cart._id });
      await StorefrontCartModel.findByIdAndUpdate(cart._id, {
        "totals.subtotal": 0, "totals.total": 0, appliedCoupons: [],
      });
      res.status(200).json({ status: "success", message: "Cart cleared" });
    } catch (err) { next(err); }
  };

  public validateCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const sessionId = (req.headers["x-session-id"] as string) || "";
      const cp = this.getPortalCustomer(req);
      const cart = await this.resolveOrGetCart(String(org._id), sessionId, cp?.customerId) as any;
      const items = await StorefrontCartItemModel.find({ cartId: cart._id }).lean() as any[];
      const issues: Array<{ productId: string; issue: string }> = [];
      for (const item of items) {
        const product = await ProductModel.findOne({ _id: item.productId, organizationId: org._id }).lean() as any;
        if (!product || product.status !== "active" || product.isDeleted || !product.storefrontVisible) {
          issues.push({ productId: item.productId, issue: "Product no longer available" });
        } else {
          const avail = ((product.inventory as any[]) || [])
            .reduce((s: number, i: any) => s + (i.quantity - (i.reservedQuantity || 0)), 0);
          if (avail < item.quantity) {
            issues.push({ productId: item.productId, issue: `Only ${avail} units available (requested ${item.quantity})` });
          }
        }
      }
      res.status(200).json({ status: "success", data: { valid: issues.length === 0, issues } });
    } catch (err) { next(err); }
  };

  public applyCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.body;
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const coupon = await StorefrontCouponModel.findOne({
        organizationId: org._id,
        code: (code || "").toUpperCase(),
        isActive: true,
      }).lean() as any;
      if (!coupon) { res.status(400).json({ status: "fail", message: "Invalid or expired coupon" }); return; }
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        res.status(400).json({ status: "fail", message: "Coupon usage limit exceeded" }); return;
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        res.status(400).json({ status: "fail", message: "Coupon has expired" }); return;
      }
      res.status(200).json({ status: "success", message: "Coupon applied", data: coupon });
    } catch (err) { next(err); }
  };

  public estimateShipping = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      // TODO: Implement real PIN-code based shipping zone lookup per organization settings
      const shippingFee = (req.body as any)?.postalCode ? 50 : 0;
      res.status(200).json({ status: "success", data: { shippingFee, estimatedDays: "2-5" } });
    } catch (err) { next(err); }
  };

  public mergeCart = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const { guestSessionId } = req.body as { guestSessionId?: string };
      const cp = this.getPortalCustomer(req);
      if (!cp) { res.status(401).json({ status: "fail", message: "Authentication required to merge cart" }); return; }
      if (!guestSessionId) { res.status(400).json({ status: "fail", message: "guestSessionId is required" }); return; }
      const guestCart = await StorefrontCartModel.findOne({
        organizationId: org._id, sessionId: guestSessionId, status: "active",
      }).lean() as any;
      if (!guestCart) { res.status(200).json({ status: "success", message: "Nothing to merge" }); return; }
      const customerCart = await this.resolveOrGetCart(String(org._id), "", cp.customerId) as any;
      const guestItems = await StorefrontCartItemModel.find({ cartId: guestCart._id }).lean() as any[];
      for (const gi of guestItems) {
        const ex = await StorefrontCartItemModel.findOne({ cartId: customerCart._id, productId: gi.productId }).lean() as any;
        if (ex) {
          await StorefrontCartItemModel.findByIdAndUpdate(ex._id, {
            quantity: ex.quantity + gi.quantity,
            lineTotal: ex.unitPrice * (ex.quantity + gi.quantity),
          });
        } else {
          await StorefrontCartItemModel.create({ ...gi, _id: randomUUID(), cartId: customerCart._id });
        }
      }
      await StorefrontCartModel.findByIdAndUpdate(guestCart._id, { status: "merged" });
      res.status(200).json({ status: "success", message: "Cart merged successfully" });
    } catch (err) { next(err); }
  };

  // â”€â”€â”€ 4. Storefront Customer Auth â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const { email, phone, firstName, lastName, password } = req.body as {
        email?: string; phone?: string; firstName?: string; lastName?: string; password?: string;
      };
      if (!email || !password) { res.status(400).json({ status: "fail", message: "email and password are required" }); return; }
      if (password.length < 6) { res.status(400).json({ status: "fail", message: "password must be at least 6 characters" }); return; }
      const existing = await StorefrontCustomerModel.findOne({ organizationId: org._id, email }).lean();
      if (existing) { res.status(409).json({ status: "fail", message: "Email already registered" }); return; }
      const passwordHash = await bcrypt.hash(password, 12);
      const customer = await StorefrontCustomerModel.create({
        organizationId: org._id, email, phone, firstName, lastName,
        passwordHash, guestAccount: false, authProvider: "password",
      });
      const token = jwt.sign(
        { customerId: String(customer._id), organizationId: String(org._id), type: "storefront_customer" },
        STOREFRONT_JWT_SECRET,
        { expiresIn: STOREFRONT_JWT_EXPIRES_IN } as jwt.SignOptions,
      );
      res.status(201).json({
        status: "success", message: "Registered successfully", token,
        data: { _id: customer._id, email, firstName, lastName },
      });
    } catch (err) { next(err); }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email || !password) { res.status(400).json({ status: "fail", message: "email and password are required" }); return; }
      const customer = await StorefrontCustomerModel.findOne({ organizationId: org._id, email }).select("+passwordHash").lean() as any;
      if (!customer) {
        await bcrypt.compare("dummy", "$2b$10$invalidhashfortimingequalisation");
        res.status(401).json({ status: "fail", message: "Invalid email or password" }); return;
      }
      const match = await bcrypt.compare(password, customer.passwordHash || "");
      if (!match) { res.status(401).json({ status: "fail", message: "Invalid email or password" }); return; }
      const token = jwt.sign(
        { customerId: String(customer._id), organizationId: String(org._id), type: "storefront_customer" },
        STOREFRONT_JWT_SECRET,
        { expiresIn: STOREFRONT_JWT_EXPIRES_IN } as jwt.SignOptions,
      );
      const { passwordHash: _ph, ...safeCustomer } = customer;
      res.status(200).json({ status: "success", token, data: safeCustomer });
    } catch (err) { next(err); }
  };

  public logout = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: "success", message: "Logged out successfully" });
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // resolveOrg used for validation only; actual email send deferred
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      // TODO: generate reset token, save hash, send email
      res.status(200).json({ status: "success", message: "If your email is registered, a reset link has been sent." });
    } catch (err) { next(err); }
  };

  public resetPassword = async (_req: Request, res: Response): Promise<void> => {
    // TODO: validate token, update passwordHash, clear token
    res.status(200).json({ status: "success", message: "Password updated successfully" });
  };

  public updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cp = this.getPortalCustomer(req);
      if (!cp) { res.status(401).json({ status: "fail", message: "Unauthorized" }); return; }
      const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
      if (!currentPassword || !newPassword) { res.status(400).json({ status: "fail", message: "currentPassword and newPassword are required" }); return; }
      const customer = await StorefrontCustomerModel.findOne({ _id: cp.customerId, organizationId: cp.organizationId }).select("+passwordHash").lean() as any;
      if (!customer || !(await bcrypt.compare(currentPassword, customer.passwordHash || ""))) {
        res.status(401).json({ status: "fail", message: "Current password is incorrect" }); return;
      }
      await StorefrontCustomerModel.updateOne(
        { _id: cp.customerId }, { $set: { passwordHash: await bcrypt.hash(newPassword, 12) } },
      );
      res.status(200).json({ status: "success", message: "Password changed successfully" });
    } catch (err) { next(err); }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cp = this.getPortalCustomer(req);
      if (!cp) { res.status(401).json({ status: "fail", message: "Unauthorized" }); return; }
      const customer = await StorefrontCustomerModel.findOne({ _id: cp.customerId, organizationId: cp.organizationId }).lean() as any;
      if (!customer) { res.status(404).json({ status: "fail", message: "Customer not found" }); return; }
      const { passwordHash: _ph, ...safe } = customer;
      res.status(200).json({ status: "success", data: safe });
    } catch (err) { next(err); }
  };

  public addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cp = this.getPortalCustomer(req);
      if (!cp) { res.status(401).json({ status: "fail", message: "Unauthorized" }); return; }
      const { fullName, phone, country, state, city, postalCode, addressLine1, addressLine2, landmark, addressType, isDefault } = req.body as any;
      if (!fullName || !phone || !state || !city || !postalCode || !addressLine1) {
        res.status(400).json({ status: "fail", message: "fullName, phone, state, city, postalCode, and addressLine1 are required" }); return;
      }
      if (isDefault) {
        await StorefrontCustomerAddressModel.updateMany(
          { customerId: cp.customerId, organizationId: cp.organizationId },
          { $set: { isDefault: false } },
        );
      }
      const address = await StorefrontCustomerAddressModel.create({
        _id: randomUUID(), customerId: cp.customerId, organizationId: cp.organizationId,
        fullName, phone, country, state, city, postalCode, addressLine1,
        addressLine2: addressLine2 || "", landmark: landmark || "",
        addressType: addressType || "home", isDefault: !!isDefault,
      });
      res.status(201).json({ status: "success", message: "Address saved", data: address });
    } catch (err) { next(err); }
  };

  public updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cp = this.getPortalCustomer(req);
      if (!cp) { res.status(401).json({ status: "fail", message: "Unauthorized" }); return; }
      const { addressId } = req.params;
      const { organizationId: _o, customerId: _c, ...safeBody } = req.body as Record<string, unknown>;
      if (safeBody.isDefault) {
        await StorefrontCustomerAddressModel.updateMany(
          { customerId: cp.customerId, organizationId: cp.organizationId },
          { $set: { isDefault: false } },
        );
      }
      const address = await StorefrontCustomerAddressModel.findOneAndUpdate(
        { _id: addressId, customerId: cp.customerId, organizationId: cp.organizationId },
        { $set: safeBody },
        { new: true },
      ).lean();
      if (!address) { res.status(404).json({ status: "fail", message: "Address not found" }); return; }
      res.status(200).json({ status: "success", data: address });
    } catch (err) { next(err); }
  };

  public toggleWishlist = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cp = this.getPortalCustomer(req);
      if (!cp) { res.status(401).json({ status: "fail", message: "Unauthorized" }); return; }
      const { productId, variantId } = req.body as { productId?: string; variantId?: string };
      if (!productId) { res.status(400).json({ status: "fail", message: "productId is required" }); return; }
      const ex = await StorefrontWishlistModel.findOne({ customerId: cp.customerId, organizationId: cp.organizationId, productId }).lean();
      if (ex) {
        await StorefrontWishlistModel.deleteOne({ _id: ex._id });
        res.status(200).json({ status: "success", message: "Removed from wishlist", wishlisted: false });
      } else {
        await StorefrontWishlistModel.create({ _id: randomUUID(), customerId: cp.customerId, organizationId: cp.organizationId, productId, variantId: variantId || null });
        res.status(200).json({ status: "success", message: "Added to wishlist", wishlisted: true });
      }
    } catch (err) { next(err); }
  };

  public getOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cp = this.getPortalCustomer(req);
      if (!cp) { res.status(401).json({ status: "fail", message: "Unauthorized" }); return; }
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
      const [orders, total] = await Promise.all([
        StorefrontOrderModel.find({ customerId: cp.customerId, organizationId: cp.organizationId })
          .select("orderNumber status fulfillmentStatus paymentStatus totals createdAt")
          .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        StorefrontOrderModel.countDocuments({ customerId: cp.customerId, organizationId: cp.organizationId }),
      ]);
      res.status(200).json({ status: "success", results: orders.length, total, page, limit, data: orders });
    } catch (err) { next(err); }
  };

  // â”€â”€â”€ 5. Checkout & Tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  public checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const result = await this.createOrder.execute(req.body, { organizationId: String(org._id) });
      res.status(201).json({ status: "success", message: "Order placed", data: result });
    } catch (err) { next(err); }
  };

  public trackOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const order = await StorefrontOrderModel.findOne({
        organizationId: org._id,
        $or: [{ orderNumber: req.params.orderNumber }, { _id: req.params.orderNumber }],
      }).lean();
      if (!order) { res.status(404).json({ status: "fail", message: "Order not found" }); return; }
      res.status(200).json({ status: "success", data: order });
    } catch (err) { next(err); }
  };

  // â”€â”€â”€ 6. Dynamic Public Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  public getPublicPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) { res.status(404).json({ status: "fail", message: "Storefront not found" }); return; }
      const page = await this.getPageBySlug.execute({ slug: req.params.pageSlug as string, organizationId: String(org._id) });
      if (!page) { res.status(404).json({ status: "fail", message: "Page not found" }); return; }
      res.status(200).json({ status: "success", data: page.props });
    } catch (err) { next(err); }
  };

  // Legacy fallback aliases
  public getPageHandler = this.getPublicPage;
  public checkoutHandler = this.checkout;
}

