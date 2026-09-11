import { Router } from 'express';
import { Connection } from 'mongoose';
import { IAnalyticsRepository } from './domain/ports/IAnalyticsRepository';
import { InMemoryAnalyticsRepository } from './infrastructure/repositories/InMemoryAnalyticsRepository';
import { MongoAnalyticsRepository } from './infrastructure/repositories/MongoAnalyticsRepository';
import { AnalyticsUseCases } from './application/use-cases/AnalyticsUseCases';
import { AnalyticsController } from './presentation/controllers/analytics.controller';
import { ChartController } from './presentation/controllers/chart.controller';
import { CustomerAnalyticsController } from './presentation/controllers/customerAnalytics.controller';
import { FeedController } from './presentation/controllers/feed.controller';
import { createAnalyticsRouter } from './presentation/routes/analytics.routes';
import { createChartRouter } from './presentation/routes/chart.routes';
import { createCustomerAnalyticsRouter } from './presentation/routes/customerAnalytics.routes';
import { createFeedRouter } from './presentation/routes/feed.routes';

export interface AnalyticsModule {
  analyticsRouter: Router;
  chartRouter: Router;
  customerAnalyticsRouter: Router;
  feedRouter: Router;
  repository: IAnalyticsRepository;
  useCases: AnalyticsUseCases;
}

export function createAnalyticsModule(deps: {
  connection: Connection;
  useInMemory?: boolean;
}): AnalyticsModule {
  const repository: IAnalyticsRepository = deps.useInMemory
    ? new InMemoryAnalyticsRepository()
    : new MongoAnalyticsRepository();

  const useCases = new AnalyticsUseCases(repository);

  const analyticsCtrl = new AnalyticsController(useCases);
  const chartCtrl = new ChartController(useCases);
  const customerAnalyticsCtrl = new CustomerAnalyticsController(useCases);
  const feedCtrl = new FeedController(useCases);

  const analyticsRouter = createAnalyticsRouter(analyticsCtrl);
  const chartRouter = createChartRouter(chartCtrl);
  const customerAnalyticsRouter = createCustomerAnalyticsRouter(customerAnalyticsCtrl);
  const feedRouter = createFeedRouter(feedCtrl);

  return {
    analyticsRouter,
    chartRouter,
    customerAnalyticsRouter,
    feedRouter,
    repository,
    useCases,
  };
}
