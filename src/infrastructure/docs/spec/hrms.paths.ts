import { OpenApiPaths, okResponse, createdResponse, jsonBody, pathParam, queryParam } from './types';

export const hrmsPaths: OpenApiPaths = {
  // --- EMPLOYEES ---
  '/hrms/employees': {
    get: {
      tags: ['HRMS Suite'],
      summary: 'List employees with department and designation mapping',
      parameters: [
        queryParam('search', 'Search by name, employee code, or email'),
        queryParam('departmentId', 'Department ID filter'),
        queryParam('page', 'Page', 'integer', 1),
        queryParam('limit', 'Limit', 'integer', 20),
      ],
      responses: okResponse('Employees list'),
    },
    post: {
      tags: ['HRMS Suite'],
      summary: 'Onboard a new employee',
      requestBody: jsonBody({
        type: 'object',
        required: ['firstName', 'lastName', 'email', 'departmentId', 'joiningDate'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          departmentId: { type: 'string' },
          designationId: { type: 'string' },
          joiningDate: { type: 'string', format: 'date' },
          salary: { type: 'number' },
        },
      }),
      responses: createdResponse('Employee onboarded'),
    },
  },
  '/hrms/employees/{id}': {
    get: {
      tags: ['HRMS Suite'],
      summary: 'Get employee 360 profile',
      parameters: [pathParam('id', 'Employee ID')],
      responses: okResponse('Employee details'),
    },
    patch: {
      tags: ['HRMS Suite'],
      summary: 'Update employee record',
      parameters: [pathParam('id', 'Employee ID')],
      responses: okResponse('Employee updated'),
    },
  },
  '/hrms/employees/{id}/workspace': {
    get: {
      tags: ['HRMS Suite'],
      summary: 'Get employee 360 workspace dashboard (Attendance, Leaves, Assets, Salary)',
      parameters: [pathParam('id', 'Employee ID')],
      responses: okResponse('Workspace 360 overview'),
    },
  },

  // --- DEPARTMENTS & DESIGNATIONS ---
  '/hrms/departments': {
    get: {
      tags: ['HRMS Suite'],
      summary: 'List departments',
      responses: okResponse('Departments list'),
    },
    post: {
      tags: ['HRMS Suite'],
      summary: 'Create department',
      requestBody: jsonBody({
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
        },
      }),
      responses: createdResponse('Department created'),
    },
  },
  '/hrms/departments/hierarchy': {
    get: {
      tags: ['HRMS Suite'],
      summary: 'Get departmental reporting tree hierarchy',
      responses: okResponse('Department hierarchy'),
    },
  },
  '/hrms/designations': {
    get: {
      tags: ['HRMS Suite'],
      summary: 'List job designations and salary bands',
      responses: okResponse('Designations list'),
    },
  },

  // --- ATTENDANCE & PUNCH ---
  '/hrms/attendance/punch': {
    post: {
      tags: ['HRMS - Attendance'],
      summary: 'Record biometric, web, or mobile punch',
      description: 'Records real-time punch with timestamp, GPS coordinates, device fingerprint, and IP.',
      requestBody: jsonBody({
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string', enum: ['in', 'out', 'break_start', 'break_end'] },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          machineId: { type: 'string' },
          deviceInfo: { type: 'object' },
        },
      }),
      responses: createdResponse('Punch recorded'),
    },
  },
  '/hrms/attendance/daily/today': {
    get: {
      tags: ['HRMS - Attendance'],
      summary: 'Get organization attendance snapshot for today',
      responses: okResponse('Today attendance summary (Present, Absent, Late, On-Leave)'),
    },
  },
  '/hrms/attendance/daily/my-attendance': {
    get: {
      tags: ['HRMS - Attendance'],
      summary: 'Get logged-in user personal attendance history',
      responses: okResponse('Personal attendance calendar'),
    },
  },
  '/hrms/attendance/machines': {
    get: {
      tags: ['HRMS - Attendance'],
      summary: 'List biometric hardware punch machines',
      responses: okResponse('Biometric machines list'),
    },
    post: {
      tags: ['HRMS - Attendance'],
      summary: 'Register new biometric machine',
      responses: createdResponse('Machine registered'),
    },
  },
  '/hrms/attendance/geofences': {
    get: {
      tags: ['HRMS - Attendance'],
      summary: 'List authorized GPS geofence boundaries for mobile punch',
      responses: okResponse('Geofences list'),
    },
    post: {
      tags: ['HRMS - Attendance'],
      summary: 'Define new office GPS geofence boundary',
      requestBody: jsonBody({
        type: 'object',
        required: ['name', 'latitude', 'longitude', 'radius'],
        properties: {
          name: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          radius: { type: 'number', description: 'Radius in meters', example: 100 },
        },
      }),
      responses: createdResponse('Geofence created'),
    },
  },

  // --- LEAVE MANAGEMENT ---
  '/hrms/leave-requests': {
    get: {
      tags: ['HRMS - Leaves'],
      summary: 'List leave applications',
      parameters: [
        queryParam('status', 'Filter status: pending, approved, rejected'),
        queryParam('page', 'Page', 'integer', 1),
      ],
      responses: okResponse('Leave requests list'),
    },
    post: {
      tags: ['HRMS - Leaves'],
      summary: 'Submit a new leave application',
      requestBody: jsonBody({
        type: 'object',
        required: ['leaveType', 'startDate', 'endDate', 'reason'],
        properties: {
          leaveType: { type: 'string', enum: ['casual', 'sick', 'earned', 'unpaid'] },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          reason: { type: 'string' },
        },
      }),
      responses: createdResponse('Leave request submitted'),
    },
  },
  '/hrms/leave-requests/{id}/approve': {
    patch: {
      tags: ['HRMS - Leaves'],
      summary: 'Approve leave request and deduct leave balance',
      parameters: [pathParam('id', 'Leave Request ID')],
      responses: okResponse('Leave approved'),
    },
  },
  '/hrms/leave-requests/{id}/reject': {
    patch: {
      tags: ['HRMS - Leaves'],
      summary: 'Reject leave request',
      parameters: [pathParam('id', 'Leave Request ID')],
      requestBody: jsonBody({
        type: 'object',
        required: ['reason'],
        properties: { reason: { type: 'string' } },
      }),
      responses: okResponse('Leave rejected'),
    },
  },
  '/hrms/leave-balances/my-balance': {
    get: {
      tags: ['HRMS - Leaves'],
      summary: 'Get leave balances (Casual, Sick, Earned) for current user',
      responses: okResponse('Available leave balances'),
    },
  },

  // --- PAYROLL & SALARIES ---
  '/hrms/payroll/runs': {
    post: {
      tags: ['HRMS - Payroll'],
      summary: 'Trigger monthly payroll calculation run across all employees',
      requestBody: jsonBody({
        type: 'object',
        required: ['month', 'year'],
        properties: {
          month: { type: 'integer', example: 9 },
          year: { type: 'integer', example: 2026 },
        },
      }),
      responses: createdResponse('Payroll run completed with generated payslips'),
    },
  },
  '/hrms/payroll/payslips': {
    get: {
      tags: ['HRMS - Payroll'],
      summary: 'List payslips for organization staff',
      parameters: [
        queryParam('month', 'Month', 'integer'),
        queryParam('year', 'Year', 'integer'),
      ],
      responses: okResponse('Payslips list'),
    },
  },
  '/hrms/payroll/my-payslips': {
    get: {
      tags: ['HRMS - Payroll'],
      summary: 'Retrieve logged-in user personal payslips',
      responses: okResponse('Personal payslips history'),
    },
  },
  '/hrms/salary-structures': {
    get: {
      tags: ['HRMS - Payroll'],
      summary: 'List salary structures with basic, HRA, allowances, PF, ESIC',
      responses: okResponse('Salary structures list'),
    },
    post: {
      tags: ['HRMS - Payroll'],
      summary: 'Create salary structure formula template',
      responses: createdResponse('Salary structure created'),
    },
  },
};
