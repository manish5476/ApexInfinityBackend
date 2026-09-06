import { EventEmitter } from 'events';
import { IEventBus, EventHandler } from './IEventBus';
import { IDomainEvent } from '../../core/domain/IDomainEvent';
import { ILogger } from '../logging/ILogger';

export class InMemoryEventBus implements IEventBus {
  private readonly emitter: EventEmitter;
  private readonly logger?: ILogger;

  constructor(logger?: ILogger) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(50);
    this.logger = logger;
  }

  public async publish<T = unknown>(eventName: string, payload: T): Promise<void> {
    this.logger?.debug(`[event] Publishing event: ${eventName}`, { payload });
    this.emitter.emit(eventName, payload);
  }

  public async publishDomainEvent(event: IDomainEvent): Promise<void> {
    this.logger?.debug(`[event] Publishing domain event: ${event.eventName}`, {
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
    });
    this.emitter.emit(event.eventName, event.payload);
  }

  public subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    this.emitter.on(eventName, async (payload: T) => {
      try {
        await handler(payload);
      } catch (err) {
        this.logger?.error(
          `[event:error] Unhandled error in subscriber for '${eventName}': ${(err as Error)?.message}`,
          { error: (err as Error)?.stack }
        );
      }
    });
  }
}
