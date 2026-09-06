export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  requestId?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: ApiResponseMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiResponseFactory {
  public static success<T>(data: T, meta?: ApiResponseMeta): ApiSuccessResponse<T> {
    return {
      success: true,
      data,
      ...(meta ? { meta } : {}),
    };
  }

  public static error(code: string, message: string, details?: unknown): ApiErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
    };
  }
}
