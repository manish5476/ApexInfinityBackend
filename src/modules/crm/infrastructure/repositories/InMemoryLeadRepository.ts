import { ILeadRepository } from '../../domain/ports/ILeadRepository';
import { Lead } from '../../domain/entities/Lead';

export class InMemoryLeadRepository implements ILeadRepository {
  public leads: Lead[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<Lead | null> {
    const lead = this.leads.find(l => l.id === query.id && l.organizationId === query.organizationId);
    return lead ? Lead.reconstitute({ ...lead.props, id: lead.id }) : null;
  }

  async save(lead: Lead): Promise<void> {
    const index = this.leads.findIndex(l => l.id === lead.id);
    if (index >= 0) {
      this.leads[index] = Lead.reconstitute({ ...lead.props, id: lead.id });
    } else {
      this.leads.push(Lead.reconstitute({ ...lead.props, id: lead.id }));
    }
  }
}
