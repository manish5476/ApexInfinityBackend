# Architecture

`app/` owns routing and layouts. `features/` owns business capabilities. `components/` only contains reusable UI and layouts. `lib/api/` is the sole HTTP boundary. `providers/` owns cross-cutting client state. `types/` mirrors backend contracts.

The browser holds the access token only in memory. The Apex backend stores the refresh token in an HTTP-only cookie and the frontend restores sessions through `POST /auth/refresh-token`, then resolves `GET /auth/me`. Backend-issued roles and permissions are UX hints; backend authorization remains the security boundary.

Authenticated API calls use `credentials: include`, `Authorization: Bearer <access token>`, `cache: no-store`, an abortable 15-second timeout, and a client request ID. The current backend responses use `{ status: 'success', data }`.
