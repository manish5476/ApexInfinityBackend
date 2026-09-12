import { Request, Response, NextFunction } from 'express';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { CustomerModel, SupplierModel } from '../../../crm/infrastructure/persistence';
import { ProductModel, PurchaseOrderModel } from '../../../inventory/infrastructure/persistence';
import { InvoiceModel } from '../../../accounting/infrastructure/persistence';
import { UserModel } from '../../../auth/infrastructure/persistence';

const escapeRegex = (str: string) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

export class SearchController {
  public globalSearch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const q = (req.query.q as string || '').trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);

      if (!q || q.length < 2) {
        res.status(200).json({ status: 'success', resultsCount: 0, data: [], grouped: {} });
        return;
      }

      const regex = new RegExp(escapeRegex(q), 'i');

      const [customers, suppliers, products, invoices] = await Promise.all([
        CustomerModel.find({
          organizationId: orgId,
          isDeleted: false,
          $or: [{ name: regex }, { phone: regex }, { email: regex }],
        })
          .limit(limit)
          .select('_id name phone email avatar type')
          .lean()
          .catch(() => []),

        SupplierModel.find({
          organizationId: orgId,
          isDeleted: false,
          $or: [{ companyName: regex }, { contactPerson: regex }, { phone: regex }],
        })
          .limit(limit)
          .select('_id companyName contactPerson phone avatar')
          .lean()
          .catch(() => []),

        ProductModel.find({
          organizationId: orgId,
          isDeleted: false,
          $or: [{ name: regex }, { sku: regex }, { category: regex }],
        })
          .limit(limit)
          .select('_id name sku sellingPrice category totalStock images')
          .lean()
          .catch(() => []),

        InvoiceModel.find({
          organizationId: orgId,
          $or: [{ invoiceNumber: regex }],
        })
          .limit(limit)
          .select('_id invoiceNumber grandTotal status invoiceDate')
          .lean()
          .catch(() => []),
      ]);

      const formattedCustomers = customers.map((c: any) => ({
        _id: c._id,
        title: c.name,
        subtitle: c.phone || c.email || '',
        meta: c.type || 'Customer',
        avatar: c.avatar || null,
        type: 'customer',
        icon: 'person',
        link: `/customers/${c._id}`,
      }));

      const formattedSuppliers = suppliers.map((s: any) => ({
        _id: s._id,
        title: s.companyName,
        subtitle: s.contactPerson || s.phone || '',
        meta: 'Supplier',
        avatar: s.avatar || null,
        type: 'supplier',
        icon: 'local_shipping',
        link: `/suppliers/${s._id}`,
      }));

      const formattedProducts = products.map((p: any) => ({
        _id: p._id,
        title: p.name,
        subtitle: `SKU: ${p.sku || 'N/A'} · ₹${p.sellingPrice || 0}`,
        meta: (p.totalStock ?? 0) > 0 ? `${p.totalStock} in stock` : 'Out of stock',
        avatar: p.images?.[0] || null,
        type: 'product',
        icon: 'inventory_2',
        link: `/inventory/products/${p._id}`,
      }));

      const formattedInvoices = invoices.map((i: any) => ({
        _id: i._id,
        title: i.invoiceNumber,
        subtitle: `₹${i.grandTotal || 0} · ${i.status}`,
        meta: 'Invoice',
        avatar: null,
        type: 'invoice',
        icon: 'receipt',
        link: `/billing/invoices/${i._id}`,
      }));

      const allResults = [
        ...formattedCustomers,
        ...formattedSuppliers,
        ...formattedProducts,
        ...formattedInvoices,
      ];

      res.status(200).json({
        status: 'success',
        resultsCount: allResults.length,
        data: allResults,
        grouped: {
          customers: formattedCustomers,
          suppliers: formattedSuppliers,
          products: formattedProducts,
          invoices: formattedInvoices,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public quickLookup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const orgId = context?.organizationId;
      const type = (req.query.type as string || '').toLowerCase();
      const q = (req.query.q as string || '').trim();
      const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
      const regex = new RegExp(escapeRegex(q), 'i');

      let results: Array<{ _id: string; label: string; sublabel?: string; avatar?: string | null }> = [];

      switch (type) {
        case 'customer': {
          const docs = await CustomerModel.find({
            organizationId: orgId,
            isDeleted: false,
            $or: [{ name: regex }, { phone: regex }, { email: regex }],
          })
            .select('_id name phone email avatar')
            .limit(limit)
            .lean();
          results = docs.map((d: any) => ({
            _id: String(d._id),
            label: d.name,
            sublabel: d.phone || d.email || '',
            avatar: d.avatar || null,
          }));
          break;
        }

        case 'supplier': {
          const docs = await SupplierModel.find({
            organizationId: orgId,
            isDeleted: false,
            $or: [{ companyName: regex }, { contactPerson: regex }, { phone: regex }],
          })
            .select('_id companyName contactPerson phone avatar')
            .limit(limit)
            .lean();
          results = docs.map((d: any) => ({
            _id: String(d._id),
            label: d.companyName,
            sublabel: d.contactPerson || d.phone || '',
            avatar: d.avatar || null,
          }));
          break;
        }

        case 'product': {
          const docs = await ProductModel.find({
            organizationId: orgId,
            isDeleted: false,
            $or: [{ name: regex }, { sku: regex }],
          })
            .select('_id name sku sellingPrice')
            .limit(limit)
            .lean();
          results = docs.map((d: any) => ({
            _id: String(d._id),
            label: `${d.name} (${d.sku || 'No SKU'})`,
            sublabel: `₹${d.sellingPrice || 0}`,
            avatar: null,
          }));
          break;
        }

        case 'invoice': {
          const docs = await InvoiceModel.find({
            organizationId: orgId,
            $or: [{ invoiceNumber: regex }],
          })
            .select('_id invoiceNumber grandTotal status')
            .limit(limit)
            .lean();
          results = docs.map((d: any) => ({
            _id: String(d._id),
            label: d.invoiceNumber,
            sublabel: `₹${d.grandTotal || 0} · ${d.status}`,
            avatar: null,
          }));
          break;
        }

        case 'user': {
          const docs = await UserModel.find({
            organizationId: orgId,
            isDeleted: false,
            $or: [{ name: regex }, { email: regex }],
          })
            .select('_id name email avatar')
            .limit(limit)
            .lean();
          results = docs.map((d: any) => ({
            _id: String(d._id),
            label: d.name,
            sublabel: d.email,
            avatar: d.avatar || null,
          }));
          break;
        }

        default:
          res.status(400).json({ status: 'fail', message: `Lookup not supported for type '${type}'` });
          return;
      }

      res.status(200).json({
        status: 'success',
        results: results.length,
        data: results,
      });
    } catch (err) {
      next(err);
    }
  };

  public globalChat = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', results: 0, data: [] });
  };
}
