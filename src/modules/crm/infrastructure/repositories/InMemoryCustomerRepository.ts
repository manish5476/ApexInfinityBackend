import { ICustomerRepository, ListCustomersQuery, CheckDuplicateCustomerQuery } from '../../domain/ports/ICustomerRepository';
import { Customer } from '../../domain/entities/Customer';

export class InMemoryCustomerRepository implements ICustomerRepository {
  public customers: Customer[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Customer | null> {
    const customer = this.customers.find(c => c.id === query.id && c.organizationId === query.organizationId);
    return customer ? Customer.reconstitute({ ...customer.props, id: customer.id }) : null;
  }

  async findByIds(query: { ids: string[]; organizationId: string }): Promise<Customer[]> {
    return this.customers
      .filter(c => query.ids.includes(c.id) && c.organizationId === query.organizationId)
      .map(c => Customer.reconstitute({ ...c.props, id: c.id }));
  }

  async findByEmail(query: { email: string; organizationId: string }): Promise<Customer | null> {
    const normalized = query.email.trim().toLowerCase();
    const customer = this.customers.find(
      c => c.email?.toLowerCase() === normalized && c.organizationId === query.organizationId
    );
    return customer ? Customer.reconstitute({ ...customer.props, id: customer.id }) : null;
  }

  async findByPhone(query: { phone: string; organizationId: string }): Promise<Customer | null> {
    const customer = this.customers.find(
      c => c.phone === query.phone.trim() && c.organizationId === query.organizationId
    );
    return customer ? Customer.reconstitute({ ...customer.props, id: customer.id }) : null;
  }

  async findGuaranteedCustomers(query: { guarantorId: string; organizationId: string }): Promise<Customer[]> {
    return this.customers
      .filter(
        c =>
          c.organizationId === query.organizationId &&
          !c.isDeleted &&
          c.guarantors.some(g => g.customerId === query.guarantorId)
      )
      .map(c => Customer.reconstitute({ ...c.props, id: c.id }));
  }

  async search(query: { organizationId: string; query: string; limit?: number }): Promise<Customer[]> {
    const term = query.query.trim().toLowerCase();
    if (!term) return [];
    const limit = query.limit || 20;

    return this.customers
      .filter(c => {
        if (c.organizationId !== query.organizationId || c.isDeleted) return false;
        return (
          c.name.toLowerCase().includes(term) ||
          (c.phone && c.phone.includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(term)) ||
          (c.gstNumber && c.gstNumber.toLowerCase().includes(term)) ||
          (c.panNumber && c.panNumber.toLowerCase().includes(term))
        );
      })
      .slice(0, limit)
      .map(c => Customer.reconstitute({ ...c.props, id: c.id }));
  }

  async checkDuplicate(query: CheckDuplicateCustomerQuery): Promise<Customer | null> {
    const emailNorm = query.email?.trim().toLowerCase();
    const phoneNorm = query.phone?.trim();
    const gstNorm = query.gstNumber?.trim().toUpperCase();
    const nameNorm = query.name?.trim().toLowerCase();

    const found = this.customers.find(c => {
      if (c.organizationId !== query.organizationId || c.isDeleted) return false;
      if (emailNorm && c.email?.toLowerCase() === emailNorm) return true;
      if (phoneNorm && c.phone === phoneNorm) return true;
      if (gstNorm && c.gstNumber?.toUpperCase() === gstNorm) return true;
      if (nameNorm && c.name.toLowerCase() === nameNorm) return true;
      return false;
    });

    return found ? Customer.reconstitute({ ...found.props, id: found.id }) : null;
  }

  async save(customer: Customer): Promise<void> {
    const index = this.customers.findIndex(c => c.id === customer.id);
    if (index >= 0) {
      this.customers[index] = Customer.reconstitute({ ...customer.props, id: customer.id });
    } else {
      this.customers.push(Customer.reconstitute({ ...customer.props, id: customer.id }));
    }
  }

  async list(query: ListCustomersQuery): Promise<{ data: Customer[]; total: number }> {
    let filtered = this.customers.filter(c => c.organizationId === query.organizationId);

    if (query.isDeleted !== undefined) {
      filtered = filtered.filter(c => c.isDeleted === query.isDeleted);
    } else {
      filtered = filtered.filter(c => !c.isDeleted);
    }

    if (query.isActive !== undefined) {
      filtered = filtered.filter(c => c.isActive === query.isActive);
    }

    if (query.status) {
      filtered = filtered.filter(c => c.status === query.status);
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(term) ||
          (c.phone && c.phone.includes(term)) ||
          (c.email && c.email.toLowerCase().includes(term)) ||
          (c.contactPerson && c.contactPerson.toLowerCase().includes(term))
      );
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map(c => Customer.reconstitute({ ...c.props, id: c.id })),
      total: filtered.length,
    };
  }
}

