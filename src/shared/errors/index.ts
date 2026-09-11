/**
 * Base Application Error
 */
export abstract class AppBaseError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly code: string;
  public readonly isOperational: boolean = true;
  public readonly details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Domain Rule Violation (e.g. invariant broken inside entity)
 */
export class DomainError extends AppBaseError {
  public readonly statusCode = 422;
  public readonly code = 'DOMAIN_RULE_VIOLATION';

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/**
 * Application / Use Case Level Error
 */
export class ApplicationError extends AppBaseError {
  public readonly statusCode = 400;
  public readonly code = 'APPLICATION_ERROR';

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/**
 * Bad Request Error (HTTP 400)
 */
export class BadRequestError extends AppBaseError {
  public readonly statusCode = 400;
  public readonly code = 'BAD_REQUEST';

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/**
 * Resource Not Found Error
 */
export class NotFoundError extends AppBaseError {
  public readonly statusCode = 404;
  public readonly code = 'NOT_FOUND';

  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' was not found.`
      : `${resource} was not found.`;
    super(message, { resource, identifier });
  }
}

/**
 * Validation Error (Input payload failed validation)
 */
export class ValidationError extends AppBaseError {
  public readonly statusCode = 400;
  public readonly code = 'VALIDATION_ERROR';

  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, fieldErrors);
  }
}

/**
 * Conflict Error (Unique constraint violation, state transition conflict)
 */
export class ConflictError extends AppBaseError {
  public readonly statusCode = 409;
  public readonly code = 'CONFLICT';

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}

/**
 * Authentication Failure Error
 */
export class UnauthorizedError extends AppBaseError {
  public readonly statusCode = 401;
  public readonly code = 'UNAUTHORIZED';

  constructor(message = 'Authentication required or token expired.') {
    super(message);
  }
}

/**
 * Authorization / Permission / Tenant Isolation Error
 */
export class ForbiddenError extends AppBaseError {
  public readonly statusCode = 403;
  public readonly code = 'FORBIDDEN';

  constructor(message = 'Access denied: insufficient permissions or organization mismatch.') {
    super(message);
  }
}

/**
 * Technical / Infrastructure Layer Error
 */
export class InfrastructureError extends AppBaseError {
  public readonly statusCode = 500;
  public readonly code = 'INFRASTRUCTURE_ERROR';
  public override readonly isOperational = false;

  constructor(message: string, details?: unknown) {
    super(message, details);
  }
}
