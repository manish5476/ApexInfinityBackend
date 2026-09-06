import { IDomainEvent } from '../../core/domain/IDomainEvent';

export type EventHandler<T = unknown> = (payload: T) => Promise<void> | void;

/**
 * Universal Event Bus Port.
 * Decouples event publication from message broker implementation.
 */
export interface IEventBus {
  publish<T = unknown>(eventName: string, payload: T): Promise<void>;
  publishDomainEvent(event: IDomainEvent): Promise<void>;
  subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void;
}
