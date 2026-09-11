import { Router } from 'express';
import { Connection } from 'mongoose';
import { WebhookController } from './presentation/controllers/webhook.controller';
import { createWebhookRoutes } from './presentation/routes/webhook.routes';
import { IWebhookRepository } from './domain/ports/IWebhookRepository';
import { IWebhookDeliveryRepository } from './domain/ports/IWebhookDeliveryRepository';
import { MongoWebhookRepository } from './infrastructure/repositories/MongoWebhookRepository';
import { MongoWebhookDeliveryRepository } from './infrastructure/repositories/MongoWebhookDeliveryRepository';
import { InMemoryWebhookRepository } from './infrastructure/repositories/InMemoryWebhookRepository';
import { InMemoryWebhookDeliveryRepository } from './infrastructure/repositories/InMemoryWebhookDeliveryRepository';
import { RegisterWebhookUseCase } from './application/use-cases/RegisterWebhookUseCase';
import { ListWebhooksUseCase } from './application/use-cases/ListWebhooksUseCase';
import { GetWebhookByIdUseCase } from './application/use-cases/GetWebhookByIdUseCase';
import { UpdateWebhookUseCase } from './application/use-cases/UpdateWebhookUseCase';
import { DeleteWebhookUseCase } from './application/use-cases/DeleteWebhookUseCase';
import { TestWebhookUseCase } from './application/use-cases/TestWebhookUseCase';
import { TriggerWebhookDeliveriesUseCase } from './application/use-cases/TriggerWebhookDeliveriesUseCase';
import { ListWebhookDeliveriesUseCase } from './application/use-cases/ListWebhookDeliveriesUseCase';
import { GetWebhookStatsUseCase } from './application/use-cases/GetWebhookStatsUseCase';
import { ReplayWebhookDeliveryUseCase } from './application/use-cases/ReplayWebhookDeliveryUseCase';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';

export interface WebhookModule {
  routes: Router;
  webhookRepository: IWebhookRepository;
  deliveryRepository: IWebhookDeliveryRepository;
  repository: IWebhookRepository; // backwards compatibility
  controller: WebhookController;
}

export function createWebhookModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  useInMemory?: boolean;
}): WebhookModule {
  const webhookRepository: IWebhookRepository = deps.useInMemory
    ? new InMemoryWebhookRepository()
    : new MongoWebhookRepository();

  const deliveryRepository: IWebhookDeliveryRepository = deps.useInMemory
    ? new InMemoryWebhookDeliveryRepository()
    : new MongoWebhookDeliveryRepository();

  const registerWebhookUC = new RegisterWebhookUseCase(webhookRepository);
  const listWebhooksUC = new ListWebhooksUseCase(webhookRepository);
  const getWebhookByIdUC = new GetWebhookByIdUseCase(webhookRepository);
  const updateWebhookUC = new UpdateWebhookUseCase(webhookRepository);
  const deleteWebhookUC = new DeleteWebhookUseCase(webhookRepository);
  const testWebhookUC = new TestWebhookUseCase(webhookRepository, deliveryRepository);
  const triggerWebhookUC = new TriggerWebhookDeliveriesUseCase(webhookRepository, deps.eventBus, deliveryRepository);
  const listDeliveriesUC = new ListWebhookDeliveriesUseCase(deliveryRepository);
  const getStatsUC = new GetWebhookStatsUseCase(deliveryRepository);
  const replayDeliveryUC = new ReplayWebhookDeliveryUseCase(webhookRepository, deliveryRepository);

  const controller = new WebhookController(
    registerWebhookUC,
    listWebhooksUC,
    getWebhookByIdUC,
    updateWebhookUC,
    deleteWebhookUC,
    testWebhookUC,
    triggerWebhookUC,
    listDeliveriesUC,
    getStatsUC,
    replayDeliveryUC
  );

  const routes = createWebhookRoutes(controller, deps.tokenService);

  return {
    routes,
    webhookRepository,
    deliveryRepository,
    repository: webhookRepository,
    controller,
  };
}
