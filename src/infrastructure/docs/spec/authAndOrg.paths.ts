import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const authAndOrgPaths: OpenApiPaths = {
  // ==========================================
  // --- AUTHENTICATION & IDENTITY (/auth/*) ---
  // ==========================================
  '/auth/login': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Authenticate with email, password, and Shop ID (e.g. "shivam")',
      description: 'Generates access and refresh tokens. Every user belongs to a specific tenant shop. Users must supply their uniqueShopId (or organizationSlug) alongside email and password to authenticate into their workspace.',
      security: [],
      requestBody: jsonBody('LoginRequest'),
      responses: {
        200: {
          description: 'Login successful',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
        },
        400: { description: 'Missing email, password, or Shop ID' },
        401: { description: 'Invalid credentials, shop mismatch, or account suspended' },
        404: { description: 'Specified Shop ID or organization does not exist' },
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Register new tenant user / member',
      security: [],
      requestBody: jsonBody('RegisterRequest'),
      responses: createdResponse('User registered successfully', 'LoginResponse'),
    },
  },
  '/auth/signup': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'User registration alias (public signup)',
      security: [],
      requestBody: jsonBody('RegisterRequest'),
      responses: createdResponse('User registered successfully', 'LoginResponse'),
    },
  },
  '/auth/refresh-token': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Exchange refresh token for a new access token',
      security: [],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          refreshToken: { type: 'string', description: 'Refresh token string (or read from HTTP-only cookie)' },
        },
      }),
      responses: okResponse('New access token generated'),
    },
  },
  '/auth/forgot-password': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Request password reset link via email',
      security: [],
      requestBody: jsonBody('ForgotPasswordRequest'),
      responses: okResponse('Password reset email dispatched'),
    },
  },
  '/auth/reset-password/{token}': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Reset password using valid reset token',
      security: [],
      parameters: [pathParam('token', 'Password reset opaque token')],
      requestBody: jsonBody('ResetPasswordRequest'),
      responses: okResponse('Password successfully updated', 'LoginResponse'),
    },
  },
  '/auth/verify-token': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Validate active access token state',
      responses: okResponse('Token is valid and active'),
    },
  },
  '/auth/verify-email/{token}': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Verify user email address from registration token',
      security: [],
      parameters: [pathParam('token', 'Email verification token')],
      responses: okResponse('Email address confirmed'),
    },
  },
  '/auth/update-my-password': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Update password for current authenticated user',
      requestBody: jsonBody('UpdatePasswordRequest'),
      responses: okResponse('Password changed successfully'),
    },
  },
  '/auth/send-verification-email': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Resend email verification link to current authenticated user',
      responses: okResponse('Verification email sent'),
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Invalidate current session and logout',
      responses: okResponse('Session closed successfully'),
    },
  },
  '/auth/logout-all': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Invalidate all active sessions across all devices',
      responses: okResponse('All sessions revoked'),
    },
  },
  '/auth/me': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get active user profile and permission manifest',
      responses: okResponse('Active profile data'),
    },
  },
  '/auth/users': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List users in organization (Auth module endpoint)',
      parameters: [
        queryParam('search', 'Search by name or email'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page limit', 'integer', 20),
        queryParam('isActive', 'Filter by active status', 'boolean'),
      ],
      responses: okResponse('Paginated users list'),
    },
  },
  '/auth/users/{id}': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get user details by ID (Auth module endpoint)',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User details'),
    },
  },

  // ==========================================
  // --- USER PROFILE & ADMIN (/users/*) ---
  // ==========================================
  '/users/me': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Retrieve current user personal profile',
      responses: okResponse('User profile'),
    },
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Update current user personal profile details',
      requestBody: jsonBody({
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Shivam Patel' },
          phone: { type: 'string', example: '+919876543210' },
          avatar: { type: 'string', format: 'uri' },
          preferences: { type: 'object' },
          language: { type: 'string', example: 'en' },
          themeId: { type: 'string', example: 'dark' },
          upiId: { type: 'string', example: 'shivam@upi' },
        },
      }),
      responses: okResponse('Profile updated successfully'),
    },
  },
  '/users/me/photo': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Upload profile avatar photo for current user',
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                photo: { type: 'string', format: 'binary', description: 'Avatar image file (JPG, PNG)' },
              },
            },
          },
        },
      },
      responses: okResponse('Profile photo updated'),
    },
  },
  '/users/me/permissions': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get effective permissions assigned to current user',
      responses: okResponse('User permissions list'),
    },
  },
  '/users/me/devices': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List active devices and login sessions for current user',
      responses: okResponse('Current user active sessions list'),
    },
  },
  '/users/me/devices/{sessionId}': {
    delete: {
      tags: ['Authentication & Identity'],
      summary: 'Revoke and terminate a specific device session of current user',
      parameters: [pathParam('sessionId', 'Device session identifier')],
      responses: okResponse('Device session terminated'),
    },
  },
  '/users/all-permissions': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List all system-wide permissions catalog (Admin)',
      responses: okResponse('Full permissions catalog'),
    },
  },
  '/users/search': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Typeahead instant search across organization users',
      parameters: [
        queryParam('q', 'Search keyword (name, email, or phone)'),
        queryParam('limit', 'Max results limit', 'integer', 20),
      ],
      responses: okResponse('Matching user records'),
    },
  },
  '/users/hierarchy': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Retrieve organization user hierarchy and departmental structure',
      responses: okResponse('Organization user hierarchy tree'),
    },
  },
  '/users/export': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Export organization users data (CSV / JSON)',
      parameters: [queryParam('format', 'Export file format (csv or json)', 'string', 'csv')],
      responses: okResponse('Export file data'),
    },
  },
  '/users/check-permission': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Check if current user possesses a specific permission',
      requestBody: jsonBody({
        type: 'object',
        required: ['permission'],
        properties: {
          permission: { type: 'string', example: 'sales:manage' },
        },
      }),
      responses: okResponse('Permission status check result'),
    },
  },
  '/users/toggle-block': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Toggle active/blocked account state of a user (Admin)',
      requestBody: jsonBody({
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', example: 'usr-65e123' },
        },
      }),
      responses: okResponse('User status toggled'),
    },
  },
  '/users/bulk-status': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Bulk update user account status (Admin)',
      requestBody: jsonBody({
        type: 'object',
        required: ['userIds', 'status'],
        properties: {
          userIds: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
        },
      }),
      responses: okResponse('User statuses updated in bulk'),
    },
  },
  '/users': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List users in organization with filtering & pagination',
      parameters: [
        queryParam('search', 'Search by name or email'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size limit', 'integer', 20),
        queryParam('role', 'Filter by security role name'),
        queryParam('status', 'Filter by account status (active/inactive)'),
        queryParam('department', 'Filter by department ID'),
      ],
      responses: okResponse('Paginated users list'),
    },
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Create and provision a new user (Admin)',
      requestBody: jsonBody('CreateUserRequest'),
      responses: createdResponse('User created successfully'),
    },
  },
  '/users/by-department/{departmentId}': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List users assigned to a specific department',
      parameters: [pathParam('departmentId', 'Department ID')],
      responses: okResponse('Department team members list'),
    },
  },
  '/users/{id}/activity': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get user audit activity history and event log',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User activity logs'),
    },
  },
  '/users/{id}/photo': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Upload photo for specific user by administrator',
      parameters: [pathParam('id', 'User ID')],
      requestBody: {
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                photo: { type: 'string', format: 'binary' },
              },
            },
          },
        },
      },
      responses: okResponse('Photo updated'),
    },
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Update photo URL for specific user by administrator',
      parameters: [pathParam('id', 'User ID')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          photo: { type: 'string', format: 'uri' },
        },
      }),
      responses: okResponse('Photo updated'),
    },
  },
  '/users/{id}/password': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Admin set new password for a user',
      parameters: [pathParam('id', 'User ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['newPassword'],
        properties: {
          newPassword: { type: 'string', minLength: 8, example: 'AdminAssignedPass123!' },
        },
      }),
      responses: okResponse('Password updated by admin'),
    },
  },
  '/users/{id}/activate': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Activate a deactivated user account',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User activated'),
    },
  },
  '/users/{id}/deactivate': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Deactivate an active user account',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User deactivated'),
    },
  },
  '/users/{id}/permission-overrides': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Assign granular permission overrides to a user',
      parameters: [pathParam('id', 'User ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['permissions'],
        properties: {
          permissions: { type: 'array', items: { type: 'string' } },
        },
      }),
      responses: okResponse('User permission overrides saved'),
    },
  },
  '/users/{id}': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get user profile details by ID',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User details'),
    },
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Update user profile details by ID',
      parameters: [pathParam('id', 'User ID')],
      requestBody: jsonBody('UpdateUserRequest'),
      responses: okResponse('User updated'),
    },
    delete: {
      tags: ['Authentication & Identity'],
      summary: 'Soft-delete or deactivate user account',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User deleted'),
    },
  },
  '/users/{id}/change-role': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Change primary security role of user',
      parameters: [pathParam('id', 'User ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', example: 'manager' },
        },
      }),
      responses: okResponse('User role updated'),
    },
  },
  '/users/{id}/reset-password': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Admin generate temporary password or reset link for user',
      parameters: [pathParam('id', 'User ID')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          tempPassword: { type: 'string' },
        },
      }),
      responses: okResponse('Password reset initiated'),
    },
  },
  '/users/{id}/resend-invite': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Resend organization invitation email to user',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('Invitation email resent'),
    },
  },
  '/users/{id}/restore': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Restore a previously deleted user account',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User restored'),
    },
  },

  // ==========================================
  // --- ROLES & PERMISSIONS (/roles/*) ---
  // ==========================================
  '/roles/permissions': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get dictionary of all available system permissions grouped by module',
      responses: okResponse('System permissions grouped manifest'),
    },
  },
  '/roles/assign': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Assign role to a specific user',
      requestBody: jsonBody({
        type: 'object',
        required: ['userId', 'roleId'],
        properties: {
          userId: { type: 'string', example: 'usr-65e123' },
          roleId: { type: 'string', example: 'role-65e456' },
        },
      }),
      responses: okResponse('Role assigned to user'),
    },
  },
  '/roles/assign-bulk': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Assign a role to multiple users in bulk',
      requestBody: jsonBody({
        type: 'object',
        required: ['userIds', 'roleId'],
        properties: {
          userIds: { type: 'array', items: { type: 'string' } },
          roleId: { type: 'string', example: 'role-65e456' },
        },
      }),
      responses: okResponse('Role assigned in bulk'),
    },
  },
  '/roles': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List defined security roles and active member counts',
      responses: okResponse('Roles list with user counts'),
    },
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Create custom security role with granular permissions',
      requestBody: jsonBody('CreateRoleRequest'),
      responses: createdResponse('Role created'),
    },
  },
  '/roles/{id}': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get role details and permission manifest by ID',
      parameters: [pathParam('id', 'Role ID')],
      responses: okResponse('Role details'),
    },
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Update custom security role details or permissions',
      parameters: [pathParam('id', 'Role ID')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Lead Cashier' },
          description: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
          isDefault: { type: 'boolean' },
          isSuperAdmin: { type: 'boolean' },
        },
      }),
      responses: okResponse('Role updated'),
    },
    delete: {
      tags: ['Authentication & Identity'],
      summary: 'Delete custom security role (must have 0 assigned users)',
      parameters: [pathParam('id', 'Role ID')],
      responses: okResponse('Role deleted'),
    },
  },

  // ==========================================
  // --- SESSIONS (/sessions/*) ---
  // ==========================================
  '/sessions/me': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List current user active devices & IP sessions',
      responses: okResponse('Current user active sessions'),
    },
  },
  '/sessions': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List all multi-device sessions with filters (Admin)',
      parameters: [
        queryParam('userId', 'Filter by User ID'),
        queryParam('isValid', 'Filter by active session state (true/false)'),
        queryParam('device', 'Filter by device type (desktop/mobile)'),
        queryParam('browser', 'Filter by browser name'),
        queryParam('ipAddress', 'Filter by IP address'),
        queryParam('startDate', 'Filter sessions active after timestamp', 'string'),
        queryParam('endDate', 'Filter sessions active before timestamp', 'string'),
      ],
      responses: okResponse('Multi-device active sessions list'),
    },
  },
  '/sessions/bulk-delete': {
    delete: {
      tags: ['Authentication & Identity'],
      summary: 'Bulk delete session logs by IDs (Admin)',
      requestBody: jsonBody({
        type: 'object',
        required: ['ids'],
        properties: {
          ids: { type: 'array', items: { type: 'string' } },
        },
      }),
      responses: okResponse('Sessions deleted in bulk'),
    },
  },
  '/sessions/{id}': {
    delete: {
      tags: ['Authentication & Identity'],
      summary: 'Permanently remove session log entry by ID',
      parameters: [pathParam('id', 'Session ID')],
      responses: okResponse('Session permanently deleted'),
    },
  },
  '/sessions/{id}/revoke': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Revoke and terminate a specific device session immediately',
      parameters: [pathParam('id', 'Session ID')],
      responses: okResponse('Session revoked'),
    },
  },
  '/sessions/revoke-all': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Revoke all other active device sessions for current user',
      responses: okResponse('Other sessions revoked'),
    },
  },

  // ==========================================
  // --- ORGANIZATIONS & TENANTS (/organizations/*) ---
  // ==========================================
  '/organizations': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'List organizations with search and pagination (Platform Admin)',
      parameters: [
        queryParam('search', 'Search by organization name or slug'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size limit', 'integer', 10),
        queryParam('isActive', 'Filter by active status', 'boolean'),
      ],
      responses: okResponse('Organizations list'),
    },
    post: {
      tags: ['Organization & Branches'],
      summary: 'Public onboarding: Register new tenant organization, owner admin, default branch, & seed roles',
      description: 'Creates a brand-new multi-tenant organization. Automatically provisions owner admin user, default main branch, system roles, and returns valid JWT access and refresh tokens. This is a public onboarding endpoint.',
      security: [],
      requestBody: jsonBody('CreateOrganizationRequest'),
      responses: {
        201: {
          description: 'Organization created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrganizationResponse' } } },
        },
        400: { description: 'Missing required organization or owner fields' },
        409: { description: 'Organization slug or owner email already in use' },
      },
    },
  },
  '/organizations/create': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Public onboarding alias: Register new tenant organization',
      security: [],
      requestBody: jsonBody('CreateOrganizationRequest'),
      responses: {
        201: {
          description: 'Organization created successfully',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateOrganizationResponse' } } },
        },
      },
    },
  },
  '/organizations/lookup': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Public lookup of organizations associated with a user email',
      security: [],
      requestBody: jsonBody({
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', example: 'owner@shivam.com' },
        },
      }),
      responses: okResponse('List of organizations associated with this email'),
    },
  },
  '/organizations/shop/{uniqueShopId}': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Public lookup of organization by storefront Shop ID (e.g. "shivam")',
      security: [],
      parameters: [pathParam('uniqueShopId', 'Merchant unique shop identifier (e.g. "shivam")')],
      responses: okResponse('Storefront organization details'),
    },
  },
  '/organizations/pending-members': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'List pending user membership requests for current organization',
      responses: okResponse('Pending members list'),
    },
  },
  '/organizations/approve-member': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Approve a pending member and assign role & branch',
      requestBody: jsonBody({
        type: 'object',
        required: ['userId', 'roleId', 'branchId'],
        properties: {
          userId: { type: 'string', example: 'usr-65e123' },
          roleId: { type: 'string', example: 'role-65e456' },
          branchId: { type: 'string', example: 'br-65e789' },
        },
      }),
      responses: okResponse('Member approved and activated'),
    },
  },
  '/organizations/reject-member': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Reject a pending member join request',
      requestBody: jsonBody({
        type: 'object',
        required: ['userId'],
        properties: {
          userId: { type: 'string', example: 'usr-65e123' },
        },
      }),
      responses: okResponse('Member request rejected'),
    },
  },
  '/organizations/my-organization': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Get current tenant organization profile, settings, and team members',
      responses: okResponse('Current organization details with members list'),
    },
    patch: {
      tags: ['Organization & Branches'],
      summary: 'Update current tenant settings, metadata, and delivery options',
      description: 'Allows editing business settings, GST, logo, and platform delivery. Note: Only owner can modify uniqueShopId or gstNumber.',
      requestBody: jsonBody('UpdateOrganizationRequest'),
      responses: okResponse('Organization settings updated'),
    },
    delete: {
      tags: ['Organization & Branches'],
      summary: 'Delete current tenant organization (Owner only)',
      responses: okResponse('Organization deleted successfully'),
    },
  },
  '/organizations/{id}': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Get organization details by ID (Platform Admin / Cross-tenant)',
      parameters: [pathParam('id', 'Organization ID')],
      responses: okResponse('Organization details'),
    },
    patch: {
      tags: ['Organization & Branches'],
      summary: 'Update organization by ID (Platform Admin)',
      parameters: [pathParam('id', 'Organization ID')],
      requestBody: jsonBody('UpdateOrganizationRequest'),
      responses: okResponse('Organization updated'),
    },
    delete: {
      tags: ['Organization & Branches'],
      summary: 'Delete organization by ID (Platform Admin)',
      parameters: [pathParam('id', 'Organization ID')],
      responses: okResponse('Organization deleted'),
    },
  },

  // ==========================================
  // --- ORGANIZATION EXTRAS (/neworganization/*) ---
  // ==========================================
  '/neworganization/invite': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Invite new employee or manager to organization',
      requestBody: jsonBody({
        type: 'object',
        required: ['email', 'name', 'role'],
        properties: {
          email: { type: 'string', format: 'email', example: 'colleague@shivam.com' },
          name: { type: 'string', example: 'Rohan Sharma' },
          role: { type: 'string', example: 'staff' },
          phone: { type: 'string', example: '+919876543219' },
        },
      }),
      responses: createdResponse('Invitation sent and user record created'),
    },
  },
  '/neworganization/activity-log': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Retrieve organization activity audit log',
      responses: okResponse('Organization activity logs list'),
    },
  },
  '/neworganization/members/{id}': {
    delete: {
      tags: ['Organization & Branches'],
      summary: 'Remove member user from organization',
      parameters: [pathParam('id', 'Member User ID')],
      responses: okResponse('Member removed from organization'),
    },
  },

  // ==========================================
  // --- OWNERSHIP TRANSFER (/ownership/*) ---
  // ==========================================
  '/ownership/initiate': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Initiate ownership transfer to another member (Owner only)',
      description: 'Generates a secure single-use 24-hour transfer token and dispatches an acceptance email to the target user.',
      requestBody: jsonBody('InitiateOwnershipTransferRequest'),
      responses: okResponse('Ownership transfer initiated; approval email sent'),
    },
  },
  '/ownership/finalize': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Accept and finalize organization ownership transfer',
      description: 'The nominated member accepts ownership with the secure token. Automatically upgrades new owner to owner/superadmin and demotes previous owner to admin.',
      requestBody: jsonBody('FinalizeOwnershipTransferRequest'),
      responses: okResponse('Ownership transfer finalized successfully'),
    },
  },
  '/ownership/cancel': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Cancel active pending ownership transfer request',
      responses: okResponse('Transfer request cancelled'),
    },
  },
  '/ownership/force': {
    post: {
      tags: ['Organization & Branches'],
      summary: 'Force transfer ownership without email verification (Superadmin only)',
      requestBody: jsonBody({
        type: 'object',
        required: ['newOwnerId'],
        properties: {
          newOwnerId: { type: 'string', example: 'usr-65e456' },
        },
      }),
      responses: okResponse('Ownership force-transferred'),
    },
  },

  // ==========================================
  // --- BRANCHES (/branches/*) ---
  // ==========================================
  '/branches/my-branches': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'List branches belonging to current tenant organization',
      responses: okResponse('Branches list'),
    },
  },
  '/branches': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'List branches with pagination and search',
      parameters: [
        queryParam('search', 'Search branch name or code'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page limit', 'integer', 20),
        queryParam('isActive', 'Filter by active state', 'boolean'),
      ],
      responses: okResponse('Branches list with pagination metadata'),
    },
    post: {
      tags: ['Organization & Branches'],
      summary: 'Create a new business branch or warehouse',
      description: 'Creates a business branch. Only name is strictly required; branchCode auto-generates if not specified.',
      requestBody: jsonBody('CreateBranchRequest'),
      responses: createdResponse('Branch created successfully', 'BranchResponse'),
    },
  },
  '/branches/{id}': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Get branch details by ID',
      parameters: [pathParam('id', 'Branch ID')],
      responses: okResponse('Branch details', 'BranchResponse'),
    },
    patch: {
      tags: ['Organization & Branches'],
      summary: 'Update branch information',
      parameters: [pathParam('id', 'Branch ID')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Updated Warehouse Name' },
          branchCode: { type: 'string', example: 'WH-02' },
          address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string' },
            },
          },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          isMainBranch: { type: 'boolean' },
          isActive: { type: 'boolean' },
        },
      }),
      responses: okResponse('Branch updated', 'BranchResponse'),
    },
    delete: {
      tags: ['Organization & Branches'],
      summary: 'Delete or deactivate branch',
      parameters: [pathParam('id', 'Branch ID')],
      responses: okResponse('Branch removed'),
    },
  },
};
