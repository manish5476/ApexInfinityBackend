import { IOpportunityRepository, ListOpportunitiesQuery } from '../../domain/ports/IOpportunityRepository';
import { Opportunity } from '../../domain/entities/Opportunity';
import { OpportunityModel, IOpportunityDoc } from '../persistence/opportunity.model';
import { OpportunityStage } from '../../domain/value-objects/OpportunityStage';
import { Money } from '../../domain/value-objects/Money';

export class MongoOpportunityRepository implements IOpportunityRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Opportunity | null> {
    const doc = await OpportunityModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean<IOpportunityDoc>();
    if (!doc) return null;
    return this.mapToDomain(doc);
  }

  async save(opportunity: Opportunity): Promise<void> {
    const props = opportunity.props;
    await OpportunityModel.updateOne(
      { _id: opportunity.id, organizationId: opportunity.organizationId },
      {
        $set: {
          _id: opportunity.id,
          organizationId: props.organizationId,
          customerId: props.customerId,
          name: props.name,
          stage: props.stage,
          amount: props.amount.amount,
          currency: props.amount.currency,
          ownerId: props.ownerId,
          expectedCloseDate: props.expectedCloseDate,
          createdAt: props.createdAt,
          updatedAt: props.updatedAt,
        },
      },
      { upsert: true }
    );
  }

  async list(query: ListOpportunitiesQuery): Promise<{ data: Opportunity[]; total: number }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: query.organizationId,
    };

    if (query.customerId) {
      filter.customerId = query.customerId;
    }
    if (query.stage) {
      filter.stage = query.stage;
    }

    const [docs, total] = await Promise.all([
      OpportunityModel.find(filter).skip(skip).limit(limit).lean<IOpportunityDoc[]>(),
      OpportunityModel.countDocuments(filter),
    ]);

    return {
      data: docs.map(d => this.mapToDomain(d)),
      total,
    };
  }

  private mapToDomain(doc: any): Opportunity {
    return Opportunity.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      customerId: doc.customerId,
      name: doc.name,
      stage: doc.stage as OpportunityStage,
      amount: new Money(doc.amount, doc.currency || 'INR'),
      ownerId: doc.ownerId ?? null,
      expectedCloseDate: doc.expectedCloseDate ? new Date(doc.expectedCloseDate) : null,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }
}
