/**
 * Transaction abstraction port.
 * Allows application use cases to orchestrate multi-step mutations atomically
 * without knowing database implementation details (MongoDB session, SQL transaction, etc.).
 */
export interface IUnitOfWork {
  runInTransaction<T>(
    workFn: () => Promise<T>,
    options?: { maxRetries?: number; timeoutMs?: number }
  ): Promise<T>;
}
