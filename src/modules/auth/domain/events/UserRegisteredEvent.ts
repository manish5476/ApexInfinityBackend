import { IDomainEvent } from '../../../../core/domain/IDomainEvent';

export interface UserRegisteredPayload {
  userId: string;
  email: string;
  name: string;
  organizationId?: string;
}

export class UserRegisteredEvent implements IDomainEvent<UserRegisteredPayload> {
  public readonly eventName = 'user.registered';
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly payload: UserRegisteredPayload;

  constructor(userId: string, email: string, name: string, organizationId?: string) {
    this.occurredOn = new Date();
    this.aggregateId = userId;
    this.payload = { userId, email, name, organizationId };
    Object.freeze(this);
  }
}
