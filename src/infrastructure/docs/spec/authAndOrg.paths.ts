import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const authAndOrgPaths: OpenApiPaths = {
  // --- AUTH ---
  '/auth/login': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Authenticate with email & password',
      description: 'Generates access and refresh tokens along with user session details.',
      security: [],
      requestBody: jsonBody('LoginRequest'),
      responses: {
        200: {
          description: 'Login successful',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
        },
        401: { description: 'Invalid credentials or account suspended' },
      },
    },
  },
  '/auth/register': {
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Register new tenant administrator',
      security: [],
      requestBody: jsonBody({
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          name: { type: 'string' },
          phone: { type: 'string' },
          organizationName: { type: 'string' },
        },
      }),
      responses: createdResponse('User registered successfully'),
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
          refreshToken: { type: 'string' },
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
      requestBody: jsonBody({
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      }),
      responses: okResponse('Password reset email dispatched'),
    },
  },
  '/auth/reset-password/{token}': {
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Reset password using valid reset token',
      security: [],
      parameters: [pathParam('token', 'Password reset opaque token')],
      requestBody: jsonBody({
        type: 'object',
        required: ['password'],
        properties: {
          password: { type: 'string', minLength: 8 },
        },
      }),
      responses: okResponse('Password successfully updated'),
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
      requestBody: jsonBody({
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 8 },
        },
      }),
      responses: okResponse('Password changed successfully'),
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

  // --- USERS ---
  '/users': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List users in the organization',
      parameters: [
        queryParam('search', 'Search by name or email'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size limit', 'integer', 20),
        queryParam('role', 'Filter by role ID'),
        queryParam('branchId', 'Filter by branch ID'),
      ],
      responses: okResponse('Paginated users list'),
    },
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Create and invite a new team member',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'email', 'role'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string' },
          phone: { type: 'string' },
          branchId: { type: 'string' },
        },
      }),
      responses: createdResponse('User invited'),
    },
  },
  '/users/me': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Retrieve user personal profile',
      responses: okResponse('User profile'),
    },
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Update user profile details',
      requestBody: jsonBody({
        type: 'object',
        properties: {
          name: { type: 'string' },
          phone: { type: 'string' },
        },
      }),
      responses: okResponse('Profile updated'),
    },
  },
  '/users/{id}': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get user profile by ID',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User details'),
    },
    patch: {
      tags: ['Authentication & Identity'],
      summary: 'Update user profile by ID',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User updated'),
    },
    delete: {
      tags: ['Authentication & Identity'],
      summary: 'Delete or deactivate user',
      parameters: [pathParam('id', 'User ID')],
      responses: okResponse('User deleted'),
    },
  },

  // --- ROLES & PERMISSIONS ---
  '/roles': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List defined security roles and permission sets',
      responses: okResponse('Roles list'),
    },
    post: {
      tags: ['Authentication & Identity'],
      summary: 'Create custom security role with granular permissions',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'permissions'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          permissions: { type: 'array', items: { type: 'string' } },
        },
      }),
      responses: createdResponse('Role created'),
    },
  },
  '/roles/permissions': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'Get dictionary of all available system permissions',
      responses: okResponse('Permission keys dictionary'),
    },
  },

  // --- SESSIONS ---
  '/sessions': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List all active multi-device sessions (Admin)',
      responses: okResponse('Active sessions list'),
    },
  },
  '/sessions/me': {
    get: {
      tags: ['Authentication & Identity'],
      summary: 'List current user active devices & IP sessions',
      responses: okResponse('Current user sessions'),
    },
  },
  '/sessions/{id}': {
    delete: {
      tags: ['Authentication & Identity'],
      summary: 'Terminate specific device session',
      parameters: [pathParam('id', 'Session ID')],
      responses: okResponse('Session revoked'),
    },
  },

  // --- ORGANIZATIONS & BRANCHES ---
  '/organizations': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'List accessible organizations',
      responses: okResponse('Organizations list'),
    },
    post: {
      tags: ['Organization & Branches'],
      summary: 'Create / register new organization tenant',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'slug'],
        properties: {
          name: { type: 'string' },
          slug: { type: 'string' },
          email: { type: 'string' },
          currency: { type: 'string', default: 'INR' },
        },
      }),
      responses: createdResponse('Organization created'),
    },
  },
  '/organizations/my-organization': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Get current tenant organization profile and settings',
      responses: okResponse('Current organization data'),
    },
    patch: {
      tags: ['Organization & Branches'],
      summary: 'Update current tenant settings & metadata',
      responses: okResponse('Settings updated'),
    },
  },
  '/organizations/shop/{uniqueShopId}': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Public lookup of organization by unique storefront shop ID',
      security: [],
      parameters: [pathParam('uniqueShopId', 'Merchant shop identifier')],
      responses: okResponse('Storefront organization details'),
    },
  },
  '/branches': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'List branches of current organization',
      responses: okResponse('Branches list'),
    },
    post: {
      tags: ['Organization & Branches'],
      summary: 'Create a new business branch / warehouse',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'branchCode'],
        properties: {
          name: { type: 'string' },
          branchCode: { type: 'string' },
          address: { type: 'string' },
          phone: { type: 'string' },
          isMainBranch: { type: 'boolean', default: false },
        },
      }),
      responses: createdResponse('Branch created'),
    },
  },
  '/branches/{id}': {
    get: {
      tags: ['Organization & Branches'],
      summary: 'Get branch details by ID',
      parameters: [pathParam('id', 'Branch ID')],
      responses: okResponse('Branch details'),
    },
    patch: {
      tags: ['Organization & Branches'],
      summary: 'Update branch information',
      parameters: [pathParam('id', 'Branch ID')],
      responses: okResponse('Branch updated'),
    },
    delete: {
      tags: ['Organization & Branches'],
      summary: 'Delete or deactivate branch',
      parameters: [pathParam('id', 'Branch ID')],
      responses: okResponse('Branch removed'),
    },
  },
};
