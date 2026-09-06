export const NotificationType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  URGENT: 'urgent',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationPriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;
export type NotificationPriority = typeof NotificationPriority[keyof typeof NotificationPriority];

export const NotificationBusinessType = {
  USER_SIGNUP: 'USER_SIGNUP',
  INVOICE_CREATED: 'INVOICE_CREATED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  STOCK_ALERT: 'STOCK_ALERT',
  ORDER_PLACED: 'ORDER_PLACED',
  SYSTEM: 'SYSTEM',
} as const;
export type NotificationBusinessType = typeof NotificationBusinessType[keyof typeof NotificationBusinessType];
