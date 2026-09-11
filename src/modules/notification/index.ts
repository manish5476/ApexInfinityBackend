import { Router } from 'express';
import { Connection } from 'mongoose';
import { NotificationController } from './presentation/controllers/notification.controller';
import { createNotificationRoutes } from './presentation/routes/notification.routes';
import { AnnouncementController } from './presentation/controllers/announcement.controller';
import { createAnnouncementRoutes } from './presentation/routes/announcement.routes';
import { INotificationRepository } from './domain/ports/INotificationRepository';
import { IAnnouncementRepository } from './domain/ports/IAnnouncementRepository';
import { MongoNotificationRepository } from './infrastructure/repositories/MongoNotificationRepository';
import { MongoAnnouncementRepository } from './infrastructure/repositories/MongoAnnouncementRepository';
import { InMemoryNotificationRepository } from './infrastructure/repositories/InMemoryNotificationRepository';
import { InMemoryAnnouncementRepository } from './infrastructure/repositories/InMemoryAnnouncementRepository';
import { SendNotificationUseCase } from './application/use-cases/SendNotificationUseCase';
import { ListNotificationsUseCase } from './application/use-cases/ListNotificationsUseCase';
import { MarkNotificationReadUseCase } from './application/use-cases/MarkNotificationReadUseCase';
import { GetNotificationStatsUseCase } from './application/use-cases/GetNotificationStatsUseCase';
import { GetUnreadCountUseCase } from './application/use-cases/GetUnreadCountUseCase';
import { DeleteNotificationUseCase } from './application/use-cases/DeleteNotificationUseCase';
import { AnnouncementUseCases } from './application/use-cases/AnnouncementUseCases';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';

export interface NotificationModule {
  routes: Router;
  announcementRoutes: Router;
  notificationRepository: INotificationRepository;
  announcementRepository: IAnnouncementRepository;
  controller: NotificationController;
  announcementController: AnnouncementController;
}

export function createNotificationModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  useInMemory?: boolean;
}): NotificationModule {
  const notificationRepository: INotificationRepository = deps.useInMemory
    ? new InMemoryNotificationRepository()
    : new MongoNotificationRepository();

  const announcementRepository: IAnnouncementRepository = deps.useInMemory
    ? new InMemoryAnnouncementRepository()
    : new MongoAnnouncementRepository();

  const sendNotificationUC = new SendNotificationUseCase(notificationRepository, deps.eventBus);
  const listNotificationsUC = new ListNotificationsUseCase(notificationRepository);
  const markReadUC = new MarkNotificationReadUseCase(notificationRepository);
  const getStatsUC = new GetNotificationStatsUseCase(notificationRepository);
  const getUnreadCountUC = new GetUnreadCountUseCase(notificationRepository);
  const deleteNotificationUC = new DeleteNotificationUseCase(notificationRepository);

  const announcementUseCases = new AnnouncementUseCases(announcementRepository);

  const controller = new NotificationController(
    sendNotificationUC,
    listNotificationsUC,
    markReadUC,
    getStatsUC,
    getUnreadCountUC,
    deleteNotificationUC
  );

  const announcementController = new AnnouncementController(announcementUseCases);

  const routes = createNotificationRoutes(controller, deps.tokenService);
  const announcementRoutes = createAnnouncementRoutes(announcementController, deps.tokenService);

  return {
    routes,
    announcementRoutes,
    notificationRepository,
    announcementRepository,
    controller,
    announcementController,
  };
}
