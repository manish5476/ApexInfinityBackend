# Authentication & Identity Architecture

## Overview
Authentication in the new **Apex Infinity Framework** guarantees backward compatibility with legacy clients (pex-crm-backend) while enforcing Clean Architecture boundaries and defense-in-depth against multi-tenant access bypasses.

---

## 1. Shop-Aware Login Flow
In multi-tenant SaaS commerce, user accounts belong to a specific tenant workspace. To authenticate, a client must provide:
1. email (or verified primary phone number)
2. password
3. uniqueShopId (or organizationSlug)

### Resolution Pipeline
`	ext
Client Login Request (email, password, uniqueShopId)
        ↓
Look up Organization by uniqueShopId (UPPERCASE)
        ↓
Find User scoped by organizationId AND (email OR phone)
        ↓
Verify status !== 'pending'/'rejected'/'suspended'
        ↓
Bcrypt Password Hash Comparison
        ↓
Issue Access Token + Refresh Token + User Session
`

---

## 2. JWT Claims Specification
Both access tokens and refresh tokens are signed with symmetric secrets (JWT_SECRET / REFRESH_TOKEN_SECRET).

### Token Claims Structure
`json
{
  userId: b9aa9aa5-8b5e-498d-b495-c3fffaa3bae2,
  id: b9aa9aa5-8b5e-498d-b495-c3fffaa3bae2,
  sub: b9aa9aa5-8b5e-498d-b495-c3fffaa3bae2,
  organizationId: 06b2e624-2964-428f-875a-92b078b5ca96,
  roles: [owner, superadmin],
  permissions: [*],
  type: merchant_user,
  tokenType: access,
  iat: 1789295419,
  exp: 1789299019
}
`

### Claim Compatibility Notes
- userId: Primary framework identifier.
- id and sub: Dual-emitted in tokens to satisfy legacy middleware or microservice consumers that inspect decoded.id or standard RFC subject sub.
- 	ype: Set to 'merchant_user' to satisfy legacy client guards checking token taxonomy.
- organizationId: Cryptographically tamper-proof organization ID claim.

---

## 3. Session Management & Multi-Device Control
- Every successful login issues an AuthSession document stored in MongoDB.
- Tokens store hashes in session records (ccessTokenHash, efreshTokenHash).
- Users can revoke all active sessions via PATCH /api/v1/sessions/revoke-all or inspect logged-in devices via GET /api/v1/users/me/devices.
