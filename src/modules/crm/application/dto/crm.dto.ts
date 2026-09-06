import { CustomerType, Address, GuarantorEntry } from '../../domain/entities/Customer';

export interface AddressDto {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface GuarantorEntryDto {
  customerId: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string | null;
  addedAt: string;
  addedBy?: string | null;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  type?: CustomerType;
  contactPerson?: string;
  avatar?: string;
  gstNumber?: string;
  panNumber?: string;
  billingAddress?: AddressDto;
  shippingAddress?: AddressDto;
  openingBalance?: number;
  creditLimit?: number;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  ownerId?: string;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  phone?: string;
  altPhone?: string;
  type?: CustomerType;
  contactPerson?: string;
  avatar?: string;
  gstNumber?: string;
  panNumber?: string;
  billingAddress?: AddressDto;
  shippingAddress?: AddressDto;
  paymentTerms?: string;
  notes?: string;
  tags?: string[];
  ownerId?: string;
  status?: 'active' | 'inactive' | 'churned';
}

export interface CustomerResponseDto {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  altPhone: string | null;
  type: CustomerType;
  contactPerson: string | null;
  avatar: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  openingBalance: number;
  outstandingBalance: number;
  creditLimit: number;
  paymentTerms: string | null;
  notes: string | null;
  tags: string[];
  guarantors: GuarantorEntryDto[];
  status: string;
  isActive: boolean;
  isDeleted: boolean;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCreditLimitDto {
  creditLimit: number;
}

export interface AddGuarantorDto {
  guarantorId: string;
  notes?: string;
}

export interface CheckDuplicateQueryDto {
  email?: string;
  phone?: string;
  gstNumber?: string;
  name?: string;
}

export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email: string;
  companyName?: string;
  ownerId?: string;
}

export interface ConvertLeadDto {
  leadId: string;
}

export interface CreateOpportunityDto {
  customerId: string;
  name: string;
  amount: number;
  currency?: string;
  stage?: string;
  ownerId?: string;
  expectedCloseDate?: string;
}

export interface UpdateOpportunityStageDto {
  stage: string;
}

export interface OpportunityResponseDto {
  id: string;
  organizationId: string;
  customerId: string;
  name: string;
  stage: string;
  amount: number;
  currency: string;
  ownerId: string | null;
  expectedCloseDate: string | null;
  createdAt: string;
  updatedAt: string;
}

