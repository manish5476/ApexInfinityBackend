# Apex Infinity — `apex-framework`
> TypeScript Modular Monolith Backend Foundation  
> Clean Architecture + Domain-Driven Design + Dependency Inversion + Production Infrastructure

`apex-framework` is the enterprise-grade TypeScript backend framework for Apex Infinity. It enforces strict separation of concerns, isolation of technical infrastructure, explicit multi-tenancy, and testable domain use cases.

---

## Architecture Overview

```text
                  PRESENTATION LAYER
         (Controllers, Routes, Validators, Middlewares)
                         ↓
                  APPLICATION LAYER
           (Use Cases, Commands, Queries, DTOs, Mappers)
                         ↓
                    DOMAIN LAYER
      (Entities, Value Objects, Domain Policies, Events, Repository Ports)
                         ↑
                 INFRASTRUCTURE LAYER
    (Mongo Repositories, Redis/Memory Cache, Logger, EventBus, Adapters)
```

- **Domain**: Pure TypeScript. Zero framework imports. Business entities, aggregate roots, value objects (`Money`, `EmailAddress`, `TenantScope`), domain events, repository interfaces.
- **Application**: Use Cases (`IUseCase`), Command/Query DTOs, Mappers, and Unit of Work (`IUnitOfWork`).
- **Infrastructure**: MongoDB Connection Manager, Mongo repositories implementing domain ports, Memory & Redis caching, structured logging with correlation IDs, and event bus.
- **Presentation**: Thin Express controllers, Zod validation schemas, and modular routing.
- **Composition Root**: Pure constructor dependency injection without global singletons or service locators.

---

## Directory Structure

```text
apex-framework/
├── src/
│   ├── config/             # Typed Zod environment validation
│   ├── shared/             # Errors, Result pattern, API contracts, Value Objects, Clock
│   ├── core/               # Base Domain (Entity, AggregateRoot, Events) & Application (UseCase, UoW)
│   ├── infrastructure/     # Database (Mongo), Cache (Memory/Redis), Logging (Winston), Events
│   ├── middleware/         # Security headers, CORS, RequestContext, Rate Limiting, Error handling
│   ├── modules/
│   │   ├── health/         # System health, liveness, and readiness probes
│   │   └── organization/   # Reference Clean Architecture module (Domain -> App -> Infra -> Pres)
│   └── app/
│       ├── app.ts          # Express application factory
│       ├── server.ts       # Server lifecycle & graceful shutdown
│       └── composition/    # Dependency composition root
├── tests/
│   ├── unit/               # Domain and use case tests (run without MongoDB or Express)
│   ├── architecture/       # Fitness tests verifying layer boundary rules
│   └── integration/        # Supertest HTTP integration tests
├── tsconfig.json           # Strict TypeScript configuration
├── tsconfig.build.json     # Production build configuration
├── package.json
└── ARCHITECTURE.md
```

---

## Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

### 3. Typecheck
```bash
npm run typecheck
```

### 4. Run Automated Tests
```bash
# Run all tests (unit, architecture, integration)
npm test

# Run pure domain unit tests
npm run test:unit

# Run architecture fitness tests
npm run test:architecture
```

### 5. Build for Production
```bash
npm run build
```

### 6. Start Server
```bash
# Development (with hot-reload)
npm run dev

# Production
npm start
```

---

## Health & Probe Endpoints

- `GET /health` — Runtime health, uptime, and database connection status.
- `GET /health/live` — Kubernetes / Docker liveness probe (200 OK if process is running).
- `GET /health/ready` — Kubernetes readiness probe (200 OK if MongoDB is connected; 503 if unavailable).
