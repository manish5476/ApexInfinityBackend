import { CreateCustomerUseCase } from '../../../../src/modules/crm/application/use-cases/CreateCustomerUseCase';
import { InMemoryCustomerRepository } from '../../../../src/modules/crm/infrastructure/repositories/InMemoryCustomerRepository';
import { CustomerStatus } from '../../../../src/modules/crm/domain/value-objects/CustomerStatus';

class MockEventBus {
  public published: unknown[] = [];
  async publishDomainEvent(e: unknown) { this.published.push(e); }
}

class MockUoW {
  async runInTransaction<T>(fn: () => Promise<T>) { return fn(); }
}

describe('CreateCustomerUseCase', () => {
  let repo: InMemoryCustomerRepository;
  let eventBus: MockEventBus;
  let uow: MockUoW;
  let useCase: CreateCustomerUseCase;

  const context = { organizationId: 'org-1' };

  beforeEach(() => {
    repo = new InMemoryCustomerRepository();
    eventBus = new MockEventBus();
    uow = new MockUoW();
    useCase = new CreateCustomerUseCase(repo as any, eventBus as any, uow as any);
  });

  it('should create a customer and persist it', async () => {
    const result = await useCase.execute({ name: 'Acme Corp', email: 'contact@acme.com' }, context);
    expect(result.id).toBeDefined();
    const saved = await repo.findByEmail({ email: 'contact@acme.com', organizationId: 'org-1' });
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('Acme Corp');
    expect(saved!.status).toBe(CustomerStatus.ACTIVE);
  });

  it('should dispatch CustomerCreatedEvent', async () => {
    await useCase.execute({ name: 'Acme Corp', email: 'events@acme.com' }, context);
    expect(eventBus.published).toHaveLength(1);
    expect((eventBus.published[0] as any).eventName).toBe('CustomerCreatedEvent');
  });

  it('should throw if email already exists in same org', async () => {
    await useCase.execute({ name: 'Acme Corp', email: 'dup@acme.com' }, context);
    await expect(
      useCase.execute({ name: 'Other Corp', email: 'dup@acme.com' }, context)
    ).rejects.toThrow('Customer with this email already exists');
  });

  it('should allow same email in different orgs (tenant isolation)', async () => {
    await useCase.execute({ name: 'Acme Corp', email: 'shared@corp.com' }, { organizationId: 'org-1' });
    // Different org — should succeed
    await expect(
      useCase.execute({ name: 'Acme Corp 2', email: 'shared@corp.com' }, { organizationId: 'org-2' })
    ).resolves.not.toThrow();
  });
});
