import { Router } from 'express';
import { Connection } from 'mongoose';
import { WebhookController } from './presentation/controllers/webhook.controller';
import { createWebhookRoutes } from './presentation/routes/webhook.routes';
import { InMemoryWebhookRepository } from './infrastructure/repositories/InMemoryWebhookRepository';
import { RegisterWebhookUseCase } from './application/use-cases/RegisterWebhookUseCase';
import { ListWebhooksUseCase } from './application/use-cases/ListWebhooksUseCase';
import { TriggerWebhookDeliveriesUseCase } from './application/use-cases/TriggerWebhookDeliveriesUseCase';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';

export interface WebhookModule {
  routes: Router;
  repository: InMemoryWebhookRepository;
}

export function createWebhookModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
}): WebhookModule {
  const repository = new InMemoryWebhookRepository();

  const registerWebhookUC = new RegisterWebhookUseCase(repository);
  const listWebhooksUC = new ListWebhooksUseCase(repository);
  const triggerWebhookUC = new TriggerWebhookDeliveriesUseCase(repository, deps.eventBus);

  const controller = new WebhookController(registerWebhookUC, listWebhooksUC, triggerWebhookUC);
  const routes = createWebhookRoutes(controller, deps.tokenService);

  return { routes, repository };
}
