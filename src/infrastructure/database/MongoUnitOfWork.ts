import { Connection, ClientSession } from 'mongoose';
import { IUnitOfWork } from '../../core/application/IUnitOfWork';
import { ILogger } from '../logging/ILogger';

export class MongoUnitOfWork implements IUnitOfWork {
  private readonly connection: Connection;
  private readonly logger?: ILogger;

  constructor(connection: Connection, logger?: ILogger) {
    this.connection = connection;
    this.logger = logger;
  }

  public async runInTransaction<T>(
    workFn: () => Promise<T>,
    options?: { maxRetries?: number; timeoutMs?: number }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const session: ClientSession = await this.connection.startSession();
      session.startTransaction();

      this.logger?.debug(`[uow] Transaction started (attempt ${attempt}/${maxRetries})`);

      try {
        const result = await workFn();
        await session.commitTransaction();
        this.logger?.debug('[uow] Transaction committed successfully');
        await session.endSession();
        return result;
      } catch (error) {
        lastError = error;
        await session.abortTransaction();
        await session.endSession();

        const isTransient = this.isTransientError(error);
        this.logger?.warn(
          `[uow] Transaction aborted on attempt ${attempt}. Transient: ${isTransient}. Error: ${(error as Error)?.message}`
        );

        if (isTransient && attempt < maxRetries) {
          continue;
        }

        throw error;
      }
    }

    throw lastError;
  }

  private isTransientError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const mongoErr = error as { hasErrorLabel?: (label: string) => boolean; code?: number };
    return Boolean(
      mongoErr.hasErrorLabel?.('TransientTransactionError') ||
      mongoErr.hasErrorLabel?.('UnknownTransactionCommitResult') ||
      mongoErr.code === 112 // WriteConflict
    );
  }
}
