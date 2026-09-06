import { IOpportunityRepository } from '../../domain/ports/IOpportunityRepository';
import { OpportunityResponseDto } from '../dto/crm.dto';
import { OpportunityStage } from '../../domain/value-objects/OpportunityStage';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class UpdateOpportunityStageUseCase {
  constructor(
    private readonly opportunityRepo: IOpportunityRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(
    input: { id: string; stage: string },
    context: { organizationId: string }
  ): Promise<OpportunityResponseDto> {
    const opportunity = await this.opportunityRepo.findById({
      id: input.id,
      organizationId: context.organizationId,
    });

    if (!opportunity) {
      throw new Error('Opportunity not found');
    }

    opportunity.updateStage(input.stage as OpportunityStage);

    await this.uow.runInTransaction(async () => {
      await this.opportunityRepo.save(opportunity);
      for (const event of opportunity.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      opportunity.clearDomainEvents();
    });

    const props = opportunity.props;
    return {
      id: opportunity.id,
      organizationId: opportunity.organizationId,
      customerId: props.customerId,
      name: props.name,
      stage: props.stage,
      amount: props.amount.amount,
      currency: props.amount.currency,
      ownerId: props.ownerId,
      expectedCloseDate: props.expectedCloseDate ? props.expectedCloseDate.toISOString() : null,
      createdAt: props.createdAt.toISOString(),
      updatedAt: props.updatedAt.toISOString(),
    };
  }
}
