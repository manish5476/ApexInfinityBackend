import { Router } from 'express';
import { Connection } from 'mongoose';
import { NotificationController } from './presentation/controllers/notification.controller';
import { createNotificationRoutes } from './presentation/routes/notification.routes';
import { InMemoryNotificationRepository } from './infrastructure/repositories/InMemoryNotificationRepository';
import { SendNotificationUseCase } from './application/use-cases/SendNotificationUseCase';
import { ListNotificationsUseCase } from './application/use-cases/ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from './application/use-cases/MarkNotificationReadUseCase';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';

export interface NotificationModule {
  routes: Router;
  repository: InMemoryNotificationRepository;
}

export function createNotificationModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
}): NotificationModule {
  const repository = new InMemoryNotificationRepository();

  const sendNotificationUC = new SendNotificationUseCase(repository, deps.eventBus);
  const listNotificationsUC = new ListNotificationsUseCase(repository);
  const markReadUC = new MarkNotificationReadUseCase(repository);

  const controller = new NotificationController(sendNotificationUC, listNotificationsUC, markReadUC);
  const routes = createNotificationRoutes(controller, deps.tokenService);

  return { routes, repository };
}
