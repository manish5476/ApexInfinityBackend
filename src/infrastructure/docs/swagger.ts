import { Application, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Apex Infinity — Enterprise Modular Monolith API',
    version: '1.0.0',
    description: `
# Apex Infinity Enterprise API

Welcome to the **Apex Infinity** Modular Monolith Platform API Documentation.

### Architecture Highlights:
- **Clean Hexagonal Architecture**: Domain Entities $\\to$ Use Cases $\\to$ Concrete Mongo Repositories.
- **Strict Multi-Tenancy**: Every request is scoped to an organization through cryptographic JWT verification or headers.
- **Real-Time WebSockets**: Powered by Socket.IO on the same HTTP server for live team chat and notifications.
- **Real Business Intelligence**: 100% computed from live MongoDB transactional records.

---

### Authentication Guide:
1. Call \`POST /api/v1/auth/login\` with your email and password.
2. Copy the \`token\` from the response.
3. Click the **Authorize** button at the top right of this page and enter: \`Bearer <your_token>\`.
4. For multi-tenant header overrides, use the \`x-organization-id\` header.
    `,
    contact: {
      name: 'Apex Platform Engineering',
      email: 'support@apexinfinity.io',
      url: 'https://apexinfinity.io',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current API v1 Base Path',
    },
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Local Development Server (Port 5000 - Frontend Default)',
    },
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Local Development Server (Port 4000)',
    },
  ],
  tags: [
    { name: 'Authentication & Identity', description: 'User login, registration, JWT refresh, session lifecycle' },
    { name: 'Organization & Branches', description: 'Multi-tenant organization registration, settings, branch isolation' },
    { name: 'CRM & Customers', description: 'Customer profiles, outstanding balance tracking, credit limits, suppliers' },
    { name: 'Inventory & Products', description: 'Catalog management, multi-branch stock levels, valuation, purchases' },
    { name: 'Accounting & Invoicing', description: 'Invoices, payments, general ledger accounts, reconciliation' },
    { name: 'Storefront (Public & Admin)', description: 'E-commerce storefront catalog, CMS pages, checkout, orders' },
    { name: 'Delivery & Logistics', description: 'Last-mile delivery agents, platform fulfillment, shipment tracking' },
    { name: 'Team Chat', description: 'Real-time internal discussion channels, direct messages, attachments' },
    { name: 'AI Agent & Intelligence', description: 'Natural language CRM intelligence with live database tool execution' },
    { name: 'Analytics & BI', description: 'Executive dashboard, gross profit, revenue trends, inventory health' },
    { name: 'HRMS Suite', description: 'Employee master, biometric punch attendance, leave approvals, payroll' },
    { name: 'Collaboration & Workspace', description: 'Notes, task boards, meeting scheduling, team templates' },
    { name: 'Field Service', description: 'Technician work assignments, dispatch tickets, scheduling' },
    { name: 'Media & Assets', description: 'File uploads, asset tagging, MIME-type storage management' },
    { name: 'Notifications & Broadcasts', description: 'User notification inbox, read receipts, broadcast announcements' },
    { name: 'Webhooks', description: 'Webhook subscription endpoints, HMAC secret verification, delivery logs' },
    { name: 'Master Data & Dropdowns', description: 'Custom drop-down options, system categories, lookup masters' },
    { name: 'Global Search', description: 'High-speed multi-entity regex search across customers, products, invoices' },
    { name: 'Admin Platform', description: 'Superadmin management, tenant metrics, live sessions, impersonation' },
    { name: 'System Operations', description: 'Scheduled cron jobs, application log streaming, system overview' },
    { name: 'Health & Diagnostics', description: 'Liveness probes, MongoDB socket connection state, cache health' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT token formatted as: Bearer <token>',
      },
      TenantId: {
        type: 'apiKey',
        in: 'header',
        name: 'x-organization-id',
        description: 'Optional organization identifier for explicit multi-tenant context',
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
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@apex.local' },
          password: { type: 'string', format: 'password', example: 'SuperSecurePassword123!' },
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
      AiChatPromptRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string',
            example: 'What is our current revenue and how many invoices are unpaid?',
          },
        },
      },
      AiChatPromptResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          reply: {
            type: 'string',
            example: 'Apex AI Financial Analysis: Total Revenue is ₹1,25,000 across 15 invoices (Paid: ₹1,00,000, Outstanding: ₹25,000).',
          },
          toolsUsed: {
            type: 'array',
            items: { type: 'string' },
            example: ['SalesAnalyticsTool'],
          },
          data: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      ChatMessagePayload: {
        type: 'object',
        required: ['channelId'],
        properties: {
          channelId: { type: 'string', example: 'chan-engineering-01' },
          body: { type: 'string', example: 'Deployment v1.2 scheduled for 8:00 PM.' },
          attachments: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'release_notes.pdf' },
                url: { type: 'string', example: 'https://storage.apex.local/chat/release_notes.pdf' },
                size: { type: 'number', example: 1048576 },
                type: { type: 'string', example: 'application/pdf' },
              },
            },
          },
        },
      },
      AnalyticsDashboardOverview: {
        type: 'object',
        properties: {
          totalRevenue: { type: 'number', example: 250000 },
          netProfit: { type: 'number', example: 110000 },
          totalOrders: { type: 'number', example: 48 },
          activeCustomers: { type: 'number', example: 32 },
          inventoryValuation: { type: 'number', example: 150000 },
          totalReceivables: { type: 'number', example: 45000 },
          totalPayables: { type: 'number', example: 20000 },
          lowStockAlerts: { type: 'number', example: 3 },
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
        summary: 'System health check and database status',
        description: 'Returns connection status for MongoDB and cache.',
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
                    database: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'CONNECTED' },
                        connectionsCount: { type: 'number', example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication & Identity'],
        summary: 'User Login with credentials',
        description: 'Authenticates an existing user and returns JWT access + refresh tokens.',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials or inactive account',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' },
              },
            },
          },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication & Identity'],
        summary: 'Retrieve current authenticated user context',
        responses: {
          200: {
            description: 'User profile and permissions',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiResponse' },
              },
            },
          },
          401: { description: 'Missing or expired token' },
        },
      },
    },
    '/ai/chat': {
      post: {
        tags: ['AI Agent & Intelligence'],
        summary: 'Execute natural language query with live CRM tools',
        description: 'Analyzes intent and runs live database tools across sales, inventory, dues, and orders without fake data.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AiChatPromptRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'AI Agent factual response from live MongoDB data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AiChatPromptResponse' },
              },
            },
          },
          400: { description: 'Empty query or missing organization context' },
        },
      },
    },
    '/chat/channels': {
      get: {
        tags: ['Team Chat'],
        summary: 'List accessible team chat channels',
        description: 'Returns all public channels and private channels where user is a member.',
        responses: {
          200: {
            description: 'List of channels',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/ApiResponse' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Team Chat'],
        summary: 'Create a new team chat channel',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'marketing-updates' },
                  type: { type: 'string', enum: ['public', 'private', 'dm'], default: 'public' },
                  members: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Channel created successfully' },
        },
      },
    },
    '/chat/messages': {
      post: {
        tags: ['Team Chat'],
        summary: 'Send a message to a team channel',
        description: 'Persists message to MongoDB and broadcasts real-time WebSocket event to channel room.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ChatMessagePayload' },
            },
          },
        },
        responses: {
          201: { description: 'Message sent successfully' },
          400: { description: 'Empty message body or missing channel' },
        },
      },
    },
    '/chat/channels/{channelId}/messages': {
      get: {
        tags: ['Team Chat'],
        summary: 'Retrieve paginated messages for a channel',
        parameters: [
          { name: 'channelId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: {
          200: { description: 'Channel message list' },
        },
      },
    },
    '/analytics/overview': {
      get: {
        tags: ['Analytics & BI'],
        summary: 'Executive dashboard overview metrics',
        description: 'Calculates live total revenue, inventory valuation, receivables, and payables from MongoDB.',
        responses: {
          200: {
            description: 'Executive KPI metrics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnalyticsDashboardOverview' },
              },
            },
          },
        },
      },
    },
    '/analytics/inventory-health': {
      get: {
        tags: ['Analytics & BI'],
        summary: 'Inventory stock health breakdown',
        parameters: [
          { name: 'branchId', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'Healthy vs Low-Stock vs Critical counts',
          },
        },
      },
    },
    '/customers': {
      get: {
        tags: ['CRM & Customers'],
        summary: 'List organization customers with outstanding balances',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Customer list with pagination' },
        },
      },
      post: {
        tags: ['CRM & Customers'],
        summary: 'Create a new customer profile',
        responses: {
          201: { description: 'Customer created' },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Inventory & Products'],
        summary: 'List products and inventory quantities',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          200: { description: 'Product list' },
        },
      },
    },
    '/invoices': {
      get: {
        tags: ['Accounting & Invoicing'],
        summary: 'List invoices and payment balances',
        responses: {
          200: { description: 'Invoice list' },
        },
      },
    },
    '/store/{orgSlug}/products': {
      get: {
        tags: ['Storefront (Public & Admin)'],
        summary: 'Public storefront product catalog',
        description: 'Unauthenticated public endpoint returning active products for a merchant store.',
        security: [],
        parameters: [
          { name: 'orgSlug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Public storefront catalog' },
        },
      },
    },
    '/store/{orgSlug}/checkout': {
      post: {
        tags: ['Storefront (Public & Admin)'],
        summary: 'Place an order through public storefront checkout',
        security: [],
        parameters: [
          { name: 'orgSlug', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          201: { description: 'Order placed successfully' },
        },
      },
    },
    '/admin/storefront/pages': {
      get: {
        tags: ['Storefront (Public & Admin)'],
        summary: 'List CMS storefront pages (Admin)',
        responses: {
          200: { description: 'Storefront page list' },
        },
      },
    },
    '/search': {
      get: {
        tags: ['Global Search'],
        summary: 'Multi-entity regex search across customers, products, and invoices',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string', example: 'keyboard' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: { description: 'Aggregated search results grouped by entity' },
        },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications & Broadcasts'],
        summary: 'Retrieve user notification inbox',
        responses: {
          200: { description: 'Notification list' },
        },
      },
    },
  },
};

export const swaggerUiOptions: swaggerUi.SwaggerUiOptions = {
  customSiteTitle: 'Apex Infinity — API Documentation',
  customCss: `
    .swagger-ui .topbar { background-color: #0f172a; border-bottom: 2px solid #3b82f6; }
    .swagger-ui .topbar .topbar-wrapper .link { color: #ffffff; font-weight: 700; font-size: 1.1rem; }
    .swagger-ui .info .title { color: #0f172a; font-family: Inter, system-ui, -apple-system, sans-serif; font-weight: 800; }
    .swagger-ui .opblock.opblock-get { border-color: #3b82f6; background: rgba(59, 130, 246, 0.05); }
    .swagger-ui .opblock.opblock-post { border-color: #10b981; background: rgba(16, 185, 129, 0.05); }
    .swagger-ui .opblock.opblock-patch { border-color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
    .swagger-ui .opblock.opblock-delete { border-color: #ef4444; background: rgba(239, 68, 68, 0.05); }
    .swagger-ui .btn.authorize { background-color: #3b82f6; color: #fff; border-color: #3b82f6; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
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
