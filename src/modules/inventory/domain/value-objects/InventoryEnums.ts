export const ProductStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued',
} as const;
export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus];

export const MovementType = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  TRANSFER: 'transfer',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
} as const;
export type MovementType = typeof MovementType[keyof typeof MovementType];

export const OrderStatus = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  RECEIVED: 'received',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const PaymentStatus = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERPAID: 'overpaid',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];
