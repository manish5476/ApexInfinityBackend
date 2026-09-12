export const PageType = {
  HOME: 'home',
  PRODUCTS: 'products',
  CATEGORY: 'category',
  ABOUT: 'about',
  CONTACT: 'contact',
  LANDING: 'landing',
  CUSTOM: 'custom',
} as const;
export type PageType = typeof PageType[keyof typeof PageType];

export const PageStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;
export type PageStatus = typeof PageStatus[keyof typeof PageStatus];

/** Unified order lifecycle status */
export const StorefrontOrderStatus = {
  DRAFT:             'draft',
  PLACED:            'placed',
  CONFIRMED:         'confirmed',
  PROCESSING:        'processing',
  DISPATCHED:        'dispatched',
  OUT_FOR_DELIVERY:  'out_for_delivery',
  DELIVERED:         'delivered',
  CANCELLED:         'cancelled',
  RETURNED:          'returned',
  CLOSED:            'closed',
  /** Legacy alias kept for backward compatibility */
  PENDING:           'pending',
  SHIPPED:           'shipped',
} as const;
export type StorefrontOrderStatus = typeof StorefrontOrderStatus[keyof typeof StorefrontOrderStatus];

/** Separate fulfillment-lifecycle status (independent of payment) */
export const StorefrontFulfillmentStatus = {
  UNFULFILLED:  'unfulfilled',
  PARTIAL:      'partial',
  FULFILLED:    'fulfilled',
  SHIPPED:      'shipped',
  DELIVERED:    'delivered',
  RETURNED:     'returned',
} as const;
export type StorefrontFulfillmentStatus = typeof StorefrontFulfillmentStatus[keyof typeof StorefrontFulfillmentStatus];

/** Payment lifecycle status */
export const StorefrontPaymentStatus = {
  PENDING:             'pending',
  AUTHORIZED:          'authorized',
  PAID:                'paid',
  FAILED:              'failed',
  PARTIALLY_REFUNDED:  'partially_refunded',
  REFUNDED:            'refunded',
} as const;
export type StorefrontPaymentStatus = typeof StorefrontPaymentStatus[keyof typeof StorefrontPaymentStatus];

/** Admin-allowed order-status transition matrix */
export const ADMIN_ORDER_TRANSITIONS: Record<string, string[]> = {
  draft:            ['placed', 'cancelled'],
  pending:          ['placed', 'confirmed', 'cancelled'],
  placed:           ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'cancelled'],
  processing:       ['dispatched', 'cancelled'],
  dispatched:       ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'returned'],
  delivered:        ['returned', 'closed'],
  returned:         ['closed'],
  cancelled:        [],
  closed:           [],
  // Legacy aliases
  shipped:          ['delivered', 'returned'],
};

