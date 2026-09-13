import request from 'supertest';
import { createApp } from '../../../src/app/app';
import { buildApplicationContainer } from '../../../src/app/composition/composition-root';
import { validateEnvironment } from '../../../src/config/environment';
import { StructuredLogger } from '../../../src/infrastructure/logging/StructuredLogger';
import { MongoConnectionManager } from '../../../src/infrastructure/database/MongoConnectionManager';
import { MemoryCache } from '../../../src/infrastructure/cache/MemoryCache';
import { InMemoryEventBus } from '../../../src/infrastructure/messaging/InMemoryEventBus';
import { JwtTokenService, BcryptPasswordHasher } from '../../../src/infrastructure/security';
import { LoggerEmailSender } from '../../../src/infrastructure/email';
import mongoose from 'mongoose';

describe('Swagger & OpenAPI 3.0 Documentation Infrastructure', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    const config = validateEnvironment({
      NODE_ENV: 'test',
      JWT_SECRET: 'test_jwt_secret_at_least_16_chars_long!',
    });
    const logger = new StructuredLogger('error');
    const dbManager = new MongoConnectionManager(logger);
    const connection = mongoose.connection;
    const cache = new MemoryCache();
    const eventBus = new InMemoryEventBus(logger);
    const tokenService = new JwtTokenService(
      config.JWT_SECRET,
      config.JWT_EXPIRES_IN,
      config.REFRESH_TOKEN_SECRET,
      config.REFRESH_TOKEN_EXPIRES_IN
    );
    const passwordHasher = new BcryptPasswordHasher();
    const emailSender = new LoggerEmailSender(logger);

    const container = buildApplicationContainer({
      config,
      logger,
      dbManager,
      connection,
      cache,
      eventBus,
      tokenService,
      passwordHasher,
      emailSender,
    });

    app = createApp(container);
  });

  it('serves raw OpenAPI 3.0.3 JSON specification at /api/docs/json', async () => {
    const res = await request(app).get('/api/docs/json');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toContain('Apex Infinity');
    expect(res.body.components.securitySchemes.BearerAuth).toBeDefined();
    expect(res.body.components.securitySchemes.TenantId).toBeDefined();

    // Verify all major module tags exist
    const tagNames = res.body.tags.map((t: any) => t.name);
    expect(tagNames).toContain('Authentication & Identity');
    expect(tagNames).toContain('Team Chat');
    expect(tagNames).toContain('AI Agent & Intelligence');
    expect(tagNames).toContain('Analytics & BI');
    expect(tagNames).toContain('Storefront (Public & Admin)');
    expect(tagNames).toContain('Inventory & Products');
    expect(tagNames).toContain('CRM & Customers');
    expect(tagNames).toContain('Accounting & Invoicing');
  });

  it('serves OpenAPI JSON at alternative path /api/docs.json', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
  });

  it('serves interactive Swagger UI HTML at /api/docs/', async () => {
    const res = await request(app).get('/api/docs/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('swagger-ui');
    expect(res.text).toContain('Apex Infinity');
  });

  it('redirects /api-docs to /api/docs', async () => {
    const res = await request(app).get('/api-docs');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/api/docs');
  });

  it('redirects /docs to /api/docs', async () => {
    const res = await request(app).get('/docs');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/api/docs');
  });

  it('provides correct and validated Swagger schemas for Authentication and Organization', async () => {
    const res = await request(app).get('/api/docs/json');
    expect(res.status).toBe(200);

    const { paths, components } = res.body;

    // 1. Verify CreateOrganizationRequest schema and POST /organizations endpoint
    expect(components.schemas.CreateOrganizationRequest).toBeDefined();
    expect(components.schemas.CreateOrganizationRequest.required).toEqual(
      expect.arrayContaining(['organizationName', 'ownerName', 'ownerEmail', 'ownerPassword'])
    );
    expect(paths['/organizations'].post).toBeDefined();
    expect(paths['/organizations'].post.security).toEqual([]);
    expect(paths['/organizations'].post.requestBody.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/CreateOrganizationRequest'
    );

    // 2. Verify UpdatePasswordRequest schema and PATCH /auth/update-my-password endpoint
    expect(components.schemas.UpdatePasswordRequest).toBeDefined();
    expect(components.schemas.UpdatePasswordRequest.required).toEqual(
      expect.arrayContaining(['passwordCurrent', 'password'])
    );
    expect(paths['/auth/update-my-password'].patch).toBeDefined();
    expect(paths['/auth/update-my-password'].patch.requestBody.content['application/json'].schema.$ref).toBe(
      '#/components/schemas/UpdatePasswordRequest'
    );

    // 3. Verify Branch creation schema
    expect(components.schemas.CreateBranchRequest).toBeDefined();
    expect(components.schemas.CreateBranchRequest.required).toEqual(['name']);
    expect(paths['/branches'].post).toBeDefined();
    expect(paths['/branches/my-branches'].get).toBeDefined();

    // 4. Verify Ownership routes exist
    expect(paths['/ownership/initiate'].post).toBeDefined();
    expect(paths['/ownership/finalize'].post).toBeDefined();
    expect(paths['/ownership/cancel'].post).toBeDefined();
    expect(paths['/ownership/force'].post).toBeDefined();

    // 5. Verify Organization extras routes exist
    expect(paths['/neworganization/invite'].post).toBeDefined();
    expect(paths['/neworganization/activity-log'].get).toBeDefined();

    // 6. Verify User self-management and auth verification endpoints exist
    expect(paths['/users/me/devices'].get).toBeDefined();
    expect(paths['/users/me/photo'].post).toBeDefined();
    expect(paths['/auth/send-verification-email'].post).toBeDefined();
    expect(paths['/roles/assign'].post).toBeDefined();
    expect(paths['/sessions/revoke-all'].patch).toBeDefined();
  });

  it('guarantees 0 broken or dangling schema $ref references across the entire OpenAPI document', async () => {
    const res = await request(app).get('/api/docs/json');
    expect(res.status).toBe(200);

    const doc = res.body;
    const allRefs: string[] = [];

    function extractRefs(obj: any) {
      if (!obj || typeof obj !== 'object') return;
      for (const [k, v] of Object.entries(obj)) {
        if (k === '$ref' && typeof v === 'string') {
          allRefs.push(v);
        } else if (typeof v === 'object') {
          extractRefs(v);
        }
      }
    }

    extractRefs(doc);
    expect(allRefs.length).toBeGreaterThan(100);

    const brokenRefs: string[] = [];
    allRefs.forEach((ref) => {
      if (ref.startsWith('#/components/schemas/')) {
        const schemaName = ref.replace('#/components/schemas/', '');
        if (!doc.components?.schemas?.[schemaName]) {
          brokenRefs.push(ref);
        }
      } else if (ref.startsWith('#/components/securitySchemes/')) {
        const secName = ref.replace('#/components/securitySchemes/', '');
        if (!doc.components?.securitySchemes?.[secName]) {
          brokenRefs.push(ref);
        }
      } else {
        brokenRefs.push('Unrecognized ref: ' + ref);
      }
    });

    expect(brokenRefs).toEqual([]);
  });

  it('verifies coverage for all production modules in OpenAPI specification', async () => {
    const res = await request(app).get('/api/docs/json');
    const paths = Object.keys(res.body.paths);

    // Minimum documented paths threshold
    expect(paths.length).toBeGreaterThanOrEqual(280);

    // Critical module paths coverage
    expect(paths).toContain('/auth/login');
    expect(paths).toContain('/auth/register');
    expect(paths).toContain('/organizations');
    expect(paths).toContain('/branches');
    expect(paths).toContain('/customers');
    expect(paths).toContain('/products');
    expect(paths).toContain('/stock/transfer');
    expect(paths).toContain('/sales');
    expect(paths).toContain('/purchases');
    expect(paths).toContain('/invoices');
    expect(paths).toContain('/payments');
    expect(paths).toContain('/accounts');
    expect(paths).toContain('/admin/storefront/pages');
    expect(paths).toContain('/store/{organizationSlug}/products');
    expect(paths).toContain('/delivery-agent/orders');
    expect(paths).toContain('/hrms/employees');
    expect(paths).toContain('/hrms/departments');
    expect(paths).toContain('/hrms/attendance/punch');
    expect(paths).toContain('/hrms/payroll/runs');
    expect(paths).toContain('/analytics/dashboard');
    expect(paths).toContain('/health');
  });
});
