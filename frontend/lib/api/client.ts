import { env } from '@/config/env';
import type { ApiEnvelope, ApiSuccess } from '@/types/api/contracts';
import { ApiError } from './errors';

export type AccessTokenProvider = () => string | undefined;

export class ApiClient {
  constructor(private readonly accessToken: AccessTokenProvider = () => undefined) {}

  async request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15_000);
    const requestId = crypto.randomUUID();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Request-ID', requestId);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const token = this.accessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const abort = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
        ...init, headers, signal: abort, credentials: 'include', cache: 'no-store',
      });
      const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<T>;
      if (!response.ok || payload.status !== 'success') {
        const failed = payload as Exclude<ApiEnvelope<T>, ApiSuccess<T>>;
        throw new ApiError(failed.message ?? `Request failed (${response.status})`, response.status, failed.requestId ?? requestId, failed.errors);
      }
      return payload.data;
    } finally { window.clearTimeout(timeout); }
  }
}
