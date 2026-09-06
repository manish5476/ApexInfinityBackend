# Contributing to `apex-framework`

`apex-framework` is the enterprise TypeScript backend foundation for Apex Infinity, built on Clean Architecture and Domain-Driven Design (DDD).

---

## 1. Architectural Guardrails (Non-Negotiable)

1. **Dependency Direction**:
   - Presentation $\rightarrow$ Application $\rightarrow$ Domain $\leftarrow$ Infrastructure
   - Domain must NEVER import `express`, `mongoose`, `mongodb`, `ioredis`, `bullmq`, `nodemailer`, or any third-party framework SDK.
   - Application must NEVER import `express` (`Request`, `Response`) or database models directly.
   - Presentation controllers must NEVER query MongoDB or import Mongoose models directly.

2. **Strict Multi-Tenancy**:
   - Every tenant-owned entity must use `ITenantRepository` with explicit `organizationId` scoping.
   - Cross-tenant data access is strictly prohibited.

3. **No Global Singletons & No Service Locator**:
   - Never write `export default new Service()`.
   - Never write `container.resolve('anything')`.
   - Use explicit constructor injection through the module's composition root.

4. **Pure Value Objects**:
   - Financial calculations MUST use the `Money` value object (integer minor units). Never use floating-point arithmetic for currency.
   - Time-sensitive business logic MUST use the `IClock` abstraction.

---

## 2. Module Development Workflow

When adding a new module or migrating an existing domain into `apex-framework`:

1. **Domain Layer (`src/modules/<name>/domain/`)**:
   - Define Entities extending `Entity<TId>` or `AggregateRoot<TId>`.
   - Define Value Objects and Domain Events (`IDomainEvent`).
   - Define Repository Ports (`IRepository` or `ITenantRepository`).
   - Write pure unit tests in `tests/unit/domain/<name>.spec.ts` (must run without MongoDB or Express).

2. **Application Layer (`src/modules/<name>/application/`)**:
   - Define DTOs (`Create<Entity>Dto`, `<Entity>ResponseDto`).
   - Implement Use Cases implementing `IUseCase<TInput, TOutput>`.
   - Implement Mappers (`IMapper<TDomain, TPersistence, TDto>`).
   - Write use case unit tests in `tests/unit/application/<name>.spec.ts` using in-memory repository stubs.

3. **Infrastructure Layer (`src/modules/<name>/infrastructure/`)**:
   - Define Mongoose schemas and models inside `persistence/`.
   - Implement the repository port extending `MongoBaseRepository`.
   - Provide an in-memory repository implementation for unit testing.

4. **Presentation Layer (`src/modules/<name>/presentation/`)**:
   - Define Zod validation schemas in `validators/`.
   - Create a thin controller that parses input, calls use cases, and returns standard `ApiResponse`.
   - Define routes in `routes/`.

5. **Composition Root (`src/modules/<name>/index.ts`)**:
   - Export factory function `create<Name>Module(deps)` wiring constructor dependencies.

---

## 3. Verification Checklist Before Committing

Every change must pass all verification gates:

```bash
# 1. Typecheck (Strict mode)
npm run typecheck

# 2. Architecture Fitness Tests
npm run test:architecture

# 3. Unit Tests
npm run test:unit

# 4. Integration Tests
npm run test:integration

# 5. Production Build
npm run build
```
