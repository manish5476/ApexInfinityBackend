import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const platformAndMasterPaths: OpenApiPaths = {
  // ── ADMIN PLATFORM & ANALYTICS ──
  '/admin/summary': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Executive platform revenue, order volume, and active tenants summary',
      responses: okResponse('Platform summary overview'),
    },
  },
  '/admin/monthly': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Monthly revenue & expense trend aggregates',
      responses: okResponse('Monthly trends data'),
    },
  },
  '/admin/outstanding': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Outstanding customer balances and aging report',
      responses: okResponse('Outstanding receivables report'),
    },
  },
  '/admin/top-customers': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Top revenue-generating customers across the organization',
      responses: okResponse('Top customers ranking'),
    },
  },
  '/admin/top-products': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Best-performing products by sales volume & margin',
      responses: okResponse('Top products report'),
    },
  },
  '/admin/branch-performance': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Comparative revenue and order volume per branch',
      responses: okResponse('Branch performance breakdown'),
    },
  },
  '/admin/platform/dashboard': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Platform-level operational status & tenant overview',
      responses: okResponse('Platform overview metrics'),
    },
  },
  '/admin/platform/analytics/realtime': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Live real-time socket connections and throughput rate',
      responses: okResponse('Real-time operational metrics'),
    },
  },
  '/admin/platform/reports': {
    post: {
      tags: ['Admin Platform'],
      summary: 'Generate custom platform operational or financial report',
      requestBody: jsonBody({
        type: 'object',
        required: ['reportType', 'startDate', 'endDate'],
        properties: {
          reportType: { type: 'string', enum: ['executive', 'tax_audit', 'activity', 'performance'] },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
        },
      }),
      responses: createdResponse('Report generation queued'),
    },
  },
  '/admin/platform/admins': {
    get: {
      tags: ['Admin Platform'],
      summary: 'List platform administrators',
      responses: okResponse('Administrators list'),
    },
    post: {
      tags: ['Admin Platform'],
      summary: 'Provision new platform administrator',
      requestBody: jsonBody({
        type: 'object',
        required: ['email', 'name', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          password: { type: 'string', minLength: 8 },
          role: { type: 'string', default: 'superadmin' },
        },
      }),
      responses: createdResponse('Administrator provisioned'),
    },
  },
  '/admin/platform/users': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Cross-tenant user directory with status filters',
      parameters: [
        queryParam('status', 'Filter: active, suspended, pending'),
        queryParam('search', 'Keyword search'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size', 'integer', 20),
      ],
      responses: okResponse('Platform users directory'),
    },
  },
  '/admin/platform/users/{userId}/status': {
    patch: {
      tags: ['Admin Platform'],
      summary: 'Update user account status',
      parameters: [pathParam('userId', 'User ID', 'string', 'usr-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['active', 'suspended', 'inactive'] } },
      }),
      responses: okResponse('User status updated'),
    },
  },
  '/admin/platform/users/{userId}/block': {
    post: {
      tags: ['Admin Platform'],
      summary: 'Block user from platform access',
      parameters: [pathParam('userId', 'User ID', 'string', 'usr-001')],
      responses: okResponse('User blocked'),
    },
  },
  '/admin/platform/users/{userId}/unblock': {
    post: {
      tags: ['Admin Platform'],
      summary: 'Unblock user access',
      parameters: [pathParam('userId', 'User ID', 'string', 'usr-001')],
      responses: okResponse('User unblocked'),
    },
  },
  '/admin/platform/users/{userId}/roles': {
    post: {
      tags: ['Admin Platform'],
      summary: 'Assign system roles to user',
      parameters: [pathParam('userId', 'User ID', 'string', 'usr-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['roles'],
        properties: { roles: { type: 'array', items: { type: 'string' } } },
      }),
      responses: okResponse('Roles assigned'),
    },
  },
  '/admin/platform/users/{userId}/sessions': {
    get: {
      tags: ['Admin Platform'],
      summary: 'View active login sessions for user',
      parameters: [pathParam('userId', 'User ID', 'string', 'usr-001')],
      responses: okResponse('Active user sessions'),
    },
    delete: {
      tags: ['Admin Platform'],
      summary: 'Terminate all active user sessions across devices',
      parameters: [pathParam('userId', 'User ID', 'string', 'usr-001')],
      responses: okResponse('User sessions terminated'),
    },
  },
  '/admin/platform/users/{userId}/impersonate': {
    post: {
      tags: ['Admin Platform'],
      summary: 'Issue temporary tenant impersonation session for support',
      parameters: [pathParam('userId', 'User ID', 'string', 'usr-001')],
      responses: okResponse('Impersonation token generated'),
    },
  },
  '/admin/platform/roles': {
    get: {
      tags: ['Admin Platform'],
      summary: 'List system role definitions',
      responses: okResponse('System roles list'),
    },
  },
  '/admin/platform/permissions': {
    get: {
      tags: ['Admin Platform'],
      summary: 'List all granular security permission nodes',
      responses: okResponse('Permission nodes list'),
    },
  },
  '/admin/platform/settings': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Platform-level configuration settings',
      responses: okResponse('Platform settings'),
    },
    post: {
      tags: ['Admin Platform'],
      summary: 'Upsert platform configuration settings',
      requestBody: jsonBody({
        type: 'object',
        required: ['key', 'value'],
        properties: { key: { type: 'string' }, value: { type: 'object' } },
      }),
      responses: okResponse('Setting saved'),
    },
  },
  '/admin/platform/feature-flags': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Dynamic feature flags status',
      responses: okResponse('Feature flags dictionary'),
    },
    post: {
      tags: ['Admin Platform'],
      summary: 'Toggle or configure feature flags',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'enabled'],
        properties: { name: { type: 'string' }, enabled: { type: 'boolean' } },
      }),
      responses: okResponse('Feature flag updated'),
    },
  },
  '/admin/platform/security/suspicious-activity': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Security incident and suspicious login log',
      responses: okResponse('Security logs'),
    },
  },
  '/admin/platform/audit': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Cross-tenant audit log trail',
      parameters: [
        queryParam('action', 'Filter by action code'),
        queryParam('limit', 'Max results', 'integer', 100),
      ],
      responses: okResponse('Audit log trail'),
    },
  },
  '/admin/platform/developer/database-inspector': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Inspect collection document counts and database indexes',
      responses: okResponse('Database collections report'),
    },
  },
  '/admin/platform/developer/cache/clear': {
    post: {
      tags: ['Admin Platform'],
      summary: 'Flush application cache (Redis/Memory)',
      responses: okResponse('Cache cleared'),
    },
  },
  '/admin/platform/developer/logs': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Live tail application log buffer',
      responses: okResponse('Recent log buffer entries'),
    },
  },
  '/admin/platform/developer/api-tester': {
    post: {
      tags: ['Admin Platform'],
      summary: 'Test internal API routing latency and response payload',
      requestBody: jsonBody({
        type: 'object',
        required: ['endpoint', 'method'],
        properties: {
          endpoint: { type: 'string', example: '/api/v1/health' },
          method: { type: 'string', example: 'GET' },
          payload: { type: 'object' },
        },
      }),
      responses: okResponse('API test results'),
    },
  },
  '/admin/platform/developer/queues': {
    get: {
      tags: ['Admin Platform'],
      summary: 'Monitor background asynchronous queues and workers',
      responses: okResponse('Queue metrics and jobs status'),
    },
  },

  // ── WEBHOOKS ──
  '/webhooks': {
    get: {
      tags: ['Webhooks'],
      summary: 'List subscribed outgoing webhooks',
      responses: okResponse('Webhooks list'),
    },
    post: {
      tags: ['Webhooks'],
      summary: 'Register outgoing webhook listener',
      requestBody: jsonBody({
        type: 'object',
        required: ['url', 'events'],
        properties: {
          url: { type: 'string', format: 'uri', example: 'https://api.thirdparty.com/webhook' },
          events: { type: 'array', items: { type: 'string' }, example: ['invoice.created', 'payment.received'] },
          secret: { type: 'string', example: 'whsec_ApexSecretKey123' },
          description: { type: 'string', example: 'ERP synchronization hook' },
        },
      }),
      responses: createdResponse('Webhook registered'),
    },
  },
  '/webhooks/test-trigger': {
    post: {
      tags: ['Webhooks'],
      summary: 'Trigger test webhook delivery event',
      requestBody: jsonBody({
        type: 'object',
        required: ['event'],
        properties: {
          event: { type: 'string', example: 'ping.test' },
          payload: { type: 'object', example: { ping: 'pong', timestamp: '2026-09-13T11:00:00Z' } },
        },
      }),
      responses: okResponse('Test webhook triggered'),
    },
  },
  '/webhooks/stats': {
    get: {
      tags: ['Webhooks'],
      summary: 'Webhook delivery performance statistics',
      responses: okResponse('Webhook stats overview'),
    },
  },
  '/webhooks/deliveries': {
    get: {
      tags: ['Webhooks'],
      summary: 'Audit log of webhook delivery attempts',
      parameters: [
        queryParam('status', 'Filter by delivery status: success, failed, retrying'),
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 20),
      ],
      responses: okResponse('Webhook deliveries list'),
    },
  },
  '/webhooks/deliveries/{deliveryId}/replay': {
    post: {
      tags: ['Webhooks'],
      summary: 'Replay a previously failed webhook event delivery',
      parameters: [pathParam('deliveryId', 'Delivery ID', 'string', 'del-901')],
      responses: okResponse('Delivery replayed'),
    },
  },
  '/webhooks/{id}': {
    get: {
      tags: ['Webhooks'],
      summary: 'Get webhook subscription details by ID',
      parameters: [pathParam('id', 'Webhook ID', 'string', 'wh-001')],
      responses: okResponse('Webhook details'),
    },
    patch: {
      tags: ['Webhooks'],
      summary: 'Update webhook configuration or subscribed events',
      parameters: [pathParam('id', 'Webhook ID', 'string', 'wh-001')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          url: { type: 'string', format: 'uri' },
          events: { type: 'array', items: { type: 'string' } },
          isActive: { type: 'boolean' },
        },
      }),
      responses: okResponse('Webhook updated'),
    },
    put: {
      tags: ['Webhooks'],
      summary: 'Replace webhook configuration',
      parameters: [pathParam('id', 'Webhook ID', 'string', 'wh-001')],
      responses: okResponse('Webhook replaced'),
    },
    delete: {
      tags: ['Webhooks'],
      summary: 'Deregister and delete webhook subscription',
      parameters: [pathParam('id', 'Webhook ID', 'string', 'wh-001')],
      responses: okResponse('Webhook deleted'),
    },
  },
  '/webhooks/{id}/test': {
    post: {
      tags: ['Webhooks'],
      summary: 'Send test ping payload to a specific webhook endpoint',
      parameters: [pathParam('id', 'Webhook ID', 'string', 'wh-001')],
      responses: okResponse('Ping test executed'),
    },
  },

  // ── NOTIFICATIONS & ANNOUNCEMENTS ──
  '/notifications': {
    get: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Get active user notification feed',
      parameters: [
        queryParam('unreadOnly', 'Only return unread notifications', 'boolean', false),
        queryParam('limit', 'Max records', 'integer', 30),
      ],
      responses: okResponse('Notifications feed'),
    },
    post: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Dispatch notification to user or broadcast to organization',
      requestBody: jsonBody({
        type: 'object',
        required: ['title', 'message'],
        properties: {
          title: { type: 'string', example: 'Low Stock Alert' },
          message: { type: 'string', example: 'Product SKU-109 is below reorder threshold.' },
          type: { type: 'string', enum: ['info', 'warning', 'error', 'success'], default: 'info' },
          recipientUserId: { type: 'string', description: 'Omit to broadcast to entire org' },
        },
      }),
      responses: createdResponse('Notification dispatched'),
    },
  },
  '/notifications/mark-all-read': {
    patch: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Mark all notifications as read for current user',
      responses: okResponse('Notifications marked as read'),
    },
  },
  '/notifications/{id}/read': {
    patch: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Mark single notification as read',
      parameters: [pathParam('id', 'Notification ID', 'string', 'notif-001')],
      responses: okResponse('Notification marked as read'),
    },
  },
  '/notifications/{id}': {
    delete: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Dismiss / delete single notification',
      parameters: [pathParam('id', 'Notification ID', 'string', 'notif-001')],
      responses: okResponse('Notification dismissed'),
    },
  },
  '/announcements': {
    get: {
      tags: ['Notifications & Broadcasts'],
      summary: 'List organization announcements and broadcast bulletins',
      responses: okResponse('Announcements list'),
    },
    post: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Publish new company-wide announcement banner',
      requestBody: jsonBody({
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', example: 'Scheduled Maintenance Notice' },
          content: { type: 'string', example: 'System upgrades scheduled for Sunday 2 AM to 4 AM.' },
          priority: { type: 'string', enum: ['normal', 'urgent'], default: 'normal' },
        },
      }),
      responses: createdResponse('Announcement published'),
    },
  },
  '/announcements/{id}': {
    get: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Get announcement details',
      parameters: [pathParam('id', 'Announcement ID', 'string', 'ann-001')],
      responses: okResponse('Announcement details'),
    },
    delete: {
      tags: ['Notifications & Broadcasts'],
      summary: 'Remove announcement',
      parameters: [pathParam('id', 'Announcement ID', 'string', 'ann-001')],
      responses: okResponse('Announcement removed'),
    },
  },

  // ── MASTER DATA & DROPDOWNS ──
  '/dropdowns/users': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Fast user key-value dropdown items',
      parameters: [queryParam('search', 'Search query string')],
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/branches': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Fast branch key-value dropdown items',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/roles': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Fast role key-value dropdown items',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/customers': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Fast customer dropdown with outstanding balance',
      parameters: [queryParam('search', 'Search name or phone')],
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/suppliers': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Fast supplier dropdown with company name',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/masters': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Generic master records dropdown by type',
      parameters: [
        queryParam('type', 'Master type (e.g. category, brand, unit, department)', 'string', 'category'),
        queryParam('parentId', 'Optional parent entity ID for hierarchical cascading'),
      ],
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/channels': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Sales & distribution channels dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/transfer-requests': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Stock transfer requests dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/products': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Product dropdown with SKU, pricing, and available stock',
      parameters: [queryParam('search', 'Search product name or SKU')],
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/purchases': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Purchase orders / bills dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/sales': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Sales invoices dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/sales-returns': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Sales return notes dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/purchase-returns': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Purchase return notes dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/master-departments': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Departments master dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/brands': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Product brands dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/categories': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Product categories dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/subcategories': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Product sub-categories dropdown',
      parameters: [queryParam('parentId', 'Parent category ID')],
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/units': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Measurement units dropdown (PCS, KG, LTR, BOX, SET)',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/tax-rates': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'GST / Tax slabs dropdown (0%, 5%, 12%, 18%, 28%)',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/warranty-plans': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Product warranty plans dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/product-conditions': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Product conditions dropdown (New, Refurbished, Used)',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/tags': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'System tags dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/supplier-categories': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Supplier categories dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/accounts': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'General ledger chart of accounts dropdown',
      parameters: [queryParam('type', 'Filter: Asset, Liability, Equity, Revenue, Expense')],
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/invoices': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Sales invoices dropdown with payment status',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/payments': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Customer and supplier payments dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/emis': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'EMI loan accounts dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/departments': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'HRMS departments dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/designations': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'HRMS job designations dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/shifts': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Attendance work shifts dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/shift-assignments': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Employee shift assignments dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/holidays': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Company holiday calendar dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/geofencing': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'GPS geofencing perimeters dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/attendance-machines': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Biometric fingerprint/face machines dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/attendance-requests': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Attendance regularization requests dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/leave-requests': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Employee leave requests dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/dropdowns/meetings': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Team meetings dropdown',
      responses: okResponse('Dropdown items list'),
    },
  },
  '/master': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'List master records with type filter and search',
      parameters: [
        queryParam('type', 'Filter by master type: brand, category, unit, tax_rate, department', 'string', 'brand'),
        queryParam('search', 'Keyword search'),
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 20),
      ],
      responses: okResponse('Master records list'),
    },
    post: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Create a new master data entry',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string', example: 'Logitech' },
          code: { type: 'string', example: 'LOGI' },
          type: { type: 'string', example: 'brand' },
          description: { type: 'string', example: 'Computer peripherals manufacturer' },
          parentId: { type: 'string' },
        },
      }),
      responses: createdResponse('Master data record created'),
    },
  },
  '/master/{id}': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Get master record by ID',
      parameters: [pathParam('id', 'Master ID', 'string', 'mst-001')],
      responses: okResponse('Master record details'),
    },
    put: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Update master record',
      parameters: [pathParam('id', 'Master ID', 'string', 'mst-001')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          name: { type: 'string' },
          code: { type: 'string' },
          description: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      }),
      responses: okResponse('Master record updated'),
    },
    delete: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Delete master record',
      parameters: [pathParam('id', 'Master ID', 'string', 'mst-001')],
      responses: okResponse('Master record deleted'),
    },
  },
  '/master-list': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'Aggregated list of all master configurations',
      responses: okResponse('All master categories and items'),
    },
  },
  '/master-types': {
    get: {
      tags: ['Master Data & Dropdowns'],
      summary: 'List supported master entity types',
      responses: okResponse('Supported master types list'),
    },
  },
};
