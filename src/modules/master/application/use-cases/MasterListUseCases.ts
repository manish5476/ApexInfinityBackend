import { IDropdownRepository } from '../../domain/ports/IDropdownRepository';
import { NotFoundError, ValidationError } from '../../../../shared/errors';

export const STATIC_OPTIONS = {
  status: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ],
  dateRanges: [
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: 'this_week', label: 'This Week' },
    { value: 'last_week', label: 'Last Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
  ],
  paymentStatus: [
    { value: 'all', label: 'All Payments' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
  ],
  invoiceStatus: [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'issued', label: 'Issued' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
  ],
  gstTypes: [
    { value: 'all', label: 'All GST Types' },
    { value: 'intra-state', label: 'Intra-State' },
    { value: 'inter-state', label: 'Inter-State' },
    { value: 'export', label: 'Export' },
  ],
  paymentTypes: [
    { value: 'all', label: 'All Types' },
    { value: 'inflow', label: 'Inflow (Received)' },
    { value: 'outflow', label: 'Outflow (Paid)' },
  ],
  paymentMethods: [
    { value: 'all', label: 'All Methods' },
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank Transfer' },
    { value: 'upi', label: 'UPI' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'other', label: 'Other' },
  ],
  emiStatus: [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
    { value: 'defaulted', label: 'Defaulted' },
  ],
  stockStatus: [
    { value: 'all', label: 'All Stock' },
    { value: 'inStock', label: 'In Stock' },
    { value: 'outOfStock', label: 'Out of Stock' },
    { value: 'lowStock', label: 'Low Stock (<10)' },
  ],
};

export const PERMISSIONS_METADATA = [
  { module: 'auth', permissions: ['auth.manage', 'auth.view'] },
  { module: 'organization', permissions: ['organization.read', 'organization.manage'] },
  { module: 'crm', permissions: ['crm.customer.read', 'crm.customer.manage'] },
  { module: 'inventory', permissions: ['inventory.read', 'inventory.manage'] },
  { module: 'accounting', permissions: ['accounting.read', 'accounting.manage'] },
  { module: 'hrms', permissions: ['hrms.employee.read', 'hrms.employee.manage', 'hrms.payroll.manage'] },
  { module: 'master', permissions: ['master.read', 'master.manage'] },
  { module: 'notification', permissions: ['notification.read', 'notification.manage'] },
  { module: 'webhook', permissions: ['webhook.read', 'webhook.manage'] },
];

export class MasterListUseCases {
  constructor(private readonly dropdownRepo: IDropdownRepository) {}

  async getMasterListSnapshot(organizationId: string): Promise<Record<string, unknown>> {
    return this.dropdownRepo.getMasterSnapshot(organizationId);
  }

  async getSpecificList(
    organizationId: string,
    type: string,
    query: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    if (!type || !type.trim()) {
      throw new ValidationError("Please provide a 'type' query parameter");
    }
    return this.dropdownRepo.getSpecificList(organizationId, type.toLowerCase().trim(), query);
  }

  async getFilterOptions(organizationId: string, type: string): Promise<Record<string, unknown>> {
    if (!type || !type.trim()) {
      throw new ValidationError("Please provide a 'type' query parameter");
    }
    return {
      common: {
        status: STATIC_OPTIONS.status,
        dateRanges: STATIC_OPTIONS.dateRanges,
      },
      entityType: type,
    };
  }

  async getQuickStats(organizationId: string, period?: string): Promise<Record<string, unknown>> {
    return this.dropdownRepo.getQuickStats(organizationId, period);
  }

  async getEntityDetails(organizationId: string, type: string, id: string): Promise<Record<string, unknown>> {
    const res = await this.dropdownRepo.getEntityDetails(organizationId, type, id);
    if (!res) {
      throw new NotFoundError(type, id);
    }
    return res;
  }

  getPermissionsMetadata(): Array<{ module: string; permissions: string[] }> {
    return PERMISSIONS_METADATA;
  }

  getOptionsMeta(): typeof STATIC_OPTIONS {
    return STATIC_OPTIONS;
  }
}
