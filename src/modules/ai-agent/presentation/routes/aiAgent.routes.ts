import { Router } from 'express';
import { AiAgentController } from '../controllers/aiAgent.controller';

export function createAiAgentRouter(ctrl: AiAgentController): Router {
  const router = Router();

  // AI Assistant Chat & Query
  router.post('/chat', ctrl.chat);
  router.post('/prompt', ctrl.chat);

  return router;
}
