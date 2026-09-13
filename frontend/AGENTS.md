# Frontend contribution rules

- Use App Router and keep server components server-side unless interactivity requires a client boundary.
- Never create business mock data, fake services, or frontend business calculations.
- Call APIs only through `lib/api/client.ts`; model real contracts in `types/`.
- Never persist tokens in localStorage or sessionStorage. Do not use URL organization IDs as authority.
- Use semantic theme tokens, UI primitives, and responsive layout tokens. No hard-coded application colors or arbitrary component spacing.
- Put feature code under `features/<capability>/`; keep shared UI in `components/`.
- Every data view needs loading, error, empty, and permission-aware states.
- Add or update unit tests for contracts, error normalization, and authorization helpers. Run lint, typecheck, tests, and build.
