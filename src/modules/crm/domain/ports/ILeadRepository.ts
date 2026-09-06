import { Lead } from '../entities/Lead';

export interface ILeadRepository {
  findById(query: { id: string; organizationId: string }): Promise<Lead | null>;
  save(lead: Lead): Promise<void>;
}
