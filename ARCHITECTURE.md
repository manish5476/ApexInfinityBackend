# Apex Infinity — `apex-framework`
# Architectural Specification & Reference Guide

This document defines the architectural rules, layer boundaries, dependency directions, and engineering standards for the Apex Infinity Modular Monolith backend framework.

---

## 1. Architectural Baseline: The Dependency Rule

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

### Absolute Layer Rules:
1. **Domain Layer (`src/core/domain/`, `src/modules/*/domain/`)**:
   - MUST be written in 100% pure TypeScript.
   - MUST NEVER import `express`, `mongoose`, `mongodb`, `ioredis`, `bullmq`, `nodemailer`, or any third-party infrastructure SDK.
   - Encapsulates business entities, invariants, aggregate roots, value objects (`Money`, `EmailAddress`, `TenantScope`), domain events, and repository interfaces (ports).

2. **Application Layer (`src/core/application/`, `src/modules/*/application/`)**:
   - Contains Use Cases implementing `IUseCase<TInput, Promise<Result<TOutput>>>`.
   - Contains plain request/response DTOs and Mappers.
   - Contains `IUnitOfWork` transaction orchestration.
   - MUST NEVER import Express `Request` or `Response`.
   - MUST NEVER import database models or Mongoose schemas directly.

3. **Infrastructure Layer (`src/infrastructure/`, `src/modules/*/infrastructure/`)**:
   - Implements Domain and Application ports (`IRepository`, `ITenantRepository`, `ICache`, `IEventBus`, `IClock`, `ILogger`).
   - Mongoose schemas and models are strictly confined here.
   - Documents are mapped to/from pure Domain Entities via `IMapper`. Mongoose documents NEVER leak to Application or Presentation layers.

4. **Presentation Layer (`src/middleware/`, `src/modules/*/presentation/`)**:
   - Thin Express controllers that parse input, invoke use cases, and format responses into standardized envelopes.
   - Input validation schemas (Zod).
   - Route declarations.

5. **Composition Root (`src/app/composition/`)**:
   - Explicit constructor injection.
   - NO global business singletons (`Service.instance`).
   - NO service locator (`Container.resolve('anything')`).

---

## 2. Multi-Tenancy Architecture

Apex Infinity is an enterprise multi-tenant platform centered around **Organizations** and **Branches**.

### Tenancy Principles:
1. **Explicit Tenancy**: Organization-scoped repository methods must declare their tenant scope in the port signature:
   ```typescript
   export interface ITenantRepository<TEntity, TId> {
     findById(scope: TenantScopedId<TId>): Promise<TEntity | null>;
     find(query: TenantQueryCriteria): Promise<PaginatedResult<TEntity>>;
     save(entity: TEntity): Promise<TEntity>;
     delete(scope: TenantScopedId<TId>): Promise<boolean>;
   }
   ```
2. **Repository Guarding**: `MongoBaseRepository` automatically merges `{ organizationId: scope.organizationId }` into all database queries, preventing cross-tenant data leaks.
3. **Request Context**: Every incoming HTTP request executes inside an `AsyncLocalStorage` scope (`RequestContextHolder`) carrying:
   - `requestId`: Unique UUID for the specific request.
   - `correlationId`: Correlation identifier propagated via `X-Correlation-ID` header.
   - `organizationId`: The active authenticated tenant organization.
   - `userId`: Authenticated user ID.
   - `roles`: Role identifiers (`['admin', 'manager']`).
   - `permissions`: Granular permission tags (`['hrms.employee.view', 'sales.invoice.create']`).

---

## 3. Standard API Contracts

### Success Response Envelope:
```json
{
  "success": true,
  "data": {
    "id": "org_123",
    "name": "Acme Corp"
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response Envelope:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed.",
    "details": {
      "slug": ["Slug may only contain lowercase alphanumeric characters and hyphens"]
    }
  }
}
```

---

## 4. Standard Middleware Pipeline

1. `correlationIdMiddleware`: Propagates or generates `X-Request-ID` and `X-Correlation-ID`.
2. `requestContextMiddleware`: Manages request context in `AsyncLocalStorage`.
3. `securityHeadersMiddleware`: Helmet protection (CSP, HSTS, noSniff).
4. `corsMiddleware`: Controlled origin whitelisting with preflight support.
5. `compressionMiddleware`: Gzip/Brotli payload compression.
6. `rateLimitMiddleware`: Sliding window limiter with memory fallback.
7. `bodyParsing`: JSON parser (2MB limit) + URL-encoded.
8. `sanitizationMiddleware`: NoSQL operator injection defense (`$` and `.` stripping) + HPP parameter pollution protection.
9. `requestLoggerMiddleware`: Structured request logging with durationMs and correlation IDs.
10. `timeoutMiddleware`: Request timeout guard (e.g. 30s) returning 504 Gateway Timeout.
11. `routes`: Mounted domain modules (`/health`, `/api/v1/organizations`, etc.).
12. `notFoundMiddleware`: Standard 404 handler.
13. `errorHandlerMiddleware`: Centralized error handler translating typed exceptions into standardized error envelopes with zero stack traces exposed in production.

---

## 5. Incremental Migration Strategy from Legacy `apex-crm-backend`

Apex Infinity already has an existing production backend (`apex-crm-backend`). The migration MUST be incremental and risk-free:

```text
Phase 1: Foundation (COMPLETED)
└── Platform infrastructure, Clean Architecture, test foundation, composition root.

Phase 2: Platform Identity & Tenancy
├── Migrate Auth (User identity, password hashing, JWT token services).
└── Migrate Organization & Branch models.

Phase 3: Core Business Domains
├── Migrate HRMS (Employee, Attendance, Leave, Payroll).
│   └── Ensure Employee is strictly separated from Auth User!
├── Migrate CRM (Customers, Leads, Opportunities).
└── Migrate Inventory & Sales (Products, Stock, Invoices).

Phase 4: Storefront & Public APIs
└── Migrate Storefront pages, themes, and public cart/order APIs.
```

At every phase, new module implementations verify:
1. Pure domain rules with unit tests.
2. Mongoose documents strictly isolated behind repositories.
3. No breaking changes to existing frontend API routes.
