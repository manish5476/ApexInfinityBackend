export const WebhookEvent = {
  INVOICE_CREATED: 'invoice.created',
  PAYMENT_RECEIVED: 'payment.received',
  ORDER_CREATED: 'order.created',
  CUSTOMER_CREATED: 'customer.created',
  STOCK_LOW: 'stock.low',
} as const;
export type WebhookEvent = typeof WebhookEvent[keyof typeof WebhookEvent];

export const WebhookStatus = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DISABLED: 'disabled',
} as const;
export type WebhookStatus = typeof WebhookStatus[keyof typeof WebhookStatus];
