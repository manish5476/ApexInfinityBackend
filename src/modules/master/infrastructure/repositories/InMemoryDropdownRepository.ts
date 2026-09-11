import { IDropdownRepository, DropdownQueryOptions, DropdownResult, DropdownItemDto } from '../../domain/ports/IDropdownRepository';

export class InMemoryDropdownRepository implements IDropdownRepository {
  public store = new Map<string, Array<Record<string, any>>>();

  seed(resource: string, items: Array<Record<string, any>>): void {
    const existing = this.store.get(resource) || [];
    this.store.set(resource, [...existing, ...items]);
  }

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

  async getDropdown(resource: string, options: DropdownQueryOptions): Promise<DropdownResult> {
    const rawItems = this.store.get(resource) || [];
    let items = rawItems.filter((x) => x.organizationId === options.organizationId);

    if (options.extraFilter) {
      for (const [key, val] of Object.entries(options.extraFilter)) {
        items = items.filter((x) => x[key] === val);
      }
    }

    if (options.isActive !== undefined && options.isActive !== 'all') {
      items = items.filter((x) => (x.isActive ?? true) === options.isActive);
    }

    if (options.excludeIds && options.excludeIds.length > 0) {
      const set = new Set(options.excludeIds);
      items = items.filter((x) => !set.has(x._id || x.id));
    }

    let preSelected: Array<Record<string, any>> = [];
    if (options.includeIds && options.includeIds.length > 0) {
      const incSet = new Set(options.includeIds);
      preSelected = rawItems.filter((x) => x.organizationId === options.organizationId && incSet.has(x._id || x.id));
    }

    if (options.search) {
      const term = options.search.toLowerCase();
      const sField = options.searchField || 'name';
      items = items.filter((x) => {
        const val = this.getNestedValue(x, sField);
        return val ? String(val).toLowerCase().includes(term) : false;
      });
    }

    // Combine preselected and filtered
    const preIds = new Set(preSelected.map((x) => x._id || x.id));
    const combined = [...preSelected, ...items.filter((x) => !preIds.has(x._id || x.id))];

    const page = Math.max(options.page ?? 1, 1);
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 500);
    const start = (page - 1) * limit;
    const paginated = combined.slice(start, start + limit);

    const valueField = options.valueField || '_id';

    const data: DropdownItemDto[] = paginated.map((doc) => {
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

    const total = combined.length;
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
    const branches = (this.store.get('branches') || []).filter((x) => x.organizationId === organizationId);
    const roles = (this.store.get('roles') || []).filter((x) => x.organizationId === organizationId);
    const customers = (this.store.get('customers') || []).filter((x) => x.organizationId === organizationId);
    const suppliers = (this.store.get('suppliers') || []).filter((x) => x.organizationId === organizationId);
    const products = (this.store.get('products') || []).filter((x) => x.organizationId === organizationId);
    const masters = (this.store.get('masters') || []).filter((x) => x.organizationId === organizationId);
    const accounts = (this.store.get('accounts') || []).filter((x) => x.organizationId === organizationId);
    const users = (this.store.get('users') || []).filter((x) => x.organizationId === organizationId);

    const groupedMasters = masters.reduce((acc: Record<string, any[]>, item: any) => {
      (acc[item.type] ??= []).push(item);
      return acc;
    }, {});

    return {
      organizationId,
      branches,
      roles,
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
    const customers = (this.store.get('customers') || []).filter((x) => x.organizationId === organizationId);
    const suppliers = (this.store.get('suppliers') || []).filter((x) => x.organizationId === organizationId);
    const products = (this.store.get('products') || []).filter((x) => x.organizationId === organizationId);

    return {
      period: period || 'month',
      data: {
        customers: customers.length,
        suppliers: suppliers.length,
        products: products.length,
        invoices: 0,
        payments: 0,
        revenue: 0,
        averageInvoiceValue: 0,
        outstandingBalance: 0,
        lowStockCount: 0,
      },
    };
  }

  async getEntityDetails(organizationId: string, type: string, id: string): Promise<Record<string, unknown> | null> {
    const items = this.store.get(type) || this.store.get(`${type}s`) || [];
    const entity = items.find((x) => (x.id === id || x._id === id) && x.organizationId === organizationId);
    if (!entity) return null;
    return { entity, relatedData: {} };
  }

  async getSpecificList(
    organizationId: string,
    type: string,
    query: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const items = this.store.get(type) || this.store.get(`${type}s`) || [];
    const filtered = items.filter((x) => x.organizationId === organizationId);
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 50);
    const start = (page - 1) * limit;

    return {
      status: 'success',
      results: filtered.length,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
      type,
      data: filtered.slice(start, start + limit),
      summary: {},
    };
  }
}
