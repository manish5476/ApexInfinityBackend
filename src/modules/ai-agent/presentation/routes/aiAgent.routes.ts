import { Router } from 'express';
import { AiAgentController } from '../controllers/aiAgent.controller';

export function createAiAgentRouter(ctrl: AiAgentController): Router {
  const router = Router();

  router.post('/chat', ctrl.chat);

  return router;
}
