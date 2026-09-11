import { Router } from 'express';
import { FeedController } from '../controllers/feed.controller';

export function createFeedRouter(ctrl: FeedController): Router {
  const router = Router();

  router.get('/customer/:customerId', ctrl.getCustomerFeed);

  return router;
}
