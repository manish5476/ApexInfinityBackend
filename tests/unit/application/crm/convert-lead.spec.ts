import { CreateLeadUseCase } from '../../../../src/modules/crm/application/use-cases/CreateLeadUseCase';
import { ConvertLeadUseCase } from '../../../../src/modules/crm/application/use-cases/ConvertLeadUseCase';
import { InMemoryLeadRepository } from '../../../../src/modules/crm/infrastructure/repositories/InMemoryLeadRepository';
import { InMemoryCustomerRepository } from '../../../../src/modules/crm/infrastructure/repositories/InMemoryCustomerRepository';
import { LeadStatus } from '../../../../src/modules/crm/domain/value-objects/LeadStatus';
import { CustomerStatus } from '../../../../src/modules/crm/domain/value-objects/CustomerStatus';

class MockEventBus {
  public published: unknown[] = [];
  async publishDomainEvent(e: unknown) { this.published.push(e); }
}

class MockUoW {
  async runInTransaction<T>(fn: () => Promise<T>) { return fn(); }
}

describe('ConvertLeadUseCase', () => {
  let leadRepo: InMemoryLeadRepository;
  let customerRepo: InMemoryCustomerRepository;
  let eventBus: MockEventBus;
  let uow: MockUoW;
  let createLeadUseCase: CreateLeadUseCase;
  let convertLeadUseCase: ConvertLeadUseCase;

  const context = { organizationId: 'org-1' };

  beforeEach(() => {
    leadRepo = new InMemoryLeadRepository();
    customerRepo = new InMemoryCustomerRepository();
    eventBus = new MockEventBus();
    uow = new MockUoW();
    createLeadUseCase = new CreateLeadUseCase(leadRepo as any, uow as any);
    convertLeadUseCase = new ConvertLeadUseCase(leadRepo as any, customerRepo as any, eventBus as any, uow as any);
  });

  it('should create a lead with NEW status', async () => {
    const result = await createLeadUseCase.execute(
      { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
      context
    );
    expect(result.id).toBeDefined();
    const lead = await leadRepo.findById({ id: result.id, organizationId: 'org-1' });
    expect(lead!.status).toBe(LeadStatus.NEW);
  });

  it('should convert a lead to QUALIFIED and create a Customer', async () => {
    const { id: leadId } = await createLeadUseCase.execute(
      { firstName: 'Bob', lastName: 'Builder', email: 'bob@builder.com', companyName: 'Builder Co' },
      context
    );

    const result = await convertLeadUseCase.execute({ leadId }, context);
    expect(result.customerId).toBeDefined();

    // Lead should now be QUALIFIED
    const lead = await leadRepo.findById({ id: leadId, organizationId: 'org-1' });
    expect(lead!.status).toBe(LeadStatus.QUALIFIED);

    // A Customer should have been created from lead
    const customer = await customerRepo.findByEmail({ email: 'bob@builder.com', organizationId: 'org-1' });
    expect(customer).not.toBeNull();
    expect(customer!.name).toBe('Builder Co');
    expect(customer!.status).toBe(CustomerStatus.ACTIVE);
  });

  it('should dispatch LeadConvertedEvent and CustomerCreatedEvent on conversion', async () => {
    const { id: leadId } = await createLeadUseCase.execute(
      { firstName: 'Alice', lastName: 'Smith', email: 'alice@corp.com' },
      context
    );

    await convertLeadUseCase.execute({ leadId }, context);

    const eventNames = (eventBus.published as Array<{ eventName: string }>).map(e => e.eventName);
    expect(eventNames).toContain('LeadConvertedEvent');
    expect(eventNames).toContain('CustomerCreatedEvent');
  });

  it('should throw when converting a non-existent lead', async () => {
    await expect(
      convertLeadUseCase.execute({ leadId: 'non-existent-uuid' }, context)
    ).rejects.toThrow('Lead not found');
  });
});
