export interface ApiMeta { page?: number; limit?: number; total?: number; totalPages?: number; requestId?: string; timestamp?: string; [key: string]: unknown; }
export interface ApiSuccess<T> { success: true; data: T; meta?: ApiMeta; }
export interface ApiFailure { success: false; error: { code: string; message: string; details?: unknown; }; }
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;
