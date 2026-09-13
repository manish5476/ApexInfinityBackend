import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const collaborationAndWorkspacePaths: OpenApiPaths = {
  // ── COLLABORATION & NOTES ──
  '/notes': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'List user and team notes / task boards',
      parameters: [
        queryParam('folder', 'Folder filter'),
        queryParam('tag', 'Tag filter'),
        queryParam('search', 'Keyword search'),
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 20),
      ],
      responses: okResponse('Notes and tasks list'),
    },
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Create collaborative note or task card',
      requestBody: jsonBody({
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Sprint Planning: Q4 Revenue Targets' },
          content: { type: 'string', example: 'Discussing omnichannel expansion and distributor margins.' },
          tags: { type: 'array', items: { type: 'string' }, example: ['sprint', 'revenue', 'planning'] },
          isPinned: { type: 'boolean', default: false },
          folder: { type: 'string', example: 'Management' },
        },
      }),
      responses: createdResponse('Note created'),
    },
  },
  '/notes/{id}': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'Get note details by ID',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      responses: okResponse('Note details'),
    },
    patch: {
      tags: ['Collaboration & Workspace'],
      summary: 'Update note content or metadata',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          isPinned: { type: 'boolean' },
        },
      }),
      responses: okResponse('Note updated'),
    },
    delete: {
      tags: ['Collaboration & Workspace'],
      summary: 'Move note to trash',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      responses: okResponse('Note moved to trash'),
    },
  },
  '/notes/upload': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Upload media attachment for note',
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['file'],
              properties: { file: { type: 'string', format: 'binary' } },
            },
          },
        },
      },
      responses: createdResponse('Attachment uploaded'),
    },
  },
  '/notes/search': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'Full-text search inside notes and task content',
      parameters: [queryParam('q', 'Keyword to search', 'string', 'quarterly')],
      responses: okResponse('Search matches list'),
    },
  },
  '/notes/graph/network': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'Knowledge graph relationships and cross-links between notes',
      responses: okResponse('Knowledge graph nodes and edges'),
    },
  },
  '/notes/analytics/heatmap': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'Activity heatmap of note revisions and team edits',
      responses: okResponse('Heatmap frequency data'),
    },
  },
  '/notes/analytics/summary': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'Summary metrics of user notes and productivity',
      responses: okResponse('Notes analytics summary'),
    },
  },
  '/notes/calendar/view': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'Calendar view of notes with deadlines',
      parameters: [
        queryParam('month', 'Month (1-12)', 'integer', 9),
        queryParam('year', 'Year', 'integer', 2026),
      ],
      responses: okResponse('Calendar notes map'),
    },
  },
  '/notes/templates': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'List predefined note, sprint, and meeting templates',
      responses: okResponse('Templates list'),
    },
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Create reusable note template',
      requestBody: jsonBody({
        type: 'object',
        required: ['title', 'content'],
        properties: {
          title: { type: 'string', example: 'Product Launch Checklist' },
          content: { type: 'string', example: '- [ ] Pricing approved\n- [ ] Catalog updated' },
          category: { type: 'string', example: 'Product' },
        },
      }),
      responses: createdResponse('Template created'),
    },
  },
  '/notes/templates/{templateId}/create': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Instantiate new note from template',
      parameters: [pathParam('templateId', 'Template ID', 'string', 'tmpl-001')],
      responses: createdResponse('Note created from template'),
    },
  },
  '/notes/trash/bin': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'View notes currently in trash bin',
      responses: okResponse('Trash bin items'),
    },
  },
  '/notes/trash/{id}/restore': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Restore note from trash',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      responses: okResponse('Note restored'),
    },
  },
  '/notes/trash/empty': {
    delete: {
      tags: ['Collaboration & Workspace'],
      summary: 'Permanently empty trash bin',
      responses: okResponse('Trash bin cleared'),
    },
  },
  '/notes/{id}/comments': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'List discussion comments on a note',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      responses: okResponse('Comments list'),
    },
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Add comment to note discussion',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['text'],
        properties: { text: { type: 'string', example: 'Great progress, approved by sales team.' } },
      }),
      responses: createdResponse('Comment added'),
    },
  },
  '/notes/{id}/checklist': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Add checklist / subtask item to note',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['task'],
        properties: { task: { type: 'string', example: 'Send draft proposal to distributor' } },
      }),
      responses: createdResponse('Checklist item added'),
    },
  },
  '/notes/{id}/checklist/{subtaskId}': {
    patch: {
      tags: ['Collaboration & Workspace'],
      summary: 'Toggle checklist item completed status',
      parameters: [
        pathParam('id', 'Note ID', 'string', 'not-001'),
        pathParam('subtaskId', 'Subtask ID', 'string', 'sub-001'),
      ],
      responses: okResponse('Checklist item toggled'),
    },
  },
  '/notes/{id}/share': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Share note with other team members',
      parameters: [pathParam('id', 'Note ID', 'string', 'not-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['userIds'],
        properties: {
          userIds: { type: 'array', items: { type: 'string' } },
          permission: { type: 'string', enum: ['view', 'edit'], default: 'view' },
        },
      }),
      responses: okResponse('Note shared'),
    },
  },

  // ── MEETINGS ──
  '/meetings': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'List scheduled team meetings',
      responses: okResponse('Meetings list'),
    },
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Schedule a new team meeting with participants',
      requestBody: jsonBody({
        type: 'object',
        required: ['title', 'startTime', 'endTime'],
        properties: {
          title: { type: 'string', example: 'Monthly Inventory & Sales Review' },
          startTime: { type: 'string', format: 'date-time', example: '2026-09-15T14:00:00Z' },
          endTime: { type: 'string', format: 'date-time', example: '2026-09-15T15:30:00Z' },
          participants: { type: 'array', items: { type: 'string' }, example: ['usr-001', 'usr-002'] },
          locationType: { type: 'string', enum: ['in_person', 'virtual'], default: 'virtual' },
          meetingLink: { type: 'string', format: 'uri', example: 'https://meet.google.com/xyz-abcd-efg' },
        },
      }),
      responses: createdResponse('Meeting scheduled'),
    },
  },
  '/meetings/{meetingId}': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'Get meeting details and agenda',
      parameters: [pathParam('meetingId', 'Meeting ID', 'string', 'meet-001')],
      responses: okResponse('Meeting details'),
    },
    patch: {
      tags: ['Collaboration & Workspace'],
      summary: 'Update meeting schedule or agenda',
      parameters: [pathParam('meetingId', 'Meeting ID', 'string', 'meet-001')],
      requestBody: jsonBody({
        type: 'object',
        properties: {
          title: { type: 'string' },
          startTime: { type: 'string', format: 'date-time' },
          endTime: { type: 'string', format: 'date-time' },
        },
      }),
      responses: okResponse('Meeting updated'),
    },
  },
  '/meetings/{meetingId}/cancel': {
    delete: {
      tags: ['Collaboration & Workspace'],
      summary: 'Cancel meeting and notify participants',
      parameters: [pathParam('meetingId', 'Meeting ID', 'string', 'meet-001')],
      responses: okResponse('Meeting cancelled'),
    },
  },
  '/meetings/{meetingId}/rsvp': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Submit RSVP status for meeting (accepted, declined, tentative)',
      parameters: [pathParam('meetingId', 'Meeting ID', 'string', 'meet-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string', enum: ['accepted', 'declined', 'tentative'] } },
      }),
      responses: okResponse('RSVP submitted'),
    },
  },
  '/meetings/{meetingId}/action-items': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Add action item from meeting discussion',
      parameters: [pathParam('meetingId', 'Meeting ID', 'string', 'meet-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Finalize vendor credit agreement by Friday' },
          assigneeId: { type: 'string' },
          dueDate: { type: 'string', format: 'date' },
        },
      }),
      responses: createdResponse('Action item recorded'),
    },
  },
  '/meetings/{meetingId}/action-items/{actionItemId}/convert': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Convert meeting action item into a tracking task card',
      parameters: [
        pathParam('meetingId', 'Meeting ID', 'string', 'meet-001'),
        pathParam('actionItemId', 'Action Item ID', 'string', 'act-001'),
      ],
      responses: okResponse('Action item converted to task'),
    },
  },
  '/meetings/{meetingId}/polls': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Create interactive poll during meeting',
      parameters: [pathParam('meetingId', 'Meeting ID', 'string', 'meet-001')],
      requestBody: jsonBody({
        type: 'object',
        required: ['question', 'options'],
        properties: {
          question: { type: 'string', example: 'Should we offer 5% early payment discount?' },
          options: { type: 'array', items: { type: 'string' }, example: ['Yes', 'No', 'Need more data'] },
        },
      }),
      responses: createdResponse('Poll created'),
    },
  },
  '/meetings/{meetingId}/polls/{pollId}/vote': {
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Cast vote in meeting poll',
      parameters: [
        pathParam('meetingId', 'Meeting ID', 'string', 'meet-001'),
        pathParam('pollId', 'Poll ID', 'string', 'pol-001'),
      ],
      requestBody: jsonBody({
        type: 'object',
        required: ['optionIndex'],
        properties: { optionIndex: { type: 'number', example: 0 } },
      }),
      responses: okResponse('Vote recorded'),
    },
  },
  '/tasks': {
    get: {
      tags: ['Collaboration & Workspace'],
      summary: 'List user task assignments',
      responses: okResponse('Tasks list'),
    },
    post: {
      tags: ['Collaboration & Workspace'],
      summary: 'Create a task assignment',
      requestBody: jsonBody({
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', example: 'Reconcile August Axis Bank statement' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
          dueDate: { type: 'string', format: 'date' },
        },
      }),
      responses: createdResponse('Task created'),
    },
  },
};
