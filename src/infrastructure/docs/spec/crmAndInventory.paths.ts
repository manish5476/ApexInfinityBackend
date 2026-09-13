import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const crmAndInventoryPaths: OpenApiPaths = {
  // --- CUSTOMERS ---
  '/customers': {
    get: {
      tags: ['CRM & Customers'],
      summary: 'List customers with outstanding balance and credit limits',
      parameters: [
        queryParam('search', 'Search by name, phone, or email'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size', 'integer', 20),
        queryParam('type', 'Customer classification filter'),
      ],
      responses: okResponse('Paginated customers list'),
    },
    post: {
      tags: ['CRM & Customers'],
      summary: 'Create a new customer profile',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'phone'],
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          type: { type: 'string', enum: ['retail', 'wholesale', 'corporate'], default: 'retail' },
          creditLimit: { type: 'number', default: 0 },
          billingAddress: { type: 'object' },
        },
      }),
      responses: createdResponse('Customer profile created'),
    },
  },
  '/customers/search': {
    get: {
      tags: ['CRM & Customers'],
      summary: 'Fast typeahead autocomplete search for customers',
      parameters: [queryParam('q', 'Query string')],
      responses: okResponse('Matching customer records'),
    },
  },
  '/customers/{id}': {
    get: {
      tags: ['CRM & Customers'],
      summary: 'Retrieve detailed customer profile by ID',
      parameters: [pathParam('id', 'Customer ID')],
      responses: okResponse('Customer profile details'),
    },
    patch: {
      tags: ['CRM & Customers'],
      summary: 'Update customer details',
      parameters: [pathParam('id', 'Customer ID')],
      responses: okResponse('Customer updated'),
    },
    delete: {
      tags: ['CRM & Customers'],
      summary: 'Soft-delete customer profile',
      parameters: [pathParam('id', 'Customer ID')],
      responses: okResponse('Customer deleted'),
    },
  },
  '/customers/{id}/credit-limit': {
    patch: {
      tags: ['CRM & Customers'],
      summary: 'Update approved credit limit for customer',
      parameters: [pathParam('id', 'Customer ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['creditLimit'],
        properties: {
          creditLimit: { type: 'number', example: 50000 },
        },
      }),
      responses: okResponse('Credit limit updated'),
    },
  },

  // --- SUPPLIERS ---
  '/suppliers': {
    get: {
      tags: ['CRM & Customers'],
      summary: 'List vendors and suppliers',
      parameters: [
        queryParam('search', 'Search vendor name or contact person'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size', 'integer', 20),
      ],
      responses: okResponse('Suppliers list'),
    },
    post: {
      tags: ['CRM & Customers'],
      summary: 'Create vendor / supplier record',
      requestBody: jsonBody({
        type: 'object',
        required: ['companyName', 'phone'],
        properties: {
          companyName: { type: 'string' },
          contactPerson: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string' },
          gstin: { type: 'string' },
        },
      }),
      responses: createdResponse('Supplier created'),
    },
  },
  '/suppliers/{id}': {
    get: {
      tags: ['CRM & Customers'],
      summary: 'Get supplier details by ID',
      parameters: [pathParam('id', 'Supplier ID')],
      responses: okResponse('Supplier details'),
    },
    patch: {
      tags: ['CRM & Customers'],
      summary: 'Update supplier details',
      parameters: [pathParam('id', 'Supplier ID')],
      responses: okResponse('Supplier updated'),
    },
    delete: {
      tags: ['CRM & Customers'],
      summary: 'Delete supplier record',
      parameters: [pathParam('id', 'Supplier ID')],
      responses: okResponse('Supplier removed'),
    },
  },

  // --- PRODUCTS ---
  '/products': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'List products with multi-branch stock levels',
      parameters: [
        queryParam('search', 'Search by title, SKU, or barcode'),
        queryParam('category', 'Category ID filter'),
        queryParam('brand', 'Brand ID filter'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size', 'integer', 20),
      ],
      responses: okResponse('Paginated product catalog'),
    },
    post: {
      tags: ['Inventory & Products'],
      summary: 'Create a new product with stock details',
      requestBody: jsonBody('CreateProductRequest'),
      responses: createdResponse('Product created', 'ProductResponse'),
    },
  },
  '/products/search': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'Typeahead search for products (POS & Invoicing)',
      parameters: [queryParam('q', 'Query keyword')],
      responses: okResponse('Matching products'),
    },
  },
  '/products/reports/low-stock': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'Low stock products report below reorder thresholds',
      responses: okResponse('Low stock products list'),
    },
  },
  '/products/scan': {
    post: {
      tags: ['Inventory & Products'],
      summary: 'Scan barcode / serial number to retrieve product instantly',
      requestBody: jsonBody({
        type: 'object',
        required: ['code'],
        properties: {
          code: { type: 'string', example: '8901234567890' },
        },
      }),
      responses: okResponse('Scanned product details'),
    },
  },
  '/products/{id}': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'Get product profile by ID',
      parameters: [pathParam('id', 'Product ID')],
      responses: okResponse('Product details'),
    },
    patch: {
      tags: ['Inventory & Products'],
      summary: 'Update product properties and prices',
      parameters: [pathParam('id', 'Product ID')],
      responses: okResponse('Product updated'),
    },
    delete: {
      tags: ['Inventory & Products'],
      summary: 'Delete or archive product',
      parameters: [pathParam('id', 'Product ID')],
      responses: okResponse('Product removed'),
    },
  },

  // --- STOCK MANAGEMENT ---
  '/stock/transfer': {
    post: {
      tags: ['Inventory & Products'],
      summary: 'Transfer inventory between organization branches',
      requestBody: jsonBody({
        type: 'object',
        required: ['fromBranchId', 'toBranchId', 'items'],
        properties: {
          fromBranchId: { type: 'string' },
          toBranchId: { type: 'string' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number' },
              },
            },
          },
          notes: { type: 'string' },
        },
      }),
      responses: okResponse('Stock transferred successfully'),
    },
  },
  '/stock/adjust': {
    post: {
      tags: ['Inventory & Products'],
      summary: 'Perform manual stock adjustment (damage, shrinkage, physical count)',
      requestBody: jsonBody({
        type: 'object',
        required: ['branchId', 'productId', 'adjustmentQuantity', 'reason'],
        properties: {
          branchId: { type: 'string' },
          productId: { type: 'string' },
          adjustmentQuantity: { type: 'number', description: 'Can be positive or negative' },
          reason: { type: 'string' },
        },
      }),
      responses: okResponse('Stock adjusted successfully'),
    },
  },
  '/stock/value': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'Compute total real inventory valuation across all branches',
      responses: okResponse('Inventory valuation summary'),
    },
  },
  '/stock/branch/{branchId}': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'Get all stock quantities scoped to a single branch',
      parameters: [pathParam('branchId', 'Branch ID')],
      responses: okResponse('Branch inventory list'),
    },
  },

  // --- PURCHASES ---
  '/purchases': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'List purchase orders and vendor bills',
      parameters: [
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 20),
        queryParam('supplierId', 'Filter by supplier'),
      ],
      responses: okResponse('Purchase orders list'),
    },
    post: {
      tags: ['Inventory & Products'],
      summary: 'Create a new purchase order',
      requestBody: jsonBody({
        type: 'object',
        required: ['supplierId', 'items'],
        properties: {
          supplierId: { type: 'string' },
          items: { type: 'array', items: { type: 'object' } },
          expectedDate: { type: 'string', format: 'date' },
        },
      }),
      responses: createdResponse('Purchase order created'),
    },
  },
  '/purchases/{id}': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'Get purchase order by ID',
      parameters: [pathParam('id', 'Purchase Order ID')],
      responses: okResponse('Purchase order details'),
    },
  },
  '/purchases/{id}/receive': {
    post: {
      tags: ['Inventory & Products'],
      summary: 'Receive stock for purchase order and increment warehouse levels',
      parameters: [pathParam('id', 'Purchase Order ID')],
      responses: okResponse('Stock received and added to inventory'),
    },
  },

  // --- SALES ORDERS ---
  '/sales': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'List sales orders',
      parameters: [
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 20),
        queryParam('customerId', 'Customer ID filter'),
      ],
      responses: okResponse('Sales orders list'),
    },
    post: {
      tags: ['Inventory & Products'],
      summary: 'Create a new sales order',
      requestBody: jsonBody({
        type: 'object',
        required: ['customerId', 'items'],
        properties: {
          customerId: { type: 'string' },
          items: { type: 'array', items: { type: 'object' } },
        },
      }),
      responses: createdResponse('Sales order created'),
    },
  },
  '/sales/{id}/dispatch': {
    post: {
      tags: ['Inventory & Products'],
      summary: 'Dispatch sales order and decrement stock',
      parameters: [pathParam('id', 'Sales Order ID')],
      responses: okResponse('Sales order dispatched'),
    },
  },

  // --- SALES RETURNS ---
  '/sales-returns': {
    get: {
      tags: ['Inventory & Products'],
      summary: 'List customer sales returns and credit notes',
      responses: okResponse('Sales returns list'),
    },
    post: {
      tags: ['Inventory & Products'],
      summary: 'Submit a sales return request',
      responses: createdResponse('Return registered'),
    },
  },
  '/sales-returns/{id}/approve': {
    patch: {
      tags: ['Inventory & Products'],
      summary: 'Approve sales return and restock inventory',
      parameters: [pathParam('id', 'Return ID')],
      responses: okResponse('Return approved and stock restored'),
    },
  },
};
