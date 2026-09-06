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

export const StorefrontOrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;
export type StorefrontOrderStatus = typeof StorefrontOrderStatus[keyof typeof StorefrontOrderStatus];
