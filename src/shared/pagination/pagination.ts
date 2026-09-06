import { ValidationError } from '../errors';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type SortDirection = 'asc' | 'desc' | 1 | -1;

export interface SortParams {
  field: string;
  direction: SortDirection;
}

export class PaginationHelper {
  public static parse(
    rawQuery: { page?: unknown; limit?: unknown },
    defaultLimit = 20,
    maxLimit = 100
  ): PaginationParams {
    let page = parseInt(String(rawQuery.page || '1'), 10);
    let limit = parseInt(String(rawQuery.limit || defaultLimit), 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    }
    if (isNaN(limit) || limit < 1) {
      limit = defaultLimit;
    }
    if (limit > maxLimit) {
      limit = maxLimit;
    }

    return { page, limit };
  }

  public static createResult<T>(
    items: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResult<T> {
    const totalPages = Math.ceil(total / params.limit) || 1;
    return {
      items,
      total,
      page: params.page,
      limit: params.limit,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    };
  }

  /**
   * Validates that the requested sort field is in the approved whitelist.
   * Prevents unsafe sort key injection into MongoDB queries.
   */
  public static validateSortField(
    allowedFields: readonly string[],
    requestedField?: string,
    defaultField = 'createdAt'
  ): string {
    if (!requestedField) return defaultField;
    if (!allowedFields.includes(requestedField)) {
      throw new ValidationError(`Invalid sort field '${requestedField}'. Allowed fields: ${allowedFields.join(', ')}`);
    }
    return requestedField;
  }
}
