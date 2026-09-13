# API Compatibility Matrix: Legacy vs New Apex Framework

## Architectural Paradigm
- **Legacy**: Express 4.x + direct Mongoose controller queries + implicit global models.
- **Framework**: Clean Architecture & DDD (Controller -> UseCase -> Domain Entity/Port -> Mongoose Repository).
- **Golden Rule**: *Change the implementation architecture, not the business contract.*

---

## 1. Authentication & Identity
| Endpoint / Operation | Legacy Route | Framework Route | Method | Request Compatible | Response Compatible | Auth Guard | Tenant Isolation |
|---|---|---|---|:---:|:---:|:---:|:---:|
| User Login | /api/v1/auth/login | /api/v1/auth/login | POST | Yes (email, password, uniqueShopId) | Yes (	oken, efreshToken, user) | Public | Verified by uniqueShopId |
| User Registration | /api/v1/auth/signup | /api/v1/auth/register & /api/v1/auth/signup | POST | Yes | Yes (201 Created) | Public | Scoped to shop |
| Token Refresh | /api/v1/auth/refresh-token | /api/v1/auth/refresh-token | POST | Yes | Yes | Public | Via refresh token |
| Password Update | /api/v1/auth/update-my-password | /api/v1/auth/update-my-password | PATCH | Yes | Yes | Bearer JWT | Authenticated user |
| Password Reset Flow | /api/v1/auth/forgot-password | /api/v1/auth/forgot-password | POST | Yes | Yes | Public | Email lookup |
| User Profile | /api/v1/users/me | /api/v1/users/me | GET | Yes | Yes | Bearer JWT | Authenticated user |
| Session Revocation | /api/v1/sessions/revoke-all | /api/v1/sessions/revoke-all | PATCH | Yes | Yes | Bearer JWT | Authenticated user |

---

## 2. Organization & Multi-Tenancy
| Endpoint / Operation | Legacy Route | Framework Route | Method | Request Compatible | Response Compatible | Auth Guard | Tenant Isolation |
|---|---|---|---|:---:|:---:|:---:|:---:|
| Create Organization | /api/v1/organization | /api/v1/organizations | POST | Yes (Full 9-entity payload) | Yes (Org, Owner, Tokens, Setup) | Public | Initializes Tenant |
| My Organization | /api/v1/organization/my-organization | /api/v1/organizations/my-organization | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Update My Org | /api/v1/organization/my-organization | /api/v1/organizations/my-organization | PATCH | Yes | Yes | Bearer JWT | Owner only |
| Branch List | /api/v1/branches | /api/v1/branches | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Create Branch | /api/v1/branches | /api/v1/branches | POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Ownership Transfer | /api/v1/ownership/initiate | /api/v1/ownership/initiate | POST | Yes | Yes | Bearer JWT | Owner only |

---

## 3. CRM & Customers
| Endpoint / Operation | Legacy Route | Framework Route | Method | Request Compatible | Response Compatible | Auth Guard | Tenant Isolation |
|---|---|---|---|:---:|:---:|:---:|:---:|
| List Customers | /api/v1/customers | /api/v1/customers | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Create Customer | /api/v1/customers | /api/v1/customers | POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Customer Details | /api/v1/customers/:id | /api/v1/customers/:id | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Suppliers List | /api/v1/suppliers | /api/v1/suppliers | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |

---

## 4. Inventory & Products
| Endpoint / Operation | Legacy Route | Framework Route | Method | Request Compatible | Response Compatible | Auth Guard | Tenant Isolation |
|---|---|---|---|:---:|:---:|:---:|:---:|
| Product Catalog | /api/v1/products | /api/v1/products | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Create Product | /api/v1/products | /api/v1/products | POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Product Search | /api/v1/products/search | /api/v1/products/search | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Stock Transfer | /api/v1/stock/transfer | /api/v1/stock/transfer | POST | Yes | Yes | Bearer JWT | Branch-to-branch scoped |
| Sales Orders | /api/v1/sales | /api/v1/sales | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Purchases | /api/v1/purchases | /api/v1/purchases | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |

---

## 5. Accounting & Invoicing
| Endpoint / Operation | Legacy Route | Framework Route | Method | Request Compatible | Response Compatible | Auth Guard | Tenant Isolation |
|---|---|---|---|:---:|:---:|:---:|:---:|
| Invoice List | /api/v1/invoices | /api/v1/invoices | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Create Invoice | /api/v1/invoices | /api/v1/invoices | POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Invoice PDF Stream | /api/v1/invoices/pdf/:id | /api/v1/invoices/pdf/:id | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Payments | /api/v1/payments | /api/v1/payments | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Chart of Accounts | /api/v1/accounts | /api/v1/accounts | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |

---

## 6. Storefront (Public & Admin) & Delivery
| Endpoint / Operation | Legacy Route | Framework Route | Method | Request Compatible | Response Compatible | Auth Guard | Tenant Isolation |
|---|---|---|---|:---:|:---:|:---:|:---:|
| Public Storefront Products | /api/v1/store/:orgSlug/products | /api/v1/store/:orgSlug/products | GET | Yes | Yes | Public | Scoped via URL slug |
| Public Storefront Cart | /api/v1/store/:orgSlug/cart | /api/v1/store/:orgSlug/cart | GET / POST | Yes | Yes | Public Session | Scoped via URL slug |
| Public Storefront Checkout | /api/v1/store/:orgSlug/checkout | /api/v1/store/:orgSlug/checkout | POST | Yes | Yes | Public Session | Scoped via URL slug |
| Admin CMS Pages | /api/v1/admin/storefront/pages | /api/v1/admin/storefront/pages | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Admin Storefront Orders | /api/v1/admin/storefront/orders | /api/v1/admin/storefront/orders | GET | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Delivery Agent Orders | /api/v1/delivery-agent/orders | /api/v1/delivery-agent/orders | GET | Yes | Yes | Agent Token | Assigned agent scope |
| Platform Delivery Orders | /api/v1/platform-delivery/orders | /api/v1/platform-delivery/orders | GET | Yes | Yes | Platform Auth | Multi-tenant platform |

---

## 7. HRMS Suite
| Endpoint / Operation | Legacy Route | Framework Route | Method | Request Compatible | Response Compatible | Auth Guard | Tenant Isolation |
|---|---|---|---|:---:|:---:|:---:|:---:|
| Employee Directory | /api/v1/hrms/employees | /api/v1/hrms/employees | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Departments | /api/v1/hrms/departments | /api/v1/hrms/departments | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Attendance Punch | /api/v1/hrms/attendance/punch | /api/v1/hrms/attendance/punch | POST | Yes | Yes | Bearer JWT | User / org scoped |
| Leave Applications | /api/v1/hrms/leave-requests | /api/v1/hrms/leave-requests | GET / POST | Yes | Yes | Bearer JWT | Scoped to JWT orgId |
| Payroll Runs | /api/v1/hrms/payroll/runs | /api/v1/hrms/payroll/runs | GET / POST | Yes | Yes | Bearer JWT | Admin / HR scoped |
