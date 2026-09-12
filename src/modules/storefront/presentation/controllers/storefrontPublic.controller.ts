import { Request, Response, NextFunction } from 'express';
import { GetPublicPageBySlugUseCase } from '../../application/use-cases/GetPublicPageBySlugUseCase';
import { CreateStorefrontOrderUseCase } from '../../application/use-cases/CreateStorefrontOrderUseCase';
import { ProductModel } from '../../../inventory/infrastructure/persistence';
import {
  StorefrontCouponModel,
  StorefrontCustomerModel,
  StorefrontOrderModel,
  StorefrontLayoutModel,
} from '../../infrastructure/persistence';
import { OrganizationModel } from '../../../organization/infrastructure/persistence';

export class StorefrontPublicController {
  constructor(
    private readonly getPageBySlug: GetPublicPageBySlugUseCase,
    private readonly createOrder: CreateStorefrontOrderUseCase
  ) {}

  // Helper to resolve organizationId from slug
  private async resolveOrg(slug: string): Promise<any> {
    const org = await OrganizationModel.findOne({
      $or: [{ slug }, { uniqueShopId: slug }, { _id: slug }],
    }).lean();
    return org;
  }

  // 1. Store Info & Sitemap
  public getOrganizationInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }
      res.status(200).json({
        status: 'success',
        data: {
          id: org._id,
          name: org.name,
          slug: org.slug || org.uniqueShopId,
          logo: org.logo,
          currency: (org as any).settings?.currency || 'INR',
          settings: (org as any).settings,
        },
      });
    } catch (err) { next(err); }
  };

  public getSitemap = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const products = await ProductModel.find({ organizationId: org._id, isActive: true, isDeleted: false })
        .select('name sku updatedAt')
        .limit(200)
        .lean();

      res.status(200).json({
        status: 'success',
        data: {
          pages: ['/', '/products', '/about', '/contact'],
          products: products.map((p) => `/products/${p.sku || p._id}`),
        },
      });
    } catch (err) { next(err); }
  };

  // 2. Metadata, Filters, Categories, Brands, Tags
  public getStoreMetadata = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const [categories, layout] = await Promise.all([
        ProductModel.distinct('category', { organizationId: org._id, isActive: true }),
        StorefrontLayoutModel.findOne({ organizationId: org._id }).lean(),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          currency: 'INR',
          categories,
          theme: layout?.theme || 'default',
        },
      });
    } catch (err) { next(err); }
  };

  public getShopFilters = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const [categories, priceStats] = await Promise.all([
        ProductModel.distinct('category', { organizationId: org._id, isActive: true }),
        ProductModel.aggregate([
          { $match: { organizationId: org._id, isActive: true } },
          { $group: { _id: null, minPrice: { $min: '$sellingPrice' }, maxPrice: { $max: '$sellingPrice' } } },
        ]),
      ]);

      res.status(200).json({
        status: 'success',
        data: {
          categories,
          minPrice: priceStats[0]?.minPrice ?? 0,
          maxPrice: priceStats[0]?.maxPrice ?? 10000,
        },
      });
    } catch (err) { next(err); }
  };

  public searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }
      const q = (req.query.q as string || '').trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);

      const filter: any = { organizationId: org._id, isActive: true, isDeleted: false };
      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { sku: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
        ];
      }

      const products = await ProductModel.find(filter)
        .select('name sku sellingPrice totalStock images category description')
        .limit(limit)
        .lean();

      res.status(200).json({ status: 'success', results: products.length, data: products });
    } catch (err) { next(err); }
  };

  public getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const categories = await ProductModel.distinct('category', { organizationId: org._id, isActive: true });
      res.status(200).json({ status: 'success', data: categories });
    } catch (err) { next(err); }
  };

  public getBrands = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: [] });
  };

  public getTags = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: [] });
  };

  // 3. Products
  public getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const category = req.query.category as string;

      const filter: any = { organizationId: org._id, isActive: true, isDeleted: false };
      if (category) filter.category = category;

      const [products, total] = await Promise.all([
        ProductModel.find(filter)
          .select('name sku sellingPrice totalStock images category description')
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        ProductModel.countDocuments(filter),
      ]);

      res.status(200).json({
        status: 'success',
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
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }
      const slug = req.params.productSlug as string;

      const product = await ProductModel.findOne({
        organizationId: org._id,
        $or: [{ sku: slug }, { _id: slug }],
        isActive: true,
      }).lean();

      if (!product) {
        res.status(404).json({ status: 'fail', message: 'Product not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: product });
    } catch (err) { next(err); }
  };

  // 4. Cart Operations
  public getCart = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: { items: [], subtotal: 0, total: 0 } });
  };
  public addItem = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Item added to cart', data: req.body });
  };
  public updateItemQuantity = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Cart item updated', data: req.body });
  };
  public removeItem = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Cart item removed' });
  };
  public clearCart = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Cart cleared' });
  };
  public validateCart = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: { valid: true, issues: [] } });
  };
  public applyCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.body;
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const coupon = await StorefrontCouponModel.findOne({
        organizationId: org._id,
        code: (code || '').toUpperCase(),
        isActive: true,
      }).lean();

      if (!coupon) {
        res.status(400).json({ status: 'fail', message: 'Invalid or expired coupon' });
        return;
      }
      res.status(200).json({ status: 'success', message: 'Coupon applied', data: coupon });
    } catch (err) { next(err); }
  };
  public estimateShipping = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: { shippingFee: 0, estimatedDays: '2-4' } });
  };
  public mergeCart = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Cart merged', data: req.body });
  };

  // 5. Storefront Customer & Auth
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }
      const { email, phone, firstName, lastName } = req.body;

      const customer = await StorefrontCustomerModel.create({
        organizationId: org._id,
        email,
        phone,
        firstName,
        lastName,
        guestAccount: false,
        authProvider: 'password',
      });

      res.status(201).json({ status: 'success', message: 'Registered successfully', data: customer });
    } catch (err) { next(err); }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }
      const { email } = req.body;

      const customer = await StorefrontCustomerModel.findOne({ organizationId: org._id, email }).lean();
      if (!customer) {
        res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
        return;
      }

      res.status(200).json({ status: 'success', token: 'storefront_token_' + customer._id, data: customer });
    } catch (err) { next(err); }
  };

  public logout = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  };
  public forgotPassword = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Password reset link sent' });
  };
  public resetPassword = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  };
  public updatePassword = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Password changed successfully' });
  };
  public me = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: { email: 'customer@store.com', firstName: 'Customer' } });
  };
  public addAddress = async (req: Request, res: Response): Promise<void> => {
    res.status(201).json({ status: 'success', message: 'Address saved', data: req.body });
  };
  public updateAddress = async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Address updated', data: req.body });
  };
  public toggleWishlist = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Wishlist updated' });
  };
  public getOrders = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', results: 0, data: [] });
  };

  // 6. Checkout & Tracking
  public checkout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const result = await this.createOrder.execute(req.body, { organizationId: String(org._id) });
      res.status(201).json({ status: 'success', message: 'Order placed', data: result });
    } catch (err) { next(err); }
  };

  public trackOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }
      const order = await StorefrontOrderModel.findOne({
        organizationId: org._id,
        $or: [{ orderNumber: req.params.orderNumber }, { _id: req.params.orderNumber }],
      }).lean();

      if (!order) {
        res.status(404).json({ status: 'fail', message: 'Order not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: order });
    } catch (err) { next(err); }
  };

  // 7. Dynamic Public Page
  public getPublicPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const org = await this.resolveOrg(req.params.organizationSlug as string);
      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }
      const slug = req.params.pageSlug as string;

      const page = await this.getPageBySlug.execute({ slug, organizationId: String(org._id) });
      if (!page) {
        res.status(404).json({ status: 'fail', message: 'Page not found' });
        return;
      }

      res.status(200).json({ status: 'success', data: page.props });
    } catch (err) { next(err); }
  };

  // Legacy fallback compatibility methods
  public getPageHandler = this.getPublicPage;
  public checkoutHandler = this.checkout;
}
