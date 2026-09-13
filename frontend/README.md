# Apex Infinity Frontend

The clean Next.js 16 App Router frontend for the Apex Framework backend. It is intentionally a separate application under `frontend/`; the repository root remains the backend.

## Run

1. Copy `.env.example` to `.env.local` and set the running Apex API's `/api/v1` URL.
2. Run `npm install` and then `npm run dev` from this directory.

Use `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build` before merging.

## Current scope

This delivers the Phase 1–3 foundation: tokens, themes, responsive app shell, API client, real auth/session bootstrap, centralized permissions, query cache, and core states. It deliberately does not show fake dashboard data. Feature teams must inspect the actual backend route and contract before adding a screen.
