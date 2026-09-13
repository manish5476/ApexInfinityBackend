import { env } from '@/config/env';
import type { ApiEnvelope } from '@/types/api/contracts';
import { ApiError } from './errors';

export class ApiClient {
  private accessToken?: string;
  private unauthorizedHandler?: () => Promise<boolean>;

  setAccessToken(token?: string): void { this.accessToken = token; }
  setUnauthorizedHandler(handler?: () => Promise<boolean>): void { this.unauthorizedHandler = handler; }

  async request<T>(path: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
    return this.execute<T>(path, init, signal, false);
  }

  private async execute<T>(path: string, init: RequestInit, signal: AbortSignal | undefined, retried: boolean): Promise<T> {
    const requestId = globalThis.crypto.randomUUID();
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    headers.set('X-Request-ID', requestId);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    const token = this.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const timeout = AbortSignal.timeout(15_000);
    const abort = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
        ...init, headers, signal: abort, credentials: 'include', cache: 'no-store',
      });
      const payload = (await response.json().catch(() => undefined)) as ApiEnvelope<T> | undefined;
      if (response.status === 401 && !retried && this.unauthorizedHandler && !path.startsWith('/auth/')) {
        if (await this.unauthorizedHandler()) return this.execute<T>(path, init, signal, true);
      }
      if (!response.ok || !payload || !payload.success) {
        const error = payload && !payload.success ? payload.error : undefined;
        throw new ApiError(error?.message ?? `Request failed (${response.status})`, response.status, error?.code ?? 'HTTP_ERROR', requestId, asFieldErrors(error?.details));
      }
      return payload.data;
    } catch (cause) {
      if (cause instanceof ApiError) throw cause;
      if (cause instanceof DOMException && cause.name === 'TimeoutError') throw new ApiError('The request timed out. Please try again.', 408, 'REQUEST_TIMEOUT', requestId);
      throw new ApiError('Unable to reach Apex Infinity. Check your connection and try again.', 0, 'NETWORK_ERROR', requestId);
    }
  }
}

function asFieldErrors(details: unknown): Record<string, string[] | string> | undefined {
  return details && typeof details === 'object' && !Array.isArray(details) ? details as Record<string, string[] | string> : undefined;
}
