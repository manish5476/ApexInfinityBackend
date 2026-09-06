import { IOpportunityRepository } from '../../domain/ports/IOpportunityRepository';
import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { Opportunity } from '../../domain/entities/Opportunity';
import { CreateOpportunityDto, OpportunityResponseDto } from '../dto/crm.dto';
import { OpportunityStage } from '../../domain/value-objects/OpportunityStage';
import { Money } from '../../domain/value-objects/Money';
import { randomUUID } from 'crypto';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class CreateOpportunityUseCase {
  constructor(
    private readonly opportunityRepo: IOpportunityRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(
    dto: CreateOpportunityDto,
    context: { organizationId: string }
  ): Promise<OpportunityResponseDto> {
    const customer = await this.customerRepo.findById({
      id: dto.customerId,
      organizationId: context.organizationId,
    });

    if (!customer) {
      throw new Error('Customer not found for this opportunity');
    }

    const opportunity = Opportunity.create({
      id: randomUUID(),
      organizationId: context.organizationId,
      customerId: dto.customerId,
      name: dto.name,
      stage: (dto.stage as OpportunityStage) || OpportunityStage.PROSPECTING,
      amount: new Money(dto.amount, dto.currency || 'INR'),
      ownerId: dto.ownerId || null,
      expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
    });

    await this.uow.runInTransaction(async () => {
      await this.opportunityRepo.save(opportunity);
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
