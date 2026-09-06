import { Entity } from './Entity';
import { IDomainEvent } from './IDomainEvent';

/**
 * Base AggregateRoot class.
 * Aggregates manage domain events that are published upon successful transaction commit.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private readonly _domainEvents: IDomainEvent[] = [];

  public get domainEvents(): ReadonlyArray<IDomainEvent> {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
}
