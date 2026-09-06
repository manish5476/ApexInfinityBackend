import { ICustomerRepository, ListCustomersQuery, CheckDuplicateCustomerQuery } from '../../domain/ports/ICustomerRepository';
import { Customer, CustomerType } from '../../domain/entities/Customer';
import { CustomerModel, ICustomerDoc } from '../persistence/customer.model';
import { CustomerStatus } from '../../domain/value-objects/CustomerStatus';

export class MongoCustomerRepository implements ICustomerRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<ICustomerDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByIds(query: { ids: string[]; organizationId: string }): Promise<Customer[]> {
    if (!query.ids.length) return [];
    const docs = await CustomerModel.find({ _id: { $in: query.ids }, organizationId: query.organizationId }).lean<ICustomerDoc[]>();
    return docs.map(d => this.mapToDomain(d));
  }

  async findByEmail(query: { email: string; organizationId: string }): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ email: query.email.toLowerCase().trim(), organizationId: query.organizationId }).lean<ICustomerDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findByPhone(query: { phone: string; organizationId: string }): Promise<Customer | null> {
    const doc = await CustomerModel.findOne({ phone: query.phone.trim(), organizationId: query.organizationId }).lean<ICustomerDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async findGuaranteedCustomers(query: { guarantorId: string; organizationId: string }): Promise<Customer[]> {
    const docs = await CustomerModel.find({
      organizationId: query.organizationId,
      isDeleted: false,
      'guarantors.customerId': query.guarantorId,
    }).lean<ICustomerDoc[]>();
    return docs.map(d => this.mapToDomain(d));
  }

  async search(query: { organizationId: string; query: string; limit?: number }): Promise<Customer[]> {
    const limit = query.limit || 20;
    const term = query.query.trim();
    if (!term) return [];

    const regex = new RegExp(term, 'i');
    const docs = await CustomerModel.find({
      organizationId: query.organizationId,
      isDeleted: false,
      $or: [
        { name: regex },
        { phone: regex },
        { email: regex },
        { contactPerson: regex },
        { gstNumber: regex },
        { panNumber: regex },
      ],
    })
      .limit(limit)
      .lean<ICustomerDoc[]>();

    return docs.map(d => this.mapToDomain(d));
  }

  async checkDuplicate(query: CheckDuplicateCustomerQuery): Promise<Customer | null> {
    const orClauses: Record<string, any>[] = [];
    if (query.email) orClauses.push({ email: query.email.trim().toLowerCase() });
    if (query.phone) orClauses.push({ phone: query.phone.trim() });
    if (query.gstNumber) orClauses.push({ gstNumber: query.gstNumber.trim().toUpperCase() });
    if (query.name) orClauses.push({ name: { $regex: `^${query.name.trim()}$`, $options: 'i' } });

    if (orClauses.length === 0) return null;

    const doc = await CustomerModel.findOne({
      organizationId: query.organizationId,
      isDeleted: false,
      $or: orClauses,
    }).lean<ICustomerDoc>();

    return doc ? this.mapToDomain(doc) : null;
  }

  async save(customer: Customer): Promise<void> {
    await CustomerModel.updateOne(
      { _id: customer.id, organizationId: customer.organizationId },
      { $set: customer.props },
      { upsert: true }
    );
  }

  async list(query: ListCustomersQuery): Promise<{ data: Customer[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.isDeleted !== undefined) {
      filter.isDeleted = query.isDeleted;
    } else {
      filter.isDeleted = false; // Default: hide deleted
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { phone: regex },
        { email: regex },
        { contactPerson: regex },
      ];
    }

    const [docs, total] = await Promise.all([
      CustomerModel.find(filter).skip(skip).limit(limit).lean<ICustomerDoc[]>(),
      CustomerModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: any): Customer {
    return Customer.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      name: doc.name,
      email: doc.email ?? null,
      phone: doc.phone ?? null,
      altPhone: doc.altPhone ?? null,
      type: (doc.type as CustomerType) ?? 'individual',
      contactPerson: doc.contactPerson ?? null,
      avatar: doc.avatar ?? null,
      gstNumber: doc.gstNumber ?? null,
      panNumber: doc.panNumber ?? null,
      billingAddress: doc.billingAddress ?? null,
      shippingAddress: doc.shippingAddress ?? null,
      openingBalance: doc.openingBalance ?? 0,
      outstandingBalance: doc.outstandingBalance ?? 0,
      creditLimit: doc.creditLimit ?? 0,
      paymentTerms: doc.paymentTerms ?? null,
      notes: doc.notes ?? null,
      tags: doc.tags ?? [],
      guarantors: (doc.guarantors ?? []).map((g: any) => ({
        customerId: g.customerId,
        notes: g.notes ?? null,
        addedAt: new Date(g.addedAt),
        addedBy: g.addedBy ?? null,
      })),
      status: doc.status as CustomerStatus,
      isActive: doc.isActive ?? true,
      isDeleted: doc.isDeleted ?? false,
      ownerId: doc.ownerId ?? null,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }
}

