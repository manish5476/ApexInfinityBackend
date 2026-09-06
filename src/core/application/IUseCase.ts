import { Result } from '../../shared/result';

export interface IApplicationContext {
  requestId: string;
  correlationId: string;
  organizationId?: string;
  userId?: string;
  roles: string[];
  permissions: string[];
}

/**
 * Universal interface for Application Use Cases.
 * Each use case encapsulates a single business operation.
 */
export interface IUseCase<TInput, TOutput> {
  execute(input: TInput, context?: IApplicationContext): Promise<Result<TOutput>>;
}
