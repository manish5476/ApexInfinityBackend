import { IOpportunityRepository, ListOpportunitiesQuery } from '../../domain/ports/IOpportunityRepository';
import { Opportunity } from '../../domain/entities/Opportunity';

export class InMemoryOpportunityRepository implements IOpportunityRepository {
  public opportunities: Opportunity[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Opportunity | null> {
    const opp = this.opportunities.find(o => o.id === query.id && o.organizationId === query.organizationId);
    return opp ? Opportunity.reconstitute({ ...opp.props, id: opp.id }) : null;
  }

  async save(opportunity: Opportunity): Promise<void> {
    const index = this.opportunities.findIndex(o => o.id === opportunity.id);
    if (index >= 0) {
      this.opportunities[index] = Opportunity.reconstitute({ ...opportunity.props, id: opportunity.id });
    } else {
      this.opportunities.push(Opportunity.reconstitute({ ...opportunity.props, id: opportunity.id }));
    }
  }

  async list(query: ListOpportunitiesQuery): Promise<{ data: Opportunity[]; total: number }> {
    let filtered = this.opportunities.filter(o => o.organizationId === query.organizationId);

    if (query.customerId) {
      filtered = filtered.filter(o => o.customerId === query.customerId);
    }
    if (query.stage) {
      filtered = filtered.filter(o => o.stage === query.stage);
    }

    const page = query.page || 1;
    const limit = query.limit || 10;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map(o => Opportunity.reconstitute({ ...o.props, id: o.id })),
      total: filtered.length,
    };
  }
}
