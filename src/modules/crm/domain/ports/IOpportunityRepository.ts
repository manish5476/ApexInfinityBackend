import { Opportunity } from '../entities/Opportunity';

export interface ListOpportunitiesQuery {
  organizationId: string;
  customerId?: string;
  stage?: string;
  page?: number;
  limit?: number;
}

export interface IOpportunityRepository {
  findById(query: { id: string; organizationId: string }): Promise<Opportunity | null>;
  save(opportunity: Opportunity): Promise<void>;
  list(query: ListOpportunitiesQuery): Promise<{ data: Opportunity[]; total: number }>;
}

