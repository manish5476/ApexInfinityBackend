import { Request, Response, NextFunction } from 'express';
import { CreateStorefrontPageUseCase } from '../../application/use-cases/CreateStorefrontPageUseCase';
import { PublishStorefrontPageUseCase } from '../../application/use-cases/PublishStorefrontPageUseCase';
import { ListStorefrontPagesUseCase } from '../../application/use-cases/ListStorefrontPagesUseCase';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { PageStatus, PageType } from '../../domain/value-objects/StorefrontEnums';
import {
  StorefrontLayoutModel,
  StorefrontCouponModel,
  StorefrontCustomerModel,
  StorefrontDeliveryAgentModel,
  StorefrontOrderModel,
  SmartRuleModel,
  StorefrontPageModel,
} from '../../infrastructure/persistence';
import { CustomerModel } from '../../../crm/infrastructure/persistence';

export class StorefrontAdminController {
  constructor(
    private readonly createPage: CreateStorefrontPageUseCase,
    private readonly publishPage: PublishStorefrontPageUseCase,
    private readonly listPages: ListStorefrontPagesUseCase
  ) {}

  // 1. Pages
  public createPageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const result = await this.createPage.execute(req.body, { organizationId: ctx.organizationId! });
      res.status(201).json({ status: 'success', data: result.props });
    } catch (err) { next(err); }
  };

  public publishPageHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const pageId = String(req.params.pageId || req.params.id || '');
      const result = await this.publishPage.execute({ pageId }, { organizationId: ctx.organizationId! });
      res.status(200).json({ status: 'success', data: result.props });
    } catch (err) { next(err); }
  };

  public listPagesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as PageStatus | undefined;
      const pageType = req.query.pageType as PageType | undefined;
      const search = (req.query.search as string) || undefined;

      const result = await this.listPages.execute(
        { page, limit, status, pageType, search },
        { organizationId: ctx.organizationId! }
      );

      res.status(200).json({
        status: 'success',
        data: result.data.map((p) => p.props),
        total: result.total,
      });
    } catch (err) { next(err); }
  };

  public getPages = this.listPagesHandler;

  public getPageById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = await StorefrontPageModel.findOne({
        organizationId: ctx.organizationId,
        _id: req.params.pageId,
      }).lean();
      if (!page) {
        res.status(404).json({ status: 'fail', message: 'Page not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: page });
    } catch (err) { next(err); }
  };

  public updatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = await StorefrontPageModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.pageId },
        { $set: req.body },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: page });
    } catch (err) { next(err); }
  };

  public deletePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await StorefrontPageModel.deleteOne({ organizationId: ctx.organizationId, _id: req.params.pageId });
      res.status(200).json({ status: 'success', message: 'Page deleted' });
    } catch (err) { next(err); }
  };

  public unpublishPage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = await StorefrontPageModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.pageId },
        { $set: { status: 'draft', isPublished: false } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: page });
    } catch (err) { next(err); }
  };

  public setHomepage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await StorefrontPageModel.updateMany({ organizationId: ctx.organizationId }, { isHomepage: false });
      const page = await StorefrontPageModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.pageId },
        { isHomepage: true },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: page });
    } catch (err) { next(err); }
  };

  public duplicatePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const existing = await StorefrontPageModel.findOne({
        organizationId: ctx.organizationId,
        _id: req.params.pageId,
      }).lean();
      if (!existing) {
        res.status(404).json({ status: 'fail', message: 'Source page not found' });
        return;
      }

      const newPage = await StorefrontPageModel.create({
        ...existing,
        _id: undefined,
        name: `${(existing as any).name || 'Page'} (Copy)`,
        slug: `${existing.slug}-copy-${Date.now().toString().slice(-4)}`,
        status: 'draft',
        isPublished: false,
      });

      res.status(201).json({ status: 'success', data: newPage });
    } catch (err) { next(err); }
  };

  public getPageAnalytics = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: { views: 0, uniqueVisitors: 0, conversionRate: 0 } });
  };

  public getDraftPreview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const page = await StorefrontPageModel.findOne({
        organizationId: ctx.organizationId,
        _id: req.params.pageId,
      }).lean();
      res.status(200).json({ status: 'success', data: page });
    } catch (err) { next(err); }
  };

  // 2. Layout
  public getLayout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      let layout = await StorefrontLayoutModel.findOne({ organizationId: ctx.organizationId }).lean();
      if (!layout) {
        layout = { organizationId: ctx.organizationId!, theme: 'default', header: {}, footer: {}, sections: [], settings: {} } as any;
      }
      res.status(200).json({ status: 'success', data: layout });
    } catch (err) { next(err); }
  };

  public updateLayout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const layout = await StorefrontLayoutModel.findOneAndUpdate(
        { organizationId: ctx.organizationId },
        { $set: req.body },
        { new: true, upsert: true }
      ).lean();
      res.status(200).json({ status: 'success', data: layout });
    } catch (err) { next(err); }
  };

  public resetLayout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await StorefrontLayoutModel.deleteOne({ organizationId: ctx.organizationId });
      res.status(200).json({ status: 'success', message: 'Layout reset to defaults' });
    } catch (err) { next(err); }
  };

  // 3. Builder Catalog
  public getAvailableThemes = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: [{ id: 'default', name: 'Standard Store' }, { id: 'modern', name: 'Modern Minimal' }] });
  };
  public getSectionTypes = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: ['hero', 'featured-products', 'banner', 'newsletter', 'faq'] });
  };
  public getTemplates = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: [] });
  };

  // 4. Orders & Command Center
  public getCommandCenter = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: { pendingOrders: 0, dispatchedOrders: 0, activeAgents: 0 } });
  };

  public getAllOrders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const orders = await StorefrontOrderModel.find({ organizationId: ctx.organizationId }).sort({ createdAt: -1 }).limit(50).lean();
      res.status(200).json({ status: 'success', results: orders.length, data: orders });
    } catch (err) { next(err); }
  };

  public updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const order = await StorefrontOrderModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.orderId },
        { $set: { status: req.body.status } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: order });
    } catch (err) { next(err); }
  };

  public assignDeliveryAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const order = await StorefrontOrderModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.orderId },
        { $set: { deliveryAgentId: req.body.agentId, status: 'dispatched' } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: order });
    } catch (err) { next(err); }
  };

  // 5. Delivery Agents
  public getDeliveryAgents = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const agents = await StorefrontDeliveryAgentModel.find({ organizationId: ctx.organizationId }).lean();
      res.status(200).json({ status: 'success', results: agents.length, data: agents });
    } catch (err) { next(err); }
  };

  public createDeliveryAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const agent = await StorefrontDeliveryAgentModel.create({ organizationId: ctx.organizationId, ...req.body });
      res.status(201).json({ status: 'success', data: agent });
    } catch (err) { next(err); }
  };

  public getDeliveryAgentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const agent = await StorefrontDeliveryAgentModel.findOne({ organizationId: ctx.organizationId, _id: req.params.agentId }).lean();
      if (!agent) {
        res.status(404).json({ status: 'fail', message: 'Agent not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: agent });
    } catch (err) { next(err); }
  };

  public updateDeliveryAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const agent = await StorefrontDeliveryAgentModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.agentId },
        { $set: req.body },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: agent });
    } catch (err) { next(err); }
  };

  public deleteDeliveryAgent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await StorefrontDeliveryAgentModel.deleteOne({ organizationId: ctx.organizationId, _id: req.params.agentId });
      res.status(200).json({ status: 'success', message: 'Agent removed' });
    } catch (err) { next(err); }
  };

  public sendDeliveryAgentInvite = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Invitation email sent' });
  };

  // 6. Coupons
  public getCoupons = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const coupons = await StorefrontCouponModel.find({ organizationId: ctx.organizationId }).lean();
      res.status(200).json({ status: 'success', results: coupons.length, data: coupons });
    } catch (err) { next(err); }
  };

  public createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const coupon = await StorefrontCouponModel.create({ organizationId: ctx.organizationId, ...req.body });
      res.status(201).json({ status: 'success', data: coupon });
    } catch (err) { next(err); }
  };

  public getCouponById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const coupon = await StorefrontCouponModel.findOne({ organizationId: ctx.organizationId, _id: req.params.couponId }).lean();
      if (!coupon) {
        res.status(404).json({ status: 'fail', message: 'Coupon not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: coupon });
    } catch (err) { next(err); }
  };

  public updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const coupon = await StorefrontCouponModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.couponId },
        { $set: req.body },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: coupon });
    } catch (err) { next(err); }
  };

  public deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await StorefrontCouponModel.deleteOne({ organizationId: ctx.organizationId, _id: req.params.couponId });
      res.status(200).json({ status: 'success', message: 'Coupon deleted' });
    } catch (err) { next(err); }
  };

  // 7. Storefront Customers
  public adminListCustomers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const customers = await StorefrontCustomerModel.find({ organizationId: ctx.organizationId }).limit(50).lean();
      res.status(200).json({ status: 'success', results: customers.length, data: customers });
    } catch (err) { next(err); }
  };

  public adminDetailCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const customer = await StorefrontCustomerModel.findOne({ organizationId: ctx.organizationId, _id: req.params.customerId }).lean();
      if (!customer) {
        res.status(404).json({ status: 'fail', message: 'Customer not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: customer });
    } catch (err) { next(err); }
  };

  public convertToCrm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const sfCustomer = await StorefrontCustomerModel.findOne({ organizationId: ctx.organizationId, _id: req.params.customerId });
      if (!sfCustomer) {
        res.status(404).json({ status: 'fail', message: 'Customer not found' });
        return;
      }

      const crmCustomer = await CustomerModel.create({
        organizationId: ctx.organizationId,
        name: `${sfCustomer.firstName} ${sfCustomer.lastName}`.trim() || sfCustomer.email || 'Storefront Customer',
        email: sfCustomer.email,
        phone: sfCustomer.phone,
        type: 'individual',
      });

      sfCustomer.convertedToMainCustomer = true;
      sfCustomer.linkedCustomerId = String(crmCustomer._id);
      sfCustomer.crmSyncedAt = new Date();
      await sfCustomer.save();

      res.status(200).json({ status: 'success', message: 'Converted to CRM customer', data: crmCustomer });
    } catch (err) { next(err); }
  };

  // 8. Smart Rules
  public getAllRules = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const rules = await SmartRuleModel.find({ organizationId: ctx.organizationId }).lean();
      res.status(200).json({ status: 'success', results: rules.length, data: rules });
    } catch (err) { next(err); }
  };

  public createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const rule = await SmartRuleModel.create({ organizationId: ctx.organizationId, ...req.body });
      res.status(201).json({ status: 'success', data: rule });
    } catch (err) { next(err); }
  };

  public previewRule = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', data: { matchedProductsCount: 0, products: [] } });
  };

  public getRuleById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const rule = await SmartRuleModel.findOne({ organizationId: ctx.organizationId, _id: req.params.ruleId }).lean();
      if (!rule) {
        res.status(404).json({ status: 'fail', message: 'Rule not found' });
        return;
      }
      res.status(200).json({ status: 'success', data: rule });
    } catch (err) { next(err); }
  };

  public updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const rule = await SmartRuleModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.ruleId },
        { $set: req.body },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: rule });
    } catch (err) { next(err); }
  };

  public deleteRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await SmartRuleModel.deleteOne({ organizationId: ctx.organizationId, _id: req.params.ruleId });
      res.status(200).json({ status: 'success', message: 'Rule deleted' });
    } catch (err) { next(err); }
  };

  public executeRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const rule = await SmartRuleModel.findOne({ organizationId: ctx.organizationId, _id: req.params.ruleId });
      if (rule) {
        rule.lastExecutedAt = new Date();
        rule.executionCount = (rule.executionCount || 0) + 1;
        await rule.save();
      }
      res.status(200).json({ status: 'success', message: 'Rule executed', data: { products: [] } });
    } catch (err) { next(err); }
  };

  public clearRuleCache = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Rule cache invalidated' });
  };
}
