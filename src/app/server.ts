import { createServer, Server } from 'http';
import { validateEnvironment } from '../config/environment';
import { StructuredLogger } from '../infrastructure/logging/StructuredLogger';
import { MongoConnectionManager } from '../infrastructure/database/MongoConnectionManager';
import { ICache } from '../infrastructure/cache/ICache';
import { MemoryCache } from '../infrastructure/cache/MemoryCache';
import { RedisCache } from '../infrastructure/cache/RedisCache';
import { InMemoryEventBus } from '../infrastructure/messaging/InMemoryEventBus';
import { JwtTokenService, BcryptPasswordHasher } from '../infrastructure/security';
import { IEmailSender, LoggerEmailSender, NodemailerEmailSender } from '../infrastructure/email';
import { SocketService } from '../infrastructure/socket';
import { buildApplicationContainer } from './composition/composition-root';
import { createApp } from './app';

async function bootstrap(): Promise<Server> {
  // 1. Validate Environment & Fail Fast on invalid config
  const config = validateEnvironment();
  const logger = new StructuredLogger(config.LOG_LEVEL, { service: 'apex-framework' });

  logger.info('====================================================');
  logger.info('Apex Infinity — Modular Monolith Framework Booting');
  logger.info(`Environment: ${config.NODE_ENV} | Port: ${config.PORT}`);
  logger.info('====================================================');

  // 2. Initialize Infrastructure: Database (supports MONGODB_URI or legacy DATABASE env)
  const mongoUri = config.DATABASE || config.MONGODB_URI;
  const dbManager = new MongoConnectionManager(logger);
  const connection = await dbManager.connect(
    mongoUri,
    config.MONGODB_DB_NAME,
    config.MONGODB_MAX_POOL_SIZE
  );

  // 3. Initialize Infrastructure: Cache (Redis if enabled, Memory fallback)
  let cache: ICache;
  if (config.REDIS_ENABLED && config.REDIS_URL) {
    const redisCache = new RedisCache(config.REDIS_URL, logger);
    await redisCache.connect();
    cache = redisCache;
  } else {
    logger.info('[cache] Redis disabled. Using in-memory cache.');
    cache = new MemoryCache();
  }

  // 4. Initialize Infrastructure: Messaging & Security
  const eventBus = new InMemoryEventBus(logger);
  const tokenService = new JwtTokenService(
    config.JWT_SECRET,
    config.JWT_EXPIRES_IN,
    config.REFRESH_TOKEN_SECRET,
    config.REFRESH_TOKEN_EXPIRES_IN
  );
  const passwordHasher = new BcryptPasswordHasher();

  // Email Sender: Nodemailer if SMTP configured, else LoggerEmailSender fallback
  let emailSender: IEmailSender;
  if (config.EMAIL_HOST) {
    logger.info(`[email] SMTP configured with host: ${config.EMAIL_HOST}:${config.EMAIL_PORT}`);
    emailSender = new NodemailerEmailSender(
      {
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        username: config.EMAIL_USERNAME,
        password: config.EMAIL_PASSWORD,
        fromName: config.EMAIL_FROM_NAME,
        fromEmail: config.EMAIL_FROM_ADDRESS || config.EMAIL_USERNAME,
      },
      logger
    );
  } else {
    logger.info('[email] SMTP not configured. Using LoggerEmailSender fallback.');
    emailSender = new LoggerEmailSender(logger);
  }

  // 5. Initialize Socket.IO Real-time Infrastructure
  const socketService = new SocketService(tokenService, logger);

  // 6. Build Dependency Graph (Composition Root)
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
    socketService,
  });

  // 7. Create Express App
  const app = createApp(container);

  // 8. Start HTTP Server and Attach Socket.IO
  const server = createServer(app);
  socketService.initialize(server);

  server.listen(config.PORT, () => {
    logger.info(`[server] HTTP server listening on http://localhost:${config.PORT}`);
    logger.info(`[server] Health endpoint: http://localhost:${config.PORT}/health`);
    logger.info(`[server] API root: http://localhost:${config.PORT}/api/v1`);
    logger.info(`[server] Real-time Socket.IO server connected`);
  });

  // 9. Graceful Shutdown Lifecycle
  let isShuttingDown = false;

  const gracefulShutdown = async (signal: string): Promise<void> => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`[server] Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('[server] HTTP server closed. Draining infrastructure...');

      try {
        await socketService.close();
        logger.info('[socket] Socket.IO server closed.');

        if (cache instanceof RedisCache) {
          await cache.disconnect();
          logger.info('[cache] Redis cache disconnected.');
        }

        await dbManager.disconnect();
        logger.info('[database] Database disconnected cleanly.');

        logger.info('[server] Graceful shutdown complete. Exiting.');
        process.exit(0);
      } catch (err) {
        logger.error(`[server] Error during shutdown: ${(err as Error)?.message}`);
        process.exit(1);
      }
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('[server] Graceful shutdown timeout exceeded. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', (err: Error) => {
    logger.error(`[process] Uncaught Exception: ${err.message}`, { stack: err.stack });
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error(`[process] Unhandled Rejection: ${String(reason)}`);
    gracefulShutdown('unhandledRejection');
  });

  return server;
}

// Auto-run if started directly
if (require.main === module) {
  bootstrap().catch((err) => {
    console.error('Fatal initialization error during application bootstrap:', err);
    process.exit(1);
  });
}

export { bootstrap };
