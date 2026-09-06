export interface IDomainEvent<TPayload = unknown> {
  readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly payload: TPayload;
}
