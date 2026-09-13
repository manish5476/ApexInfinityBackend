import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const fieldServiceAndMediaPaths: OpenApiPaths = {
  // ── FIELD SERVICE ──
  '/field-service/work-assignments': {
    get: {
      tags: ['Field Service'],
      summary: 'List field service work assignments',
      description: 'Retrieve paginated technician dispatch work orders with optional filtering by status, priority, technician, and date range.',
      parameters: [
        queryParam('status', 'Filter by status: pending, assigned, en_route, in_progress, completed, cancelled', 'string', 'pending'),
        queryParam('priority', 'Filter by priority: low, medium, high, emergency', 'string'),
        queryParam('technicianId', 'Filter by assigned technician user ID', 'string'),
        queryParam('customerId', 'Filter by customer ID', 'string'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Page size limit', 'integer', 20),
      ],
      responses: okResponse('List of field service work assignments'),
    },
    post: {
      tags: ['Field Service'],
      summary: 'Create a new field service work assignment',
      description: 'Schedule a technician visit or on-site maintenance job for a customer.',
      requestBody: jsonBody({
        type: 'object',
        required: ['title', 'customerId', 'scheduledDate'],
        properties: {
          title: { type: 'string', example: 'HVAC Air Filter Replacement & Inspection' },
          description: { type: 'string', example: 'Quarterly preventative maintenance on rooftop chiller units.' },
          customerId: { type: 'string', example: 'cust-65e123' },
          technicianId: { type: 'string', example: 'tech-007' },
          scheduledDate: { type: 'string', format: 'date-time', example: '2026-09-15T09:00:00Z' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
          serviceAddress: {
            type: 'object',
            properties: {
              street: { type: 'string', example: 'Plot 42, Tech Park Central' },
              city: { type: 'string', example: 'Bengaluru' },
              state: { type: 'string', example: 'Karnataka' },
              postalCode: { type: 'string', example: '560001' },
            },
          },
          slaHours: { type: 'number', example: 4 },
          estimatedCost: { type: 'number', example: 2500 },
        },
      }),
      responses: createdResponse('Work assignment created and technician notified'),
    },
  },

  '/field-service/work-assignments/stats': {
    get: {
      tags: ['Field Service'],
      summary: 'Field service operational metrics and KPI overview',
      description: 'Returns real-time aggregates on ticket resolution times, active dispatches, pending tasks, and SLA compliance rate.',
      responses: okResponse('Field service statistics overview'),
    },
  },

  '/field-service/work-assignments/sla-at-risk': {
    get: {
      tags: ['Field Service'],
      summary: 'List work assignments currently at risk of SLA breach',
      description: 'Identifies urgent tickets nearing their target completion deadline within the next 2 hours.',
      responses: okResponse('Work assignments at risk of SLA breach'),
    },
  },

  '/field-service/work-assignments/calendar': {
    get: {
      tags: ['Field Service'],
      summary: 'Get scheduled assignments formatted for calendar display',
      parameters: [
        queryParam('startDate', 'Range start date (YYYY-MM-DD)', 'string', '2026-09-01'),
        queryParam('endDate', 'Range end date (YYYY-MM-DD)', 'string', '2026-09-30'),
        queryParam('technicianId', 'Filter by specific technician', 'string'),
      ],
      responses: okResponse('Calendar scheduled events list'),
    },
  },

  '/field-service/work-assignments/series/{seriesId}': {
    get: {
      tags: ['Field Service'],
      summary: 'Get recurring work assignment series by series ID',
      parameters: [
        pathParam('seriesId', 'Recurring Series Group ID', 'string', 'ser-882'),
      ],
      responses: okResponse('Series recurrence instances'),
    },
  },

  '/field-service/work-assignments/{id}': {
    get: {
      tags: ['Field Service'],
      summary: 'Get single work assignment by ID',
      parameters: [
        pathParam('id', 'Work assignment ID', 'string', 'wa-65e123'),
      ],
      responses: okResponse('Work assignment full details'),
    },
    patch: {
      tags: ['Field Service'],
      summary: 'Update work assignment details',
      parameters: [
        pathParam('id', 'Work assignment ID', 'string', 'wa-65e123'),
      ],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          technicianId: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
          scheduledDate: { type: 'string', format: 'date-time' },
          notes: { type: 'string' },
        },
      }),
      responses: okResponse('Work assignment updated'),
    },
  },

  '/field-service/work-assignments/{id}/status': {
    patch: {
      tags: ['Field Service'],
      summary: 'Transition work assignment workflow status',
      description: 'Update lifecycle status: pending → assigned → en_route → in_progress → completed / cancelled.',
      parameters: [
        pathParam('id', 'Work assignment ID', 'string', 'wa-65e123'),
      ],
      requestBody: jsonBody({
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'assigned', 'en_route', 'in_progress', 'completed', 'cancelled'],
            example: 'in_progress',
          },
          reason: { type: 'string', example: 'Technician arrived on customer site' },
          location: {
            type: 'object',
            properties: {
              latitude: { type: 'number', example: 12.9716 },
              longitude: { type: 'number', example: 77.5946 },
            },
          },
        },
      }),
      responses: okResponse('Work assignment status transitioned'),
    },
  },

  '/field-service/work-assignments/{id}/complete': {
    post: {
      tags: ['Field Service'],
      summary: 'Mark work assignment completed with customer sign-off',
      parameters: [
        pathParam('id', 'Work assignment ID', 'string', 'wa-65e123'),
      ],
      requestBody: jsonBody({
        type: 'object',
        required: ['resolutionSummary'],
        properties: {
          resolutionSummary: { type: 'string', example: 'Replaced primary compressor capacitor and recharged R410A refrigerant.' },
          partsReplaced: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                partName: { type: 'string', example: 'Capacitor 45uF' },
                quantity: { type: 'number', example: 1 },
                unitCost: { type: 'number', example: 450 },
              },
            },
          },
          actualHoursSpent: { type: 'number', example: 2.5 },
          customerSignatureUrl: { type: 'string', example: 'https://res.cloudinary.com/apex/image/upload/signatures/sig_102.png' },
          customerFeedbackRating: { type: 'number', minimum: 1, maximum: 5, example: 5 },
        },
      }),
      responses: okResponse('Work assignment completed successfully'),
    },
  },

  // ── MEDIA & ASSETS ──
  '/assets': {
    get: {
      tags: ['Media & Assets'],
      summary: 'List uploaded media assets and files',
      description: 'Browse digital assets with folder filtering, search keywords, file type filter, and pagination.',
      parameters: [
        queryParam('folder', 'Asset directory folder', 'string', 'invoices'),
        queryParam('type', 'MIME type or category (image, document, pdf)', 'string', 'image'),
        queryParam('search', 'Filename or tag keyword', 'string'),
        queryParam('page', 'Page number', 'integer', 1),
        queryParam('limit', 'Limit per page', 'integer', 20),
      ],
      responses: okResponse('Assets directory list'),
    },
  },

  '/assets/stats': {
    get: {
      tags: ['Media & Assets'],
      summary: 'Storage usage statistics and quota breakdown',
      description: 'Returns storage quota consumption, total files uploaded, and space distribution across images, PDFs, and media.',
      responses: okResponse('Storage quota and consumption stats'),
    },
  },

  '/assets/upload': {
    post: {
      tags: ['Media & Assets'],
      summary: 'Upload single media file or document',
      description: 'Upload an image, PDF receipt, avatar, or document to storage. Supports up to 50MB.',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: {
                file: { type: 'string', format: 'binary', description: 'File to upload' },
                folder: { type: 'string', example: 'products', description: 'Target storage directory' },
                tags: { type: 'string', example: 'hero,catalog,featured', description: 'Comma-separated tags' },
                isPublic: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      responses: createdResponse('File uploaded and CDN URL generated'),
    },
  },

  '/assets/upload/multiple': {
    post: {
      tags: ['Media & Assets'],
      summary: 'Bulk upload up to 10 files simultaneously',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['files'],
              properties: {
                files: {
                  type: 'array',
                  items: { type: 'string', format: 'binary' },
                  description: 'Up to 10 files to upload simultaneously',
                },
                folder: { type: 'string', example: 'storefront' },
              },
            },
          },
        },
      },
      responses: createdResponse('All files uploaded successfully'),
    },
  },

  '/assets/{id}': {
    get: {
      tags: ['Media & Assets'],
      summary: 'Get asset details and download URL by ID',
      parameters: [
        pathParam('id', 'Asset ID', 'string', 'asset-65e123'),
      ],
      responses: okResponse('Asset details and metadata'),
    },
    delete: {
      tags: ['Media & Assets'],
      summary: 'Permanently delete an asset from storage',
      parameters: [
        pathParam('id', 'Asset ID', 'string', 'asset-65e123'),
      ],
      responses: okResponse('Asset deleted successfully'),
    },
  },
};
