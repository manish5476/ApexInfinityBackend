import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const intelligenceAndOpsPaths: OpenApiPaths = {
  // ── TEAM CHAT ──
  '/chat/channels': {
    get: {
      tags: ['Team Chat'],
      summary: 'List accessible channels for current user',
      responses: okResponse('Channels list'),
    },
    post: {
      tags: ['Team Chat'],
      summary: 'Create internal discussion channel',
      requestBody: jsonBody({
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'sales-dispatch' },
          type: { type: 'string', enum: ['public', 'private', 'dm'], default: 'public' },
          members: { type: 'array', items: { type: 'string' } },
        },
      }),
      responses: createdResponse('Channel created'),
    },
  },
  '/chat/messages': {
    post: {
      tags: ['Team Chat'],
      summary: 'Send real-time chat message with broadcast to channel room',
      requestBody: jsonBody('ChatMessagePayload'),
      responses: createdResponse('Message dispatched and persisted'),
    },
  },
  '/chat/channels/{channelId}/messages': {
    get: {
      tags: ['Team Chat'],
      summary: 'Get paginated channel message history',
      parameters: [
        pathParam('channelId', 'Channel ID'),
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 50),
      ],
      responses: okResponse('Messages list'),
    },
  },

  // ── AI AGENT & INTELLIGENCE ──
  '/ai/chat': {
    post: {
      tags: ['AI Agent & Intelligence'],
      summary: 'Natural language CRM business intelligence with live database tool execution',
      description: 'Executes actual aggregations across invoices, stock, customer dues, and orders with 0% mock data.',
      requestBody: jsonBody('AiChatPromptRequest'),
      responses: okResponse('Factual AI answer and database context', 'AiChatPromptResponse'),
    },
  },
  '/ai-agent/chat': {
    post: {
      tags: ['AI Agent & Intelligence'],
      summary: 'Secondary alias for AI Agent chat interaction',
      requestBody: jsonBody('AiChatPromptRequest'),
      responses: okResponse('Factual AI answer and database context', 'AiChatPromptResponse'),
    },
  },

  // ── ANALYTICS & BI ──
  '/analytics/dashboard': {
    get: {
      tags: ['Analytics & BI'],
      summary: 'Executive dashboard overview KPIs',
      responses: okResponse('Overview KPI metrics', 'AnalyticsDashboardOverview'),
    },
  },
  '/analytics/branch-comparison': {
    get: {
      tags: ['Analytics & BI'],
      summary: 'Multi-branch performance & revenue comparison',
      responses: okResponse('Branch revenue and order volume comparison'),
    },
  },
  '/analytics/inventory-health': {
    get: {
      tags: ['Analytics & BI'],
      summary: 'Inventory stock health distribution (Critical, Warning, Healthy)',
      responses: okResponse('Stock health counts and valuation'),
    },
  },
  '/analytics/dead-stock': {
    get: {
      tags: ['Analytics & BI'],
      summary: 'Identify non-moving dead stock tying up working capital',
      responses: okResponse('Dead stock products report'),
    },
  },
  '/charts/sales-trends': {
    get: {
      tags: ['Analytics & BI'],
      summary: 'Get formatted time-series sales trend curves for charting',
      parameters: [
        queryParam('period', 'Interval: daily, weekly, monthly', 'string', 'daily'),
        queryParam('months', 'Number of lookback months', 'integer', 6),
      ],
      responses: okResponse('Sales trend charts dataset'),
    },
  },
  '/customer-analytics/rfm': {
    get: {
      tags: ['Analytics & BI'],
      summary: 'Recency, Frequency, Monetary (RFM) customer segmentation matrix',
      responses: okResponse('Customer RFM scores'),
    },
  },
  '/feed/activity': {
    get: {
      tags: ['Analytics & BI'],
      summary: 'Live chronological stream of business events across all modules',
      responses: okResponse('Activity feed items'),
    },
  },

  // ── GLOBAL SEARCH ──
  '/search': {
    get: {
      tags: ['Global Search'],
      summary: 'Instant multi-entity search across customers, products, and invoices',
      parameters: [
        queryParam('q', 'Keyword query string', 'string', 'battery'),
        queryParam('limit', 'Max results per entity', 'integer', 10),
      ],
      responses: okResponse('Grouped search matches'),
    },
  },

  // ── SYSTEM OPERATIONS ──
  '/cron/status': {
    get: {
      tags: ['System Operations'],
      summary: 'Check status of background scheduled cron jobs',
      responses: okResponse('Cron schedules status'),
    },
  },
  '/cron/{job}/trigger': {
    post: {
      tags: ['System Operations'],
      summary: 'Manually trigger immediate execution of a scheduled cron worker',
      parameters: [pathParam('job', 'Job name: attendance_sync, overdue_invoice_check, backup', 'string', 'overdue_invoice_check')],
      responses: okResponse('Cron job triggered'),
    },
  },
  '/cron/stop': {
    post: {
      tags: ['System Operations'],
      summary: 'Pause or stop all active background cron workers',
      responses: okResponse('Cron workers stopped'),
    },
  },
  '/logs': {
    get: {
      tags: ['System Operations'],
      summary: 'Query structured application logs with level and time filtering',
      parameters: [
        queryParam('level', 'Log level: error, warn, info, debug'),
        queryParam('search', 'Keyword filter in log message'),
        queryParam('limit', 'Limit', 'integer', 100),
      ],
      responses: okResponse('Application log stream'),
    },
  },
  '/dashboard': {
    get: {
      tags: ['System Operations'],
      summary: 'System operational health dashboard and server vitals',
      responses: okResponse('Operational vitals and memory stats'),
    },
  },
};
