# Authentication

The observed backend contract is `POST /auth/login`, `POST /auth/refresh-token`, `GET /auth/me`, and `POST /auth/logout`. Login returns an access token and sets the refresh token HTTP-only cookie. The frontend does not persist either in local or session storage. Session bootstrap refreshes first, fetches the current user only when refresh succeeds, and protects the app shell while booting.
