import mongoose from 'mongoose';
import { IDropdownRepository, DropdownQueryOptions, DropdownResult, DropdownItemDto } from '../../domain/ports/IDropdownRepository';
import { FwMaster } from '../persistence/master.model';

export class MongoDropdownRepository implements IDropdownRepository {
  private getNestedValue(obj: any, path: string): any {
    if (!path || !obj) return null;
    return path.split('.').reduce((acc, part) => acc?.[part], obj) ?? null;
  }

  private buildLabel(doc: any, labelFields?: string | string[], template?: string): string {
    if (template) {
      return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => this.getNestedValue(doc, path) ?? '');
    }
    const fields = Array.isArray(labelFields) ? labelFields : labelFields ? [labelFields] : ['name'];
    const values = fields.map((f) => this.getNestedValue(doc, f)).filter(Boolean);
    return values.length > 0 ? values.join(' - ') : doc.name || doc.title || doc.code || 'Item';
  }

  private resolveModel(resource: string): any {
    const resourceMap: Record<string, string> = {
      masters: 'FwMaster',
      users: 'FwUser',
      branches: 'FwBranch',
      roles: 'FwRole',
      customers: 'FwCustomer',
      suppliers: 'FwSupplier',
      products: 'FwProduct',
      purchases: 'FwPurchaseOrder',
      sales: 'FwSalesOrder',
      accounts: 'FwAccount',
      invoices: 'FwInvoice',
      payments: 'FwPayment',
      departments: 'FwDepartment',
      designations: 'FwDesignation',
      shifts: 'FwShift',
      'shift-assignments': 'FwShiftGroup',
      holidays: 'FwHoliday',
      geofencing: 'FwGeoFence',
      'attendance-machines': 'FwAttendanceMachine',
      'attendance-requests': 'FwAttendanceRequest',
      'leave-requests': 'FwLeaveRequest',
    };

    const modelName = resourceMap[resource] || resource;
    return (mongoose.models[modelName] || mongoose.models[resource] || null) as any;
  }

  async getDropdown(resource: string, options: DropdownQueryOptions): Promise<DropdownResult> {
    const Model: any = this.resolveModel(resource) || FwMaster;

    const filter: Record<string, any> = {
      organizationId: options.organizationId,
      ...(options.extraFilter || {}),
    };

    if (options.isActive !== undefined && options.isActive !== 'all') {
      filter.isActive = options.isActive;
    }

    if (options.excludeIds && options.excludeIds.length > 0) {
      filter._id = { $nin: options.excludeIds };
    }

    if (options.search) {
      const searchField = options.searchField || 'name';
      const escaped = options.search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      filter[searchField] = { $regex: escaped, $options: 'i' };
    }

    let preSelectedDocs: any[] = [];
    if (options.includeIds && options.includeIds.length > 0) {
      preSelectedDocs = await Model.find({
        organizationId: options.organizationId,
        _id: { $in: options.includeIds },
      }).lean();
    }

    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 500);
    const skip = (page - 1) * limit;

    const [rawResults, total] = await Promise.all([
      Model.find(filter).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);

    const preSelectedIds = new Set(preSelectedDocs.map((d: any) => d._id?.toString()));
    const mergedResults = [
      ...preSelectedDocs,
      ...rawResults.filter((d: any) => !preSelectedIds.has(d._id?.toString())),
    ];

    const valueField = options.valueField || '_id';

    const data: DropdownItemDto[] = mergedResults.map((doc: any) => {
      const item: DropdownItemDto = {
        label: this.buildLabel(doc, options.labelField, options.labelTemplate),
        value: String(this.getNestedValue(doc, valueField) || doc.id || doc._id),
        data: doc,
      };

      if (options.metaFields && options.metaFields.length > 0) {
        item.meta = {};
        for (const m of options.metaFields) {
          item.meta[m] = this.getNestedValue(doc, m);
        }
      }

      return item;
    });

    const totalPages = Math.ceil(total / limit);
    const hasMore = page * limit < total;

    return {
      data,
      total,
      page,
      totalPages,
      hasMore,
    };
  }

  async getMasterSnapshot(organizationId: string): Promise<Record<string, unknown>> {
    const BranchModel = mongoose.models.FwBranch;
    const CustomerModel = mongoose.models.FwCustomer;
    const SupplierModel = mongoose.models.FwSupplier;
    const ProductModel = mongoose.models.FwProduct;
    const AccountModel = mongoose.models.FwAccount;
    const UserModel = mongoose.models.FwUser;

    const [branches, customers, suppliers, products, masters, accounts, users] = await Promise.all([
      BranchModel ? BranchModel.find({ organizationId, isActive: true }).select('_id name branchCode isMainBranch').lean() : [],
      CustomerModel ? CustomerModel.find({ organizationId, isActive: true }).select('_id name phone email type outstandingBalance').limit(500).lean() : [],
      SupplierModel ? SupplierModel.find({ organizationId, isActive: true }).select('_id companyName contactPerson phone outstandingBalance').limit(500).lean() : [],
      ProductModel ? ProductModel.find({ organizationId, isActive: true }).select('_id name sku sellingPrice category brand totalStock').limit(500).lean() : [],
      FwMaster.find({ organizationId, isActive: true }).select('_id type name code description').lean(),
      AccountModel ? AccountModel.find({ organizationId, isDeleted: { $ne: true } }).select('_id name code type cachedBalance').lean() : [],
      UserModel ? UserModel.find({ organizationId, isActive: true }).select('_id name email phone role').lean() : [],
    ]);

    const groupedMasters = masters.reduce((acc: Record<string, any[]>, item: any) => {
      (acc[item.type] ??= []).push(item);
      return acc;
    }, {});

    return {
      organizationId,
      branches,
      roles: [],
      customers,
      suppliers,
      products,
      accounts,
      users,
      masters: groupedMasters,
      recentInvoices: [],
      recentPurchases: [],
      recentSales: [],
      recentPayments: [],
      emis: [],
    };
  }

  async getQuickStats(organizationId: string, period?: string): Promise<Record<string, unknown>> {
    const CustomerModel = mongoose.models.FwCustomer;
    const SupplierModel = mongoose.models.FwSupplier;
    const ProductModel = mongoose.models.FwProduct;
    const InvoiceModel = mongoose.models.FwInvoice;
    const PaymentModel = mongoose.models.FwPayment;

    const [totalCustomers, totalSuppliers, totalProducts, totalInvoices, totalPayments] = await Promise.all([
      CustomerModel ? CustomerModel.countDocuments({ organizationId, isActive: true }) : 0,
      SupplierModel ? SupplierModel.countDocuments({ organizationId, isActive: true }) : 0,
      ProductModel ? ProductModel.countDocuments({ organizationId, isActive: true }) : 0,
      InvoiceModel ? InvoiceModel.countDocuments({ organizationId }) : 0,
      PaymentModel ? PaymentModel.countDocuments({ organizationId }) : 0,
    ]);

    return {
      period: period || 'month',
      data: {
        customers: totalCustomers,
        suppliers: totalSuppliers,
        products: totalProducts,
        invoices: totalInvoices,
        payments: totalPayments,
        revenue: 0,
        averageInvoiceValue: 0,
        outstandingBalance: 0,
        lowStockCount: 0,
      },
    };
  }

  async getEntityDetails(organizationId: string, type: string, id: string): Promise<Record<string, unknown> | null> {
    const Model: any = this.resolveModel(type) || FwMaster;
    const entity = await Model.findOne({ _id: id, organizationId }).lean();
    if (!entity) return null;
    return { entity, relatedData: {} };
  }

  async getSpecificList(
    organizationId: string,
    type: string,
    query: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const Model: any = this.resolveModel(type) || FwMaster;
    const filter: Record<string, any> = { organizationId };

    const page = Number(query.page || 1);
    const limit = Math.min(Number(query.limit || 50), 500);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Model.find(filter).skip(skip).limit(limit).lean(),
      Model.countDocuments(filter),
    ]);

    return {
      status: 'success',
      results: data.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      type,
      data,
      summary: {},
    };
  }
}
