# Apex Framework — Migration Notes & Contract Preservation Reference

## Executive Overview
This document records the contract preservation, multi-tenant architectural guarantees, legacy parity decisions, and production Swagger/OpenAPI documentation for the **Apex Infinity** Modular Monolith Platform (pex-framework).

The guiding principle of this migration is:
> **Change the implementation architecture, not the business contract.**

---

## 1. Multi-Tenant Identity & Shop Resolution
### Legacy Reference
In pex-crm-backend, shops and organizations are identified through:
- uniqueShopId: Case-insensitive uppercase identifier unique across all organizations (e.g. SHIVAM).
- organizationSlug / slug: Slugified name matching the shop (e.g. shivam-electronics).
- organizationId: The primary MongoDB _id string for the tenant record.

### Framework Guarantees
- pex-framework enforces uniqueShopId as a mandatory, uppercase unique index on the Organization model.
- During authentication (POST /api/v1/auth/login and POST /api/v1/auth/signup), users provide uniqueShopId (or organizationSlug). The backend looks up the tenant organization and validates user membership strictly within that organization.
- Cross-tenant identity spoofing is strictly disallowed. The authenticated user identity and organizationId are derived authoritatively from the signed JWT access token.

---

## 2. Authentication & JWT Token Compatibility
### Legacy vs New Claims Matrix
| Claim | Legacy (pex-crm-backend) | Framework (pex-framework) | Status | Compatibility Notes |
|---|---|---|---|---|
| userId / id / sub | id & sub | userId | **Compatible** | Framework dual-emits and normalizes userId, id, and sub in all tokens. |
| organizationId | organizationId | organizationId | **Compatible** | Enforced across all tenant queries. |
| 	ype | merchant_user | 	ype | **Compatible** | Framework includes 	ype: 'merchant_user' for legacy guard compatibility. |
| oles | Single role string on doc | oles: string[] | **Compatible** | Preserves array of roles with superadmin/owner checks. |
| permissions | permissions: string[] | permissions: string[] | **Compatible** | Preserves granular permissions and * wildcard for owners. |
| isOwner | Computed Boolean | Computed Boolean | **Compatible** | Preserved from organization owner mapping. |
| isSuperAdmin | Role boolean | Role boolean | **Compatible** | Preserved across token and request context. |

---

## 3. Atomic 9-Entity Onboarding
During POST /api/v1/organizations, the following entities are created atomically in a single MongoDB transaction:
1. **Organization** (Settings, features, currency: INR, fiscal year: April, uniqueShopId: UPPERCASE)
2. **Branch** (MAIN branch marked as isMainBranch: true)
3. **Role** (Super Admin role with ['*'] permissions)
4. **Shift** (General Shift: 09:00 - 18:00, 15 min grace period)
5. **Department** (Administration department)
6. **Designation** (Director designation, level 10)
7. **User / Owner** (Hashed credentials, active owner status)
8. **Employee** (Default employee record EMP-001 linked to owner user)
9. **LeaveBalance** (Pre-seeded: CL: 12, SL: 10, EL: 15)
10. **Storefront Pages** (4 pre-seeded core CMS pages: home, bout, contact, products)

---

## 4. OpenAPI / Swagger Documentation
- **Interactive Documentation**: Available at /api/docs/
- **Raw OpenAPI 3.0 JSON Specification**: Available at /api/docs/json and /api/docs.json
- **Convenience Redirects**: /api-docs and /docs automatically redirect to /api/docs/
- **Exported Specification**: Pre-rendered YAML specification available at docs/openapi.yaml
- **Automated Validation**: Automated CI test suite in 	ests/unit/infrastructure/swagger-docs.spec.ts guarantees:
  - 0 dangling/broken $ref schema pointers.
  - Complete coverage across all 286 paths and 356 operations.
