import { Router } from 'express';
import { Connection } from 'mongoose';
import { IShipmentRepository } from './domain/ports/IShipmentRepository';
import { InMemoryShipmentRepository } from './infrastructure/repositories/InMemoryShipmentRepository';
import { MongoShipmentRepository } from './infrastructure/repositories/MongoShipmentRepository';
import { ShipmentUseCases } from './application/use-cases/ShipmentUseCases';
import { ShipmentController } from './presentation/controllers/shipment.controller';
import { createLogisticsRouter } from './presentation/routes/logistics.routes';

export interface LogisticsModule {
  router: Router;
  repository: IShipmentRepository;
  useCases: ShipmentUseCases;
  controller: ShipmentController;
}

export function createLogisticsModule(deps: {
  connection: Connection;
  useInMemory?: boolean;
}): LogisticsModule {
  const repository: IShipmentRepository = deps.useInMemory
    ? new InMemoryShipmentRepository()
    : new MongoShipmentRepository();

  const useCases = new ShipmentUseCases(repository);
  const controller = new ShipmentController(useCases);
  const router = createLogisticsRouter(controller);

  return {
    router,
    repository,
    useCases,
    controller,
  };
}
