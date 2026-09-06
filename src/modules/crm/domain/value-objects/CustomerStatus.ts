export const CustomerStatus = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CHURNED: 'churned',
} as const;

export type CustomerStatus = typeof CustomerStatus[keyof typeof CustomerStatus];
