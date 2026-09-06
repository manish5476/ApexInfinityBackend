import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { NotificationType, NotificationPriority, NotificationBusinessType } from '../value-objects/NotificationEnums';
import { NotificationSentEvent } from '../events/NotificationSentEvent';

export interface NotificationProps {
  organizationId: string;
  recipientId: string;
  businessType: NotificationBusinessType;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  priority: NotificationPriority;
  isRead: boolean;
  readAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNotificationParams {
  id: string;
  organizationId: string;
  recipientId: string;
  businessType?: NotificationBusinessType;
  type?: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  priority?: NotificationPriority;
}

export class Notification extends AggregateRoot<string> {
  private _props: NotificationProps;

  private constructor(id: string, props: NotificationProps) {
    super(id);
    this._props = props;
  }

  static create(params: CreateNotificationParams): Notification {
    if (!params.title.trim()) {
      throw new Error('Notification title is required');
    }
    if (!params.message.trim()) {
      throw new Error('Notification message is required');
    }

    const now = new Date();
    const notification = new Notification(params.id, {
      organizationId: params.organizationId,
      recipientId: params.recipientId,
      businessType: params.businessType ?? NotificationBusinessType.SYSTEM,
      type: params.type ?? NotificationType.INFO,
      title: params.title.trim(),
      message: params.message.trim(),
      metadata: params.metadata ?? {},
      priority: params.priority ?? NotificationPriority.NORMAL,
      isRead: false,
      readAt: null,
      createdAt: now,
      updatedAt: now,
    });

    notification.addDomainEvent(
      new NotificationSentEvent(notification.id, notification.organizationId, notification.recipientId, notification.businessType)
    );
    return notification;
  }

  static reconstitute(props: NotificationProps & { id: string }): Notification {
    return new Notification(props.id, props);
  }

  markAsRead(): void {
    if (!this._props.isRead) {
      this._props.isRead = true;
      this._props.readAt = new Date();
      this._props.updatedAt = new Date();
    }
  }

  markAsUnread(): void {
    if (this._props.isRead) {
      this._props.isRead = false;
      this._props.readAt = null;
      this._props.updatedAt = new Date();
    }
  }

  get organizationId() { return this._props.organizationId; }
  get recipientId() { return this._props.recipientId; }
  get businessType() { return this._props.businessType; }
  get type() { return this._props.type; }
  get title() { return this._props.title; }
  get message() { return this._props.message; }
  get metadata() { return this._props.metadata; }
  get priority() { return this._props.priority; }
  get isRead() { return this._props.isRead; }
  get readAt() { return this._props.readAt; }
  get props() { return { ...this._props }; }
}
