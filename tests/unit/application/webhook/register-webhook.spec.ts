import { RegisterWebhookUseCase } from '../../../../src/modules/webhook/application/use-cases/RegisterWebhookUseCase';
import { InMemoryWebhookRepository } from '../../../../src/modules/webhook/infrastructure/repositories/InMemoryWebhookRepository';

describe('RegisterWebhookUseCase', () => {
  let webhookRepo: InMemoryWebhookRepository;
  let useCase: RegisterWebhookUseCase;

  beforeEach(() => {
    webhookRepo = new InMemoryWebhookRepository();
    useCase = new RegisterWebhookUseCase(webhookRepo);
  });

  it('should register a new webhook subscription', async () => {
    const result = await useCase.execute(
      {
        name: 'ERP Sync',
        url: 'https://erp.example.com/api/webhooks',
        events: ['order.created'],
      },
      { organizationId: 'org-test' }
    );

    expect(result.id).toBeDefined();
    expect(result.name).toBe('ERP Sync');
    expect(result.events).toEqual(['order.created']);
    expect(result.isActive).toBe(true);

    const saved = await webhookRepo.findById({ id: result.id, organizationId: 'org-test' });
    expect(saved).toBeDefined();
  });
});
