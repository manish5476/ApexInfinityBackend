import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { WebhookStatus } from '../value-objects/WebhookEnums';

export interface WebhookSubscriptionProps {
  organizationId: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  status: WebhookStatus;
  failureCount: number;
  lastTriggeredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookSubscriptionParams {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
}

export class WebhookSubscription extends AggregateRoot<string> {
  private _props: WebhookSubscriptionProps;

  private constructor(id: string, props: WebhookSubscriptionProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateWebhookSubscriptionParams): WebhookSubscription {
    if (!params.name.trim()) {
      throw new Error('Webhook name is required');
    }
    if (!params.url.trim() || !/^https?:\/\/.+/.test(params.url.trim())) {
      throw new Error('Valid webhook URL starting with http:// or https:// is required');
    }
    if (!params.events || params.events.length === 0) {
      throw new Error('At least one subscribed event is required');
    }

    const now = new Date();
    const generatedSecret = params.secret || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    return new WebhookSubscription(params.id, {
      organizationId: params.organizationId,
      name: params.name.trim(),
      url: params.url.trim(),
      secret: generatedSecret,
      events: params.events,
      isActive: true,
      status: WebhookStatus.ACTIVE,
      failureCount: 0,
      lastTriggeredAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: WebhookSubscriptionProps & { id: string }): WebhookSubscription {
    return new WebhookSubscription(props.id, props);
  }

  matchesEvent(eventName: string): boolean {
    if (!this._props.isActive || this._props.status !== WebhookStatus.ACTIVE) {
      return false;
    }
    return this._props.events.includes(eventName) || this._props.events.includes('*');
  }

  recordSuccess(): void {
    this._props.failureCount = 0;
    this._props.lastTriggeredAt = new Date();
    this._props.updatedAt = new Date();
  }

  recordFailure(): void {
    this._props.failureCount += 1;
    this._props.lastTriggeredAt = new Date();
    if (this._props.failureCount >= 5) {
      this._props.status = WebhookStatus.PAUSED;
      this._props.isActive = false;
    }
    this._props.updatedAt = new Date();
  }

  activate(): void {
    this._props.isActive = true;
    this._props.status = WebhookStatus.ACTIVE;
    this._props.failureCount = 0;
    this._props.updatedAt = new Date();
  }

  pause(): void {
    this._props.isActive = false;
    this._props.status = WebhookStatus.PAUSED;
    this._props.updatedAt = new Date();
  }

  get organizationId() { return this._props.organizationId; }
  get name() { return this._props.name; }
  get url() { return this._props.url; }
  get secret() { return this._props.secret; }
  get events() { return this._props.events; }
  get isActive() { return this._props.isActive; }
  get status() { return this._props.status; }
  get failureCount() { return this._props.failureCount; }
  get props() { return { ...this._props }; }
}
