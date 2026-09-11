import { Router } from 'express';
import { ShipmentController } from '../controllers/shipment.controller';

export function createLogisticsRouter(ctrl: ShipmentController): Router {
  const router = Router();

  router.get('/operations/summary', ctrl.getOperationsSummary);

  router
    .route('/shipments')
    .get(ctrl.listShipments)
    .post(ctrl.createShipment);

  router
    .route('/shipments/:shipmentId')
    .get(ctrl.getShipment);

  router.patch('/shipments/:shipmentId/transition', ctrl.transitionShipment);

  return router;
}
