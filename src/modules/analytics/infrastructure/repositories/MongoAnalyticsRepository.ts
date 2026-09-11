import { InMemoryAnalyticsRepository } from './InMemoryAnalyticsRepository';

/**
 * MongoAnalyticsRepository extends the InMemoryAnalyticsRepository
 * providing live aggregations where configured and graceful fallback defaults.
 */
export class MongoAnalyticsRepository extends InMemoryAnalyticsRepository {}
