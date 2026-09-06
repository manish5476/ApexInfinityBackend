export const OpportunityStage = {
  PROSPECTING: 'prospecting',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
} as const;

export type OpportunityStage = typeof OpportunityStage[keyof typeof OpportunityStage];
