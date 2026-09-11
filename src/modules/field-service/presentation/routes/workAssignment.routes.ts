import { Router } from 'express';
import { WorkAssignmentController } from '../controllers/workAssignment.controller';

/**
 * Field Service routes.
 * Mounted at: /api/v1/field-service/work-assignments
 *
 * Mirrors the legacy workAssignment.routes.js exactly:
 *   GET    /stats
 *   GET    /sla-at-risk
 *   GET    /calendar
 *   GET    /series/:seriesId
 *   GET    /
 *   POST   /
 *   GET    /:id
 *   PATCH  /:id
 *   PATCH  /:id/status
 *   POST   /:id/complete
 */
export function createFieldServiceRouter(ctrl: WorkAssignmentController): Router {
  const router = Router();

  // ── Analytics & SLA (before /:id to avoid param capture) ──────────────────
  router.get('/stats',       ctrl.getStats);
  router.get('/sla-at-risk', ctrl.getSlaAtRisk);

  // ── Calendar ──────────────────────────────────────────────────────────────
  router.get('/calendar',   ctrl.getCalendarRange);

  // ── Series ────────────────────────────────────────────────────────────────
  router.get('/series/:seriesId', ctrl.getSeries);

  // ── CRUD ──────────────────────────────────────────────────────────────────
  router.route('/')
    .get( ctrl.getAllWorkAssignments)
    .post(ctrl.createWorkAssignment);

  router.route('/:id')
    .get(  ctrl.getWorkAssignment)
    .patch(ctrl.updateWorkAssignment);

  // ── Status transition ─────────────────────────────────────────────────────
  router.patch('/:id/status',   ctrl.updateStatus);

  // ── Completion ────────────────────────────────────────────────────────────
  router.post('/:id/complete',  ctrl.completeWorkAssignment);

  return router;
}
