import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { authAndOrgPaths } from './spec/authAndOrg.paths';
import { crmAndInventoryPaths } from './spec/crmAndInventory.paths';
import { accountingAndFinancePaths } from './spec/accountingAndFinance.paths';
import { hrmsPaths } from './spec/hrms.paths';
import { storefrontAndLogisticsPaths } from './spec/storefrontAndLogistics.paths';
import { intelligenceAndOpsPaths } from './spec/intelligenceAndOps.paths';
import { fieldServiceAndMediaPaths } from './spec/fieldServiceAndMedia.paths';
import { platformAndMasterPaths } from './spec/platformAndMaster.paths';
import { collaborationAndWorkspacePaths } from './spec/collaborationAndWorkspace.paths';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Apex Infinity — Enterprise Modular Monolith API',
    version: '1.0.0',
    description: `
# Apex Infinity Enterprise API Documentation

Welcome to the **Apex Infinity** Modular Monolith Platform API Documentation.

### Architecture Highlights:
- **Clean Architecture & Domain-Driven Design**: Explicit Application Use Cases → Pure Domain Entities → Concrete Mongoose Repositories.
- **Strict Multi-Tenant Isolation**: Every database query is tenant-scoped via validated JWT claim or \`x-organization-id\`.
- **Real Business Truth**: All metrics and reports are live MongoDB aggregations with 0% mock data.
- **Real-Time WebSockets**: Full Socket.IO server mounted on the same HTTP runtime for live chat, presence, and alerts.

---

### How to Authenticate in Swagger UI:
1. Navigate to **Authentication & Identity** → \`POST /auth/login\`.
2. Click **Try it out** and enter credentials (e.g. email and password).
3. Copy the returned \`token\` value from the JSON response body.
4. Scroll to the top right of this page and click the **Authorize 🔓** button.
5. Enter: \`Bearer <your_token>\` and click **Authorize**.
6. All authenticated endpoints will automatically send your token with zero manual header typing.
    `,
    contact: {
      name: 'Apex Platform Engineering',
      email: 'support@apexinfinity.io',
      url: 'https://apexinfinity.io',
    },
    license: {
      name: 'Proprietary - Apex Infinity Commercial Edition',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current API v1 Base Path',
    },
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server (Port 5000 — Default Frontend Target)',
    },
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Secondary Development Server (Port 4000)',
    },
  ],
  tags: [
    { name: 'Authentication & Identity', description: 'User login, registration, JWT refresh, multi-device sessions, and security roles' },
    { name: 'Organization & Branches', description: 'Multi-tenant organization registration, metadata settings, and branch isolation' },
    { name: 'CRM & Customers', description: 'Customer profiles, credit limits, outstanding balances, and supplier directories' },
    { name: 'Inventory & Products', description: 'Catalog items, multi-branch stock levels, barcode scanning, purchases, and sales' },
    { name: 'Accounting & Invoicing', description: 'GST invoices, PDF generation, customer receipts, Chart of Accounts, ledgers, EMI, and reconciliation' },
    { name: 'Storefront (Public & Admin)', description: 'Customer-facing store catalog, checkout, orders, CMS pages, and builder themes' },
    { name: 'Delivery & Logistics', description: 'Last-mile delivery agent dispatch, package tracking, and shipment manifests' },
    { name: 'HRMS Suite', description: 'Employee master 360, departments, designations, company assets, and documents' },
    { name: 'HRMS - Attendance', description: 'Real-time biometric punch, daily logs, hardware machines, and GPS geofences' },
    { name: 'HRMS - Leaves', description: 'Leave application workflows, manager approvals, and quota balances' },
    { name: 'HRMS - Payroll', description: 'Monthly payroll calculation runs, employee payslips, and salary structures' },
    { name: 'Team Chat', description: 'Internal team communication channels, direct messaging, and media uploads' },
    { name: 'AI Agent & Intelligence', description: 'Natural language CRM business intelligence with live database tool execution' },
    { name: 'Analytics & BI', description: 'Executive revenue dashboard, profit analysis, stock health, and dead-stock predictions' },
    { name: 'Collaboration & Workspace', description: 'Notes, task boards, team meeting scheduling, and knowledge templates' },
    { name: 'Field Service', description: 'Work assignments, technician dispatch tickets, and SLA monitoring' },
    { name: 'Media & Assets', description: 'Cloudinary storage, file uploads, asset tagging, and CDN management' },
    { name: 'Notifications & Broadcasts', description: 'User notification feeds, unread badges, and organization broadcasts' },
    { name: 'Webhooks', description: 'Webhook subscription endpoints, event deliveries, and replay audits' },
    { name: 'Master Data & Dropdowns', description: 'High-speed key-value lookup dropdowns for forms and filters' },
    { name: 'Global Search', description: 'Instant multi-entity search across customers, products, and invoices' },
    { name: 'Admin Platform', description: 'Superadmin controls, tenant overview, cache flush, and database inspector' },
    { name: 'System Operations', description: 'Background cron job monitors, application log streaming, and system dashboards' },
    { name: 'Health & Diagnostics', description: 'Liveness probes, MongoDB socket status, and cache diagnostics' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token as: Bearer <token>',
      },
      TenantId: {
        type: 'apiKey',
        in: 'header',
        name: 'x-organization-id',
        description: 'Optional explicit organization tenant ID header',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { type: 'string', example: 'Operation completed successfully' },
          data: { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
              message: { type: 'string', example: 'The requested record does not exist' },
              details: { type: 'object' },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          total: { type: 'number', example: 120 },
          page: { type: 'number', example: 1 },
          limit: { type: 'number', example: 20 },
          totalPages: { type: 'number', example: 6 },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password', 'uniqueShopId'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@shivam.com',
            description: 'User registered email address (or phone number)',
          },
          password: {
            type: 'string',
            format: 'password',
            example: 'SuperSecurePassword123!',
            description: 'User account password',
          },
          uniqueShopId: {
            type: 'string',
            example: 'shivam',
            description: 'Your unique Shop ID or shop name (e.g. "shivam"). Required for every user to authenticate into their specific organization workspace.',
          },
          organizationSlug: {
            type: 'string',
            example: 'shivam',
            description: 'Organization slug (alias for uniqueShopId, e.g. "shivam")',
          },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refreshToken: { type: 'string', example: 'd3b07384d113edec49eaa6238ad5ff00...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'usr-001' },
              email: { type: 'string', example: 'admin@apex.local' },
              name: { type: 'string', example: 'System Administrator' },
              role: { type: 'string', example: 'admin' },
              organizationId: { type: 'string', example: 'org-main' },
            },
          },
        },
      },
      CreateProductRequest: {
        type: 'object',
        required: ['name', 'sellingPrice', 'category'],
        properties: {
          name: { type: 'string', example: 'Wireless Bluetooth Mouse' },
          sku: { type: 'string', example: 'MSE-WL-001' },
          category: { type: 'string', example: 'Electronics' },
          brand: { type: 'string', example: 'Logitech' },
          sellingPrice: { type: 'number', example: 799 },
          purchasePrice: { type: 'number', example: 450 },
          taxRate: { type: 'number', example: 18 },
          initialStock: { type: 'number', example: 50 },
        },
      },
      ProductResponse: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'prod-65e123456789' },
          name: { type: 'string', example: 'Wireless Bluetooth Mouse' },
          sku: { type: 'string', example: 'MSE-WL-001' },
          sellingPrice: { type: 'number', example: 799 },
          totalStock: { type: 'number', example: 50 },
          isActive: { type: 'boolean', example: true },
        },
      },
      CreateInvoiceRequest: {
        type: 'object',
        required: ['customerId', 'items'],
        properties: {
          customerId: { type: 'string', example: 'cust-65e123' },
          invoiceDate: { type: 'string', format: 'date' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productId: { type: 'string' },
                quantity: { type: 'number', example: 2 },
                unitPrice: { type: 'number', example: 799 },
                taxRate: { type: 'number', example: 18 },
              },
            },
          },
          notes: { type: 'string', example: 'Payment due upon receipt.' },
        },
      },
      InvoiceResponse: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'inv-65e987' },
          invoiceNumber: { type: 'string', example: 'INV-2026-0001' },
          grandTotal: { type: 'number', example: 1885.64 },
          paymentStatus: { type: 'string', example: 'unpaid' },
        },
      },
      AiChatPromptRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            example: 'What is our total revenue this month and how many invoices are unpaid?',
          },
        },
      },
      AiChatPromptResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          reply: {
            type: 'string',
            example: 'Apex AI Intelligence: Total revenue is ₹2,45,000 across 28 invoices. Currently 4 invoices are unpaid totaling ₹32,000.',
          },
          toolsUsed: {
            type: 'array',
            items: { type: 'string' },
            example: ['SalesAnalyticsTool', 'CustomerBalanceTool'],
          },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ChatMessagePayload: {
        type: 'object',
        required: ['channelId', 'body'],
        properties: {
          channelId: { type: 'string', example: 'chan-001' },
          body: { type: 'string', example: 'Team, please review the latest inventory shipment reports.' },
          attachments: { type: 'array', items: { type: 'object' } },
        },
      },
      AnalyticsDashboardOverview: {
        type: 'object',
        properties: {
          totalRevenue: { type: 'number', example: 450000 },
          netProfit: { type: 'number', example: 125000 },
          totalOrders: { type: 'number', example: 142 },
          activeCustomers: { type: 'number', example: 89 },
          inventoryValuation: { type: 'number', example: 380000 },
          totalReceivables: { type: 'number', example: 42000 },
          lastUpdated: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
      TenantId: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health & Diagnostics'],
        summary: 'System health check and database connection status',
        security: [],
        responses: {
          200: {
            description: 'System is healthy and database is connected.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptimeSeconds: { type: 'number', example: 3600 },
                  },
                },
              },
            },
          },
        },
      },
    },
    ...authAndOrgPaths,
    ...crmAndInventoryPaths,
    ...accountingAndFinancePaths,
    ...hrmsPaths,
    ...storefrontAndLogisticsPaths,
    ...intelligenceAndOpsPaths,
    ...fieldServiceAndMediaPaths,
    ...platformAndMasterPaths,
    ...collaborationAndWorkspacePaths,
  },
};

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'Apex Infinity — Enterprise API Documentation',
  customCss: `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    :root {
      --apex-font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --apex-mono: 'JetBrains Mono', monospace;
      --apex-primary: #3b82f6;
      --apex-primary-dark: #1d4ed8;
      --apex-emerald: #10b981;
      --apex-amber: #f59e0b;
      --apex-purple: #8b5cf6;
      --apex-rose: #f43f5e;
    }

    body {
      font-family: var(--apex-font) !important;
      background: #0b0f19 !important;
      color: #e2e8f0 !important;
      margin: 0;
      padding: 0;
    }

    /* Topbar Header */
    .swagger-ui .topbar {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%) !important;
      border-bottom: 2px solid #3b82f6 !important;
      padding: 16px 0 !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
    }
    .swagger-ui .topbar .topbar-wrapper {
      max-width: 1400px !important;
      margin: 0 auto !important;
      padding: 0 24px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
    }
    .swagger-ui .topbar a {
      display: flex !important;
      align-items: center !important;
      text-decoration: none !important;
    }
    .swagger-ui .topbar .link span {
      font-size: 1.35rem !important;
      font-weight: 800 !important;
      color: #ffffff !important;
      letter-spacing: -0.03em !important;
    }
    .swagger-ui .topbar .link::after {
      content: "ENTERPRISE MONOLITH V1.0";
      font-size: 0.65rem !important;
      font-weight: 700 !important;
      letter-spacing: 0.08em !important;
      background: #3b82f6 !important;
      color: #ffffff !important;
      padding: 4px 10px !important;
      border-radius: 9999px !important;
      margin-left: 14px !important;
      display: inline-block !important;
    }

    /* Main Container & Information */
    .swagger-ui .wrapper {
      max-width: 1400px !important;
      margin: 0 auto !important;
      padding: 24px !important;
    }
    .swagger-ui .info {
      margin: 20px 0 30px 0 !important;
      background: #111827 !important;
      border: 1px solid #1f2937 !important;
      border-radius: 12px !important;
      padding: 24px 32px !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
    }
    .swagger-ui .info .title {
      font-size: 2.2rem !important;
      font-weight: 800 !important;
      color: #f8fafc !important;
      letter-spacing: -0.03em !important;
      margin-bottom: 8px !important;
    }
    .swagger-ui .info p, .swagger-ui .info li {
      color: #94a3b8 !important;
      font-size: 0.95rem !important;
      line-height: 1.6 !important;
    }
    .swagger-ui .info h1, .swagger-ui .info h2, .swagger-ui .info h3 {
      color: #f1f5f9 !important;
    }
    .swagger-ui .info code {
      background: #1e293b !important;
      color: #38bdf8 !important;
      padding: 2px 6px !important;
      border-radius: 4px !important;
      font-family: var(--apex-mono) !important;
    }

    /* Servers bar & Authorize button */
    .swagger-ui .scheme-container {
      background: #111827 !important;
      border: 1px solid #1f2937 !important;
      border-radius: 12px !important;
      padding: 16px 24px !important;
      margin-bottom: 24px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
    }
    .swagger-ui .scheme-container label {
      color: #94a3b8 !important;
      font-weight: 600 !important;
    }
    .swagger-ui .scheme-container select {
      background: #1f2937 !important;
      color: #f8fafc !important;
      border: 1px solid #374151 !important;
      border-radius: 8px !important;
      padding: 8px 14px !important;
      font-weight: 500 !important;
    }
    .swagger-ui .btn.authorize {
      background: #10b981 !important;
      border-color: #10b981 !important;
      color: #ffffff !important;
      border-radius: 8px !important;
      padding: 8px 20px !important;
      font-weight: 700 !important;
      box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3) !important;
      transition: all 0.2s ease !important;
    }
    .swagger-ui .btn.authorize:hover {
      background: #059669 !important;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.45) !important;
    }
    .swagger-ui .btn.authorize svg {
      fill: #ffffff !important;
    }

    /* Search Filter Input */
    .swagger-ui .filter {
      margin-bottom: 24px !important;
      padding: 0 !important;
    }
    .swagger-ui .filter .operation-filter-input {
      width: 100% !important;
      max-width: 100% !important;
      background: #111827 !important;
      border: 1.5px solid #374151 !important;
      color: #f8fafc !important;
      border-radius: 10px !important;
      padding: 12px 18px !important;
      font-size: 1rem !important;
      font-family: var(--apex-font) !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;
      transition: border-color 0.2s, box-shadow 0.2s !important;
    }
    .swagger-ui .filter .operation-filter-input:focus {
      border-color: #3b82f6 !important;
      outline: none !important;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
    }

    /* Tag Section Accordions */
    .swagger-ui .opblock-tag-section {
      background: #111827 !important;
      border: 1px solid #1f2937 !important;
      border-radius: 12px !important;
      margin-bottom: 16px !important;
      overflow: hidden !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .swagger-ui .opblock-tag {
      font-family: var(--apex-font) !important;
      font-size: 1.2rem !important;
      font-weight: 700 !important;
      color: #f8fafc !important;
      padding: 16px 20px !important;
      border-bottom: 1px solid transparent !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      transition: background 0.2s !important;
    }
    .swagger-ui .opblock-tag:hover {
      background: #1f2937 !important;
    }
    .swagger-ui .opblock-tag small {
      color: #94a3b8 !important;
      font-size: 0.85rem !important;
      font-weight: 400 !important;
      margin-left: 12px !important;
    }
    .swagger-ui .opblock-tag svg {
      fill: #94a3b8 !important;
    }

    /* Operation Blocks */
    .swagger-ui .opblock {
      background: #0f172a !important;
      border-radius: 8px !important;
      margin: 8px 16px 12px 16px !important;
      border: 1px solid #1e293b !important;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2) !important;
      transition: transform 0.15s ease, border-color 0.15s ease !important;
    }
    .swagger-ui .opblock:hover {
      border-color: #334155 !important;
    }
    .swagger-ui .opblock .opblock-summary {
      padding: 10px 14px !important;
      align-items: center !important;
    }
    .swagger-ui .opblock .opblock-summary-method {
      border-radius: 6px !important;
      font-family: var(--apex-mono) !important;
      font-size: 0.85rem !important;
      font-weight: 700 !important;
      min-width: 75px !important;
      text-align: center !important;
      padding: 6px 0 !important;
    }
    .swagger-ui .opblock .opblock-summary-path {
      font-family: var(--apex-mono) !important;
      font-size: 0.95rem !important;
      font-weight: 600 !important;
      color: #f1f5f9 !important;
      margin-left: 14px !important;
    }
    .swagger-ui .opblock .opblock-summary-description {
      font-size: 0.88rem !important;
      color: #94a3b8 !important;
      margin-left: auto !important;
      padding-right: 12px !important;
    }

    /* Method specific color schemes */
    /* GET */
    .swagger-ui .opblock.opblock-get {
      border-color: rgba(16, 185, 129, 0.3) !important;
      background: rgba(16, 185, 129, 0.04) !important;
    }
    .swagger-ui .opblock.opblock-get .opblock-summary-method {
      background: #059669 !important;
      color: #ffffff !important;
    }
    /* POST */
    .swagger-ui .opblock.opblock-post {
      border-color: rgba(59, 130, 246, 0.3) !important;
      background: rgba(59, 130, 246, 0.04) !important;
    }
    .swagger-ui .opblock.opblock-post .opblock-summary-method {
      background: #2563eb !important;
      color: #ffffff !important;
    }
    /* PUT */
    .swagger-ui .opblock.opblock-put {
      border-color: rgba(245, 158, 11, 0.3) !important;
      background: rgba(245, 158, 11, 0.04) !important;
    }
    .swagger-ui .opblock.opblock-put .opblock-summary-method {
      background: #d97706 !important;
      color: #ffffff !important;
    }
    /* PATCH */
    .swagger-ui .opblock.opblock-patch {
      border-color: rgba(139, 92, 246, 0.3) !important;
      background: rgba(139, 92, 246, 0.04) !important;
    }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method {
      background: #7c3aed !important;
      color: #ffffff !important;
    }
    /* DELETE */
    .swagger-ui .opblock.opblock-delete {
      border-color: rgba(244, 63, 94, 0.3) !important;
      background: rgba(244, 63, 94, 0.04) !important;
    }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method {
      background: #e11d48 !important;
      color: #ffffff !important;
    }

    /* Operation Details Content (expanded) */
    .swagger-ui .opblock-body {
      background: #0b0f19 !important;
      border-top: 1px solid #1e293b !important;
      padding: 16px 20px !important;
    }
    .swagger-ui .opblock-body pre {
      background: #020617 !important;
      border: 1px solid #1e293b !important;
      border-radius: 8px !important;
      color: #38bdf8 !important;
      font-family: var(--apex-mono) !important;
    }
    .swagger-ui .opblock-section-header {
      background: #111827 !important;
      color: #e2e8f0 !important;
      border-radius: 6px !important;
      padding: 8px 14px !important;
    }
    .swagger-ui .opblock-section-header h4 {
      color: #f8fafc !important;
      font-weight: 700 !important;
    }
    .swagger-ui table thead tr th {
      color: #94a3b8 !important;
      border-bottom: 1px solid #1e293b !important;
    }
    .swagger-ui table tbody tr td {
      color: #cbd5e1 !important;
      border-bottom: 1px solid #1e293b !important;
    }
    .swagger-ui .parameter__name {
      color: #f8fafc !important;
      font-weight: 600 !important;
      font-family: var(--apex-mono) !important;
    }
    .swagger-ui .parameter__type {
      color: #a78bfa !important;
      font-family: var(--apex-mono) !important;
    }
    .swagger-ui input[type="text"] {
      background: #1e293b !important;
      border: 1px solid #334155 !important;
      color: #f8fafc !important;
      border-radius: 6px !important;
      padding: 8px 12px !important;
    }
    .swagger-ui .btn.execute {
      background: #3b82f6 !important;
      border-color: #3b82f6 !important;
      color: #ffffff !important;
      border-radius: 8px !important;
      font-weight: 700 !important;
      padding: 10px 24px !important;
    }
    .swagger-ui .btn.execute:hover {
      background: #2563eb !important;
    }
    .swagger-ui .btn.try-out__btn {
      border: 1px solid #3b82f6 !important;
      color: #3b82f6 !important;
      border-radius: 6px !important;
      font-weight: 600 !important;
    }
    .swagger-ui .btn.try-out__btn:hover {
      background: #1e3a8a !important;
      color: #ffffff !important;
    }

    /* Models / Schemas Footer Section */
    .swagger-ui section.models {
      background: #111827 !important;
      border: 1px solid #1f2937 !important;
      border-radius: 12px !important;
      margin-top: 32px !important;
      overflow: hidden !important;
    }
    .swagger-ui section.models h4 {
      color: #f8fafc !important;
      font-weight: 700 !important;
      padding: 16px 20px !important;
      border-bottom: 1px solid #1f2937 !important;
    }
    .swagger-ui section.models .model-container {
      background: #0f172a !important;
      margin: 8px 16px !important;
      border-radius: 8px !important;
      border: 1px solid #1e293b !important;
    }
    .swagger-ui .model-title {
      color: #f1f5f9 !important;
      font-family: var(--apex-mono) !important;
    }
    .swagger-ui .model {
      color: #94a3b8 !important;
      font-family: var(--apex-mono) !important;
    }
    .swagger-ui .prop-type {
      color: #38bdf8 !important;
    }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    tryItOutEnabled: true,
  },
};

export function setupSwagger(app: Application): void {
  // 1. Raw OpenAPI 3.0 JSON specification endpoints
  app.get('/api/docs/json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // 2. Interactive Swagger UI
  app.use(
    '/api/docs',
    swaggerUi.serveFiles(swaggerSpec, swaggerUiOptions),
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  );

  // 3. Convenience redirects
  app.get('/api-docs', (_req: Request, res: Response) => {
    res.redirect('/api/docs');
  });

  app.get('/docs', (_req: Request, res: Response) => {
    res.redirect('/api/docs');
  });
}
