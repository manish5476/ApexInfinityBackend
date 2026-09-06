import { ILeadRepository } from '../../domain/ports/ILeadRepository';
import { ICustomerRepository } from '../../domain/ports/ICustomerRepository';
import { Customer } from '../../domain/entities/Customer';
import { ConvertLeadDto } from '../dto/crm.dto';
import { randomUUID } from 'crypto';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../../../core/application/IUnitOfWork';

export class ConvertLeadUseCase {
  constructor(
    private readonly leadRepo: ILeadRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly eventBus: IEventBus,
    private readonly uow: IUnitOfWork
  ) {}

  async execute(dto: ConvertLeadDto, context: { organizationId: string }): Promise<{ customerId: string }> {
    const lead = await this.leadRepo.findById({ id: dto.leadId, organizationId: context.organizationId });
    if (!lead) {
      throw new Error('Lead not found');
    }

    let customerId = '';

    await this.uow.runInTransaction(async () => {
      // 1. Mark lead as converted
      lead.convert();
      await this.leadRepo.save(lead);

      // 2. Create customer from lead
      const customer = Customer.create({
        id: randomUUID(),
        organizationId: context.organizationId,
        name: lead.props.companyName || `${lead.props.firstName} ${lead.props.lastName}`,
        email: lead.props.email,
        ownerId: lead.props.ownerId,
      });
      await this.customerRepo.save(customer);
      customerId = customer.id;

      // 3. Dispatch events
      for (const event of lead.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      for (const event of customer.domainEvents) {
        await this.eventBus.publishDomainEvent(event);
      }
      lead.clearDomainEvents();
      customer.clearDomainEvents();
    });

    return { customerId };
  }
}
