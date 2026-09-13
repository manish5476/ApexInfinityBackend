# API integration

The API base URL comes only from `NEXT_PUBLIC_API_BASE_URL` and must include `/api/v1`. Add endpoint functions under their feature and call the centralized `ApiClient`; never call `fetch` from pages or components. Define each contract in `types/` from the backend implementation, including pagination and error bodies.

Before a feature is built, confirm its route, request/response schemas, authenticated context, tenant behavior, errors, and filter/pagination semantics. Missing endpoints must produce an honest unavailable state.
