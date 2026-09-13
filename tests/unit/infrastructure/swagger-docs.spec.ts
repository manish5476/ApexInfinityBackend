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
});
