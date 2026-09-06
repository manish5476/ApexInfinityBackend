import request from 'supertest';
import { createApp } from '../../src/app/app';
import { buildApplicationContainer } from '../../src/app/composition/composition-root';
import { validateEnvironment } from '../../src/config/environment';
import { StructuredLogger } from '../../src/infrastructure/logging/StructuredLogger';
import { MongoConnectionManager } from '../../src/infrastructure/database/MongoConnectionManager';
import { MemoryCache } from '../../src/infrastructure/cache/MemoryCache';
import { InMemoryEventBus } from '../../src/infrastructure/messaging/InMemoryEventBus';
import { Connection } from 'mongoose';

describe('Health Endpoints Integration Tests', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    const config = validateEnvironment({
      NODE_ENV: 'test',
      JWT_SECRET: 'test_secret_must_be_at_least_16_characters_long',
    });
    const logger = new StructuredLogger('error');
    const dbManager = new MongoConnectionManager(logger);
    const cache = new MemoryCache();
    const eventBus = new InMemoryEventBus(logger);
    const tokenService = {
      generateToken: jest.fn().mockReturnValue('mock_token'),
      verifyToken: jest.fn().mockReturnValue({ userId: 'u1' }),
      generateRefreshToken: jest.fn().mockReturnValue('mock_refresh'),
      verifyRefreshToken: jest.fn().mockReturnValue({ userId: 'u1' }),
    };
    const passwordHasher = {
      hash: jest.fn().mockResolvedValue('hashed'),
      compare: jest.fn().mockResolvedValue(true),
    };
    const emailSender = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    // Mock connection for integration health testing without live MongoDB
    const mockConnection = {
      models: {},
      model: jest.fn(),
    } as unknown as Connection;

    const container = buildApplicationContainer({
      config,
      logger,
      dbManager,
      connection: mockConnection,
      cache,
      eventBus,
      tokenService,
      passwordHasher,
      emailSender,
    });

    app = createApp(container);
  });

  it('GET /health should return 200 with runtime status and service info', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.services.cache).toBe('CONFIGURED');
  });

  it('GET /health/live should return 200 ALIVE for orchestrators', async () => {
    const res = await request(app).get('/health/live');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ALIVE');
  });

  it('GET /health/ready should return 503 when database is not connected', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
  });
});
