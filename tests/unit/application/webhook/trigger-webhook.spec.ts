import { TriggerWebhookDeliveriesUseCase } from '../../../../src/modules/webhook/application/use-cases/TriggerWebhookDeliveriesUseCase';
import { InMemoryWebhookRepository } from '../../../../src/modules/webhook/infrastructure/repositories/InMemoryWebhookRepository';
import { WebhookSubscription } from '../../../../src/modules/webhook/domain/entities/WebhookSubscription';
import { IEventBus } from '../../../../src/infrastructure/messaging/IEventBus';

describe('TriggerWebhookDeliveriesUseCase', () => {
  let webhookRepo: InMemoryWebhookRepository;
  let eventBus: jest.Mocked<IEventBus>;
  let useCase: TriggerWebhookDeliveriesUseCase;

  beforeEach(() => {
    webhookRepo = new InMemoryWebhookRepository();
    eventBus = {
      publish: jest.fn().mockResolvedValue(undefined),
      publishDomainEvent: jest.fn().mockResolvedValue(undefined),
      subscribe: jest.fn(),
    };
    useCase = new TriggerWebhookDeliveriesUseCase(webhookRepo, eventBus);
  });

  it('should trigger matching subscriptions and publish domain event', async () => {
    // 1. Seed subscriptions
    const sub1 = WebhookSubscription.create({
      id: 'sub-1',
      organizationId: 'org-test',
      name: 'Sub 1',
      url: 'https://webhook.site/1',
      events: ['invoice.created'],
    });

    const sub2 = WebhookSubscription.create({
      id: 'sub-2',
      organizationId: 'org-test',
      name: 'Sub 2',
      url: 'https://webhook.site/2',
      events: ['order.created'], // does not match
    });

    await webhookRepo.save(sub1);
    await webhookRepo.save(sub2);

    // 2. Trigger
    const result = await useCase.execute({
      organizationId: 'org-test',
      eventName: 'invoice.created',
      payload: { invoiceId: 'inv-99' },
    });

    expect(result.triggeredCount).toBe(1);
    expect(result.subscriberIds).toEqual(['sub-1']);
    expect(eventBus.publishDomainEvent).toHaveBeenCalledTimes(1);
  });
});
