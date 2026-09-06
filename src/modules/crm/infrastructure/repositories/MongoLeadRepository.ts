import { ILeadRepository } from '../../domain/ports/ILeadRepository';
import { Lead } from '../../domain/entities/Lead';
import { LeadModel } from '../persistence/lead.model';
import { LeadStatus } from '../../domain/value-objects/LeadStatus';

export class MongoLeadRepository implements ILeadRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Lead | null> {
    const doc = await LeadModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async save(lead: Lead): Promise<void> {
    await LeadModel.updateOne(
      { _id: lead.id, organizationId: lead.organizationId },
      { $set: lead.props },
      { upsert: true }
    );
  }

  private mapToDomain(doc: any): Lead {
    return Lead.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      companyName: doc.companyName,
      status: doc.status as LeadStatus,
      ownerId: doc.ownerId,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
}
