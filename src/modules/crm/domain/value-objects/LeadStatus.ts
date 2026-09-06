export const LeadStatus = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  LOST: 'lost',
} as const;

export type LeadStatus = typeof LeadStatus[keyof typeof LeadStatus];
