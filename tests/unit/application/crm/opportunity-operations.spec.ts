import { InMemoryOpportunityRepository } from '../../../../src/modules/crm/infrastructure/repositories/InMemoryOpportunityRepository';
import { InMemoryCustomerRepository } from '../../../../src/modules/crm/infrastructure/repositories/InMemoryCustomerRepository';
import { Customer } from '../../../../src/modules/crm/domain/entities/Customer';
import { CreateOpportunityUseCase } from '../../../../src/modules/crm/application/use-cases/CreateOpportunityUseCase';
import { UpdateOpportunityStageUseCase } from '../../../../src/modules/crm/application/use-cases/UpdateOpportunityStageUseCase';
import { ListOpportunitiesUseCase } from '../../../../src/modules/crm/application/use-cases/ListOpportunitiesUseCase';
import { OpportunityStage } from '../../../../src/modules/crm/domain/value-objects/OpportunityStage';

class MockEventBus {
  public published: any[] = [];
  async publishDomainEvent(e: any) { this.published.push(e); }
}

class MockUoW {
  async runInTransaction<T>(fn: () => Promise<T>) { return fn(); }
}

describe('Opportunity Application Operations', () => {
  let oppRepo: InMemoryOpportunityRepository;
  let custRepo: InMemoryCustomerRepository;
  let eventBus: MockEventBus;
  let uow: MockUoW;
  const context = { organizationId: 'org-1' };

  beforeEach(async () => {
    oppRepo = new InMemoryOpportunityRepository();
    custRepo = new InMemoryCustomerRepository();
    eventBus = new MockEventBus();
    uow = new MockUoW();

    const customer = Customer.create({
      id: 'cust-1',
      organizationId: 'org-1',
      name: 'Acme Corp',
      email: 'acme@corp.com',
    });
    await custRepo.save(customer);
  });

  it('should create an opportunity for an existing customer', async () => {
    const createUseCase = new CreateOpportunityUseCase(oppRepo, custRepo, uow as any);
    const opp = await createUseCase.execute(
      {
        customerId: 'cust-1',
        name: 'Q3 Software Expansion',
        amount: 50000,
        currency: 'INR',
      },
      context
    );

    expect(opp.id).toBeDefined();
    expect(opp.customerId).toBe('cust-1');
    expect(opp.name).toBe('Q3 Software Expansion');
    expect(opp.stage).toBe(OpportunityStage.PROSPECTING);
    expect(opp.amount).toBe(50000);
  });

  it('should throw if creating opportunity for non-existent customer', async () => {
    const createUseCase = new CreateOpportunityUseCase(oppRepo, custRepo, uow as any);
    await expect(
      createUseCase.execute(
        {
          customerId: 'non-existent',
          name: 'Invalid Deal',
          amount: 10000,
        },
        context
      )
    ).rejects.toThrow('Customer not found for this opportunity');
  });

  it('should advance opportunity stage and emit OpportunityWonEvent when closed won', async () => {
    const createUseCase = new CreateOpportunityUseCase(oppRepo, custRepo, uow as any);
    const updateUseCase = new UpdateOpportunityStageUseCase(oppRepo, eventBus as any, uow as any);

    const opp = await createUseCase.execute(
      { customerId: 'cust-1', name: 'Won Deal', amount: 75000 },
      context
    );

    const updated = await updateUseCase.execute(
      { id: opp.id, stage: OpportunityStage.CLOSED_WON },
      context
    );

    expect(updated.stage).toBe(OpportunityStage.CLOSED_WON);
    expect(eventBus.published).toHaveLength(1);
    expect(eventBus.published[0].eventName).toBe('OpportunityWonEvent');
    expect(eventBus.published[0].payload.amount).toBe(75000);
  });

  it('should list opportunities by organization and customer', async () => {
    const createUseCase = new CreateOpportunityUseCase(oppRepo, custRepo, uow as any);
    const listUseCase = new ListOpportunitiesUseCase(oppRepo);

    await createUseCase.execute({ customerId: 'cust-1', name: 'Deal 1', amount: 10000 }, context);
    await createUseCase.execute({ customerId: 'cust-1', name: 'Deal 2', amount: 20000 }, context);

    const result = await listUseCase.execute({ customerId: 'cust-1' }, context);
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(2);
  });
});
