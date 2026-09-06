import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    hsnCode: z.string().optional(),
    categoryId: z.string().optional(),
    purchasePrice: z.number().min(0).optional(),
    sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
    mrp: z.number().min(0).optional(),
    taxRate: z.number().min(0).optional(),
    defaultSupplierId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    hsnCode: z.string().optional(),
    categoryId: z.string().optional(),
    purchasePrice: z.number().min(0).optional(),
    sellingPrice: z.number().min(0).optional(),
    mrp: z.number().min(0).optional(),
    taxRate: z.number().min(0).optional(),
    defaultSupplierId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive', 'archived', 'out_of_stock']).optional(),
  }),
});

export const productIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
});

export const scanProductSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Scan code (SKU or barcode) is required'),
  }),
});

export const stockAdjustSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    branchId: z.string().min(1, 'Branch ID is required'),
    delta: z.number({ required_error: 'Delta quantity is required' }),
    reason: z.string().optional(),
  }),
});

export const stockTransferSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    fromBranchId: z.string().min(1, 'Source branch ID is required'),
    toBranchId: z.string().min(1, 'Destination branch ID is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
  }),
});

export const bulkUpdateProductsSchema = z.object({
  body: z.object({
    items: z.array(
      z.object({
        id: z.string().min(1, 'Product ID is required'),
        data: z.record(z.any()),
      })
    ).min(1, 'At least one item must be provided for bulk update'),
  }),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    branchId: z.string().min(1, 'Branch ID is required'),
    supplierId: z.string().min(1, 'Supplier ID is required'),
    supplierName: z.string().optional(),
    invoiceNumber: z.string().optional(),
    dueDate: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        name: z.string().min(1, 'Product name is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        purchasePrice: z.number().min(0, 'Price must be non-negative'),
        taxRate: z.number().optional(),
        discount: z.number().optional(),
      })
    ).min(1, 'At least one item is required'),
    notes: z.string().optional(),
  }),
});

export const createSalesOrderSchema = z.object({
  body: z.object({
    branchId: z.string().min(1, 'Branch ID is required'),
    customerId: z.string().optional(),
    items: z.array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        name: z.string().min(1, 'Product name is required'),
        quantity: z.number().min(1, 'Quantity must be at least 1'),
        price: z.number().min(0, 'Price must be non-negative'),
        taxRate: z.number().optional(),
        discount: z.number().optional(),
      })
    ).min(1, 'At least one item is required'),
    notes: z.string().optional(),
  }),
});
