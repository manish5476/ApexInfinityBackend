# Organization Context & Multi-Tenant Security Boundary

## Principle: Strict Server-Side Tenant Scoping
In the new **Apex Infinity Framework**, multi-tenancy is enforced through cryptographic authentication rather than vulnerable client-supplied headers.

---

## 1. Tenant Hierarchy
`	ext
Tenant Shop (uniqueShopId: e.g. SHIVAM)
    ↓
Organization (_id: ObjectId / UUID)
    ├── Main Branch (isMainBranch: true, branchCode: MAIN)
    │     └── Additional Regional Branches (branchCode: BR-02, etc.)
    ├── Roles (Super Admin: [*], Manager, Cashier)
    ├── Users (Owner, Admin, Employees)
    ├── Shifts, Departments, Designations
    ├── Products, Inventory, Stock Levels
    ├── Invoices, Ledgers, Financial Accounts
    └── Storefront CMS Pages & Public Themes
`

---

## 2. No Client-Side Tenant Spoofing
- In insecure implementations, clients send arbitrary headers like x-organization-id: org_123 to query another tenant's records (Insecure Direct Object Reference - IDOR).
- In the new framework, the uthMiddleware reads the signed JWT:
  `	ypescript
  const decoded = tokenService.verifyToken(token);
  const user: AuthenticatedUser = {
    id: decoded.userId,
    organizationId: decoded.organizationId,
    roles: decoded.roles || [],
    permissions: decoded.permissions || [],
  };
  RequestContextHolder.setAuth({ ... });
  `
- Any client header trying to overwrite organizationId is discarded. Every database query, repository lookup, and Mongoose aggregation is strictly filtered with:
  `	ypescript
  { organizationId: context.organizationId }
  `

---

## 3. Public Storefront Resolution
Public storefront endpoints (e.g. GET /api/v1/store/:organizationSlug/products) do not require user authentication. They resolve the organization securely via the immutable, unique organizationSlug (or uniqueShopId) in the URL route parameter:
`	ext
GET /api/v1/store/shivam/products
        ↓
Look up organization where slug == 'shivam' OR uniqueShopId == 'SHIVAM'
        ↓
Filter active and published products belonging to that organizationId
`
