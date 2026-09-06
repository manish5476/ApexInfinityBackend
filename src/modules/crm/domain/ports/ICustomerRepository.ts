import { Customer } from '../entities/Customer';
import { CustomerStatus } from '../value-objects/CustomerStatus';

export interface ListCustomersQuery {
  organizationId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface CheckDuplicateCustomerQuery {
  organizationId: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  name?: string;
}

export interface ICustomerRepository {
  findById(query: { id: string; organizationId: string }): Promise<Customer | null>;
  findByIds(query: { ids: string[]; organizationId: string }): Promise<Customer[]>;
  findByEmail(query: { email: string; organizationId: string }): Promise<Customer | null>;
  findByPhone(query: { phone: string; organizationId: string }): Promise<Customer | null>;
  findGuaranteedCustomers(query: { guarantorId: string; organizationId: string }): Promise<Customer[]>;
  search(query: { organizationId: string; query: string; limit?: number }): Promise<Customer[]>;
  checkDuplicate(query: CheckDuplicateCustomerQuery): Promise<Customer | null>;
  save(customer: Customer): Promise<void>;
  list(query: ListCustomersQuery): Promise<{ data: Customer[]; total: number }>;
}

