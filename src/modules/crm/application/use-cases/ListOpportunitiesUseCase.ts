import { IOpportunityRepository, ListOpportunitiesQuery } from '../../domain/ports/IOpportunityRepository';
import { OpportunityResponseDto } from '../dto/crm.dto';

export class ListOpportunitiesUseCase {
  constructor(private readonly opportunityRepo: IOpportunityRepository) {}

  async execute(
    query: { customerId?: string; stage?: string; page?: number; limit?: number },
    context: { organizationId: string }
  ): Promise<{ data: OpportunityResponseDto[]; total: number }> {
    const { data, total } = await this.opportunityRepo.list({
      organizationId: context.organizationId,
      customerId: query.customerId,
      stage: query.stage,
      page: query.page,
      limit: query.limit,
    });

    return {
      data: data.map(o => ({
        id: o.id,
        organizationId: o.organizationId,
        customerId: o.customerId,
        name: o.name,
        stage: o.stage,
        amount: o.amount.amount,
        currency: o.amount.currency,
        ownerId: o.ownerId,
        expectedCloseDate: o.expectedCloseDate ? o.expectedCloseDate.toISOString() : null,
        createdAt: o.createdAt.toISOString(),
        updatedAt: o.updatedAt.toISOString(),
      })),
      total,
    };
  }
}
