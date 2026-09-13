export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
    public readonly fieldErrors?: Record<string, string[] | string>,
  ) { super(message); this.name = 'ApiError'; }
}

export function userMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof DOMException && error.name === 'AbortError') return 'The request timed out. Please try again.';
  return 'Unable to reach Apex Infinity. Check your connection and try again.';
}
