import { z } from 'zod';

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
}).optional();

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    altPhone: z.string().optional(),
    type: z.enum(['individual', 'business']).optional(),
    contactPerson: z.string().optional(),
    avatar: z.string().optional(),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    openingBalance: z.number().optional(),
    creditLimit: z.number().min(0, 'Credit limit cannot be negative').optional(),
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    ownerId: z.string().optional(),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    altPhone: z.string().optional(),
    type: z.enum(['individual', 'business']).optional(),
    contactPerson: z.string().optional(),
    avatar: z.string().optional(),
    gstNumber: z.string().optional(),
    panNumber: z.string().optional(),
    billingAddress: addressSchema,
    shippingAddress: addressSchema,
    paymentTerms: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    ownerId: z.string().optional(),
    status: z.enum(['active', 'inactive', 'churned']).optional(),
  }),
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
});

export const updateCreditLimitSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    creditLimit: z.number().min(0, 'creditLimit cannot be negative'),
  }),
});

export const addGuarantorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    guarantorId: z.string().min(1, 'guarantorId is required'),
    notes: z.string().optional(),
  }),
});

export const removeGuarantorSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
    guarantorId: z.string().min(1, 'guarantorId is required'),
  }),
});

export const createLeadSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    companyName: z.string().optional(),
    ownerId: z.string().uuid().optional(),
  }),
});

export const convertLeadSchema = z.object({
  params: z.object({
    leadId: z.string().uuid('Invalid lead ID'),
  }),
});

export const createOpportunitySchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    name: z.string().min(1, 'Name is required'),
    amount: z.number().min(0, 'Amount must be non-negative'),
    currency: z.string().optional(),
    stage: z.string().optional(),
    ownerId: z.string().optional(),
    expectedCloseDate: z.string().optional(),
  }),
});

export const updateOpportunityStageSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Opportunity ID is required'),
  }),
  body: z.object({
    stage: z.string().min(1, 'Stage is required'),
  }),
});

