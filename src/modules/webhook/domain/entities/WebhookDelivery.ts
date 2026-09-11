import { Entity } from '../../../../core/domain/Entity';

export type WebhookDeliveryStatus = 'pending' | 'success' | 'failed' | 'retrying' | 'abandoned';

export interface WebhookDeliveryProps {
  webhookId: string;
  organizationId: string;
  deliveryId: string;
  event: string;
  isReplay: boolean;
  originalDeliveryId?: string;
  requestUrl: string;
  requestPayload: Record<string, any>;
  requestHeaders?: Record<string, string>;
  responseStatus?: number;
  responseBody?: string;
  responseTimeMs?: number;
  attempt: number;
  maxAttempts: number;
  nextRetryAt?: Date | null;
  status: WebhookDeliveryStatus;
  errorMessage?: string;
  errorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookDeliveryParams {
  id: string;
  webhookId: string;
  organizationId: string;
  deliveryId: string;
  event: string;
  isReplay?: boolean;
  originalDeliveryId?: string;
  requestUrl: string;
  requestPayload: Record<string, any>;
  requestHeaders?: Record<string, string>;
  maxAttempts?: number;
}

export class WebhookDelivery extends Entity<string> {
  private _props: WebhookDeliveryProps;

  private constructor(id: string, props: WebhookDeliveryProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateWebhookDeliveryParams): WebhookDelivery {
    const now = new Date();
    return new WebhookDelivery(params.id, {
      webhookId: params.webhookId,
      organizationId: params.organizationId,
      deliveryId: params.deliveryId,
      event: params.event,
      isReplay: params.isReplay ?? false,
      originalDeliveryId: params.originalDeliveryId,
      requestUrl: params.requestUrl,
      requestPayload: params.requestPayload,
      requestHeaders: params.requestHeaders ?? {},
      attempt: 1,
      maxAttempts: params.maxAttempts ?? 5,
      nextRetryAt: null,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: WebhookDeliveryProps & { id: string }): WebhookDelivery {
    return new WebhookDelivery(props.id, props);
  }

  markSuccess(responseStatus: number, responseBody: string, responseTimeMs: number): void {
    this._props.status = 'success';
    this._props.responseStatus = responseStatus;
    this._props.responseBody = responseBody.slice(0, 5000);
    this._props.responseTimeMs = responseTimeMs;
    this._props.updatedAt = new Date();
  }

  markFailure(responseStatus: number | undefined, errorMessage: string, errorCode?: string, responseTimeMs?: number): void {
    this._props.responseStatus = responseStatus;
    this._props.errorMessage = errorMessage;
    this._props.errorCode = errorCode;
    if (responseTimeMs !== undefined) this._props.responseTimeMs = responseTimeMs;

    if (this._props.attempt < this._props.maxAttempts) {
      this._props.status = 'retrying';
      // Exponential backoff
      const delayMs = Math.pow(2, this._props.attempt) * 60 * 1000;
      this._props.nextRetryAt = new Date(Date.now() + delayMs);
      this._props.attempt += 1;
    } else {
      this._props.status = 'failed';
    }
    this._props.updatedAt = new Date();
  }

  get webhookId() { return this._props.webhookId; }
  get organizationId() { return this._props.organizationId; }
  get deliveryId() { return this._props.deliveryId; }
  get event() { return this._props.event; }
  get isReplay() { return this._props.isReplay; }
  get originalDeliveryId() { return this._props.originalDeliveryId; }
  get requestUrl() { return this._props.requestUrl; }
  get requestPayload() { return this._props.requestPayload; }
  get requestHeaders() { return this._props.requestHeaders; }
  get responseStatus() { return this._props.responseStatus; }
  get responseBody() { return this._props.responseBody; }
  get responseTimeMs() { return this._props.responseTimeMs; }
  get attempt() { return this._props.attempt; }
  get maxAttempts() { return this._props.maxAttempts; }
  get status() { return this._props.status; }
  get errorMessage() { return this._props.errorMessage; }
  get errorCode() { return this._props.errorCode; }
  get props() { return { ...this._props }; }
}
