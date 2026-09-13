export interface ApiSuccess<T> { status: 'success'; data: T; meta?: Record<string, unknown>; requestId?: string; }
export interface ApiFailure { status?: 'error' | 'fail'; message?: string; errors?: Record<string, string[] | string>; requestId?: string; }

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;
