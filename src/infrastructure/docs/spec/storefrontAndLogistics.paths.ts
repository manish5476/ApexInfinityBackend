import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const storefrontAndLogisticsPaths: OpenApiPaths = {
  // --- PUBLIC STOREFRONT ---
  '/store/{organizationSlug}/products': {
    get: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Public product catalog for storefront',
      description: 'Unauthenticated public endpoint returning published products for customer store.',
      security: [],
      parameters: [
        pathParam('organizationSlug', 'Merchant store slug'),
        queryParam('category', 'Category filter'),
        queryParam('search', 'Search text'),
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 24),
      ],
      responses: okResponse('Public storefront catalog'),
    },
  },
  '/store/{organizationSlug}/products/{productSlug}': {
    get: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Get public product details by slug',
      security: [],
      parameters: [
        pathParam('organizationSlug', 'Merchant store slug'),
        pathParam('productSlug', 'Product slug identifier'),
      ],
      responses: okResponse('Product details and inventory availability'),
    },
  },
  '/store/{organizationSlug}/cart': {
    get: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Retrieve persistent server-side shopping cart',
      security: [],
      parameters: [pathParam('organizationSlug', 'Merchant store slug')],
      responses: okResponse('Current cart items and totals'),
    },
  },
  '/store/{organizationSlug}/cart/items': {
    post: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Add product item to shopping cart',
      security: [],
      parameters: [pathParam('organizationSlug', 'Merchant store slug')],
      requestBody: jsonBody({
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'integer', default: 1 },
        },
      }),
      responses: okResponse('Item added to cart'),
    },
  },
  '/store/{organizationSlug}/checkout': {
    post: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Complete checkout and generate online storefront order',
      security: [],
      parameters: [pathParam('organizationSlug', 'Merchant store slug')],
      requestBody: jsonBody({
        type: 'object',
        required: ['customerName', 'customerPhone', 'shippingAddress', 'items'],
        properties: {
          customerName: { type: 'string' },
          customerPhone: { type: 'string' },
          shippingAddress: { type: 'object' },
          items: { type: 'array', items: { type: 'object' } },
          paymentMethod: { type: 'string', enum: ['cod', 'online'] },
        },
      }),
      responses: createdResponse('Storefront order confirmed and queued for fulfillment'),
    },
  },
  '/store/{organizationSlug}/orders/{orderNumber}': {
    get: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Track storefront order status in real time',
      security: [],
      parameters: [
        pathParam('organizationSlug', 'Merchant store slug'),
        pathParam('orderNumber', 'Storefront order number'),
      ],
      responses: okResponse('Order tracking status and milestone history'),
    },
  },

  // --- ADMIN STOREFRONT ---
  '/admin/storefront/pages': {
    get: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'List CMS storefront pages (Admin)',
      responses: okResponse('Storefront CMS pages list'),
    },
    post: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Create a new storefront CMS page',
      requestBody: jsonBody({
        type: 'object',
        required: ['title', 'slug'],
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          pageType: { type: 'string', enum: ['home', 'landing', 'custom', 'about', 'contact', 'products'] },
        },
      }),
      responses: createdResponse('CMS Page created'),
    },
  },
  '/admin/storefront/pages/{pageId}/publish': {
    post: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Publish draft CMS page to live storefront',
      parameters: [pathParam('pageId', 'Page ID')],
      responses: okResponse('Page published live'),
    },
  },
  '/admin/storefront/orders': {
    get: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'List online storefront customer orders for merchant',
      responses: okResponse('Merchant storefront orders'),
    },
  },
  '/admin/storefront/orders/{orderId}/status': {
    put: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Transition storefront order fulfillment state',
      parameters: [pathParam('orderId', 'Order ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'] },
        },
      }),
      responses: okResponse('Order status updated'),
    },
  },
  '/admin/storefront/orders/{orderId}/assign-agent': {
    patch: {
      tags: ['Storefront (Public & Admin)'],
      summary: 'Assign delivery personnel to storefront order',
      parameters: [pathParam('orderId', 'Order ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['agentId'],
        properties: { agentId: { type: 'string' } },
      }),
      responses: okResponse('Delivery agent assigned'),
    },
  },

  // --- DELIVERY AGENT ---
  '/delivery-agent/login': {
    post: {
      tags: ['Delivery & Logistics'],
      summary: 'Delivery agent login portal',
      security: [],
      requestBody: jsonBody({
        type: 'object',
        required: ['phone', 'password'],
        properties: {
          phone: { type: 'string' },
          password: { type: 'string' },
        },
      }),
      responses: okResponse('Delivery agent session token'),
    },
  },
  '/delivery-agent/orders': {
    get: {
      tags: ['Delivery & Logistics'],
      summary: 'List orders assigned to logged-in delivery agent',
      responses: okResponse('Assigned delivery packages'),
    },
  },
  '/delivery-agent/orders/{orderId}/status': {
    patch: {
      tags: ['Delivery & Logistics'],
      summary: 'Update parcel delivery status with proof/OTP',
      parameters: [pathParam('orderId', 'Order ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['picked_up', 'out_for_delivery', 'delivered', 'failed'] },
          otp: { type: 'string' },
        },
      }),
      responses: okResponse('Delivery status recorded'),
    },
  },

  // --- LOGISTICS & SHIPMENTS ---
  '/logistics/shipments': {
    get: {
      tags: ['Delivery & Logistics'],
      summary: 'List all multi-carrier logistics shipments',
      responses: okResponse('Shipments list'),
    },
    post: {
      tags: ['Delivery & Logistics'],
      summary: 'Create logistics shipment and generate tracking AWB',
      requestBody: jsonBody({
        type: 'object',
        required: ['orderId', 'carrier'],
        properties: {
          orderId: { type: 'string' },
          carrier: { type: 'string' },
          trackingNumber: { type: 'string' },
        },
      }),
      responses: createdResponse('Shipment manifested'),
    },
  },
  '/logistics/operations/summary': {
    get: {
      tags: ['Delivery & Logistics'],
      summary: 'Live fulfillment operations summary KPI',
      responses: okResponse('Fulfillment metrics (Pending, In Transit, Delivered, Exceptions)'),
    },
  },
};
