import { WebhookSubscription } from '../../../../src/modules/webhook/domain/entities/WebhookSubscription';
import { WebhookStatus } from '../../../../src/modules/webhook/domain/value-objects/WebhookEnums';

describe('WebhookSubscription Entity', () => {
  const baseParams = {
    id: 'wh-1',
    organizationId: 'org-1',
    name: 'Zapier Integration',
    url: 'https://hooks.zapier.com/catch/123/abc',
    events: ['invoice.created', 'payment.received'],
  };

  it('should create an active webhook subscription', () => {
    const webhook = WebhookSubscription.create(baseParams);

    expect(webhook.id).toBe('wh-1');
    expect(webhook.name).toBe('Zapier Integration');
    expect(webhook.url).toBe('https://hooks.zapier.com/catch/123/abc');
    expect(webhook.isActive).toBe(true);
    expect(webhook.status).toBe(WebhookStatus.ACTIVE);
    expect(webhook.failureCount).toBe(0);
    expect(webhook.secret).toBeDefined();
  });

  it('should reject invalid URLs', () => {
    expect(() =>
      WebhookSubscription.create({
        ...baseParams,
        url: 'not-a-url',
      })
    ).toThrow('Valid webhook URL starting with http:// or https:// is required');
  });

  it('should match subscribed events', () => {
    const webhook = WebhookSubscription.create(baseParams);

    expect(webhook.matchesEvent('invoice.created')).toBe(true);
    expect(webhook.matchesEvent('payment.received')).toBe(true);
    expect(webhook.matchesEvent('user.deleted')).toBe(false);
  });

  it('should auto-pause after 5 consecutive failures', () => {
    const webhook = WebhookSubscription.create(baseParams);

    for (let i = 0; i < 4; i++) {
      webhook.recordFailure();
      expect(webhook.isActive).toBe(true);
      expect(webhook.status).toBe(WebhookStatus.ACTIVE);
    }

    webhook.recordFailure(); // 5th failure
    expect(webhook.failureCount).toBe(5);
    expect(webhook.isActive).toBe(false);
    expect(webhook.status).toBe(WebhookStatus.PAUSED);
  });

  it('should reset failure count on success', () => {
    const webhook = WebhookSubscription.create(baseParams);
    webhook.recordFailure();
    webhook.recordFailure();
    expect(webhook.failureCount).toBe(2);

    webhook.recordSuccess();
    expect(webhook.failureCount).toBe(0);
  });
});
