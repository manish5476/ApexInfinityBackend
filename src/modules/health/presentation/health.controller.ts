import { Request, Response } from 'express';
import { MongoConnectionManager, DatabaseStatus } from '../../../infrastructure/database';
import { ICache } from '../../../infrastructure/cache';
import { ApiResponseFactory } from '../../../shared/contracts';

export class HealthController {
  private readonly dbManager: MongoConnectionManager;
  private readonly cache?: ICache;
  private readonly startTime: number;

  constructor(dbManager: MongoConnectionManager, cache?: ICache) {
    this.dbManager = dbManager;
    this.cache = cache;
    this.startTime = Date.now();
  }

  /**
   * GET /health
   * General process and runtime health information.
   */
  public getHealth = (_req: Request, res: Response): void => {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const dbHealth = this.dbManager.getHealth();

    res.status(200).json(
      ApiResponseFactory.success({
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptimeSeconds,
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: dbHealth.status,
          cache: this.cache ? 'CONFIGURED' : 'NONE',
        },
      })
    );
  };

  /**
   * GET /health/live
   * Kubernetes / Docker liveness probe: returns 200 immediately if process is alive.
   */
  public getLive = (_req: Request, res: Response): void => {
    res.status(200).json(
      ApiResponseFactory.success({
        status: 'ALIVE',
        timestamp: new Date().toISOString(),
      })
    );
  };

  /**
   * GET /health/ready
   * Kubernetes readiness probe: returns 200 if critical dependencies (DB) are ready, 503 if not.
   */
  public getReady = (_req: Request, res: Response): void => {
    const dbHealth = this.dbManager.getHealth();
    const isDbConnected = dbHealth.status === DatabaseStatus.CONNECTED;

    if (!isDbConnected) {
      res.status(503).json(
        ApiResponseFactory.error(
          'SERVICE_UNAVAILABLE',
          'Database connection is not ready.',
          { database: dbHealth }
        )
      );
      return;
    }

    res.status(200).json(
      ApiResponseFactory.success({
        status: 'READY',
        timestamp: new Date().toISOString(),
        database: dbHealth,
      })
    );
  };
}
