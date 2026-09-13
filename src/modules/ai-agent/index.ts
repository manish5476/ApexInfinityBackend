import { Router } from 'express';
import { Connection } from 'mongoose';
import { AiAgentUseCases } from './application/use-cases/AiAgentUseCases';
import { AiAgentController } from './presentation/controllers/aiAgent.controller';
import { createAiAgentRouter } from './presentation/routes/aiAgent.routes';

export interface AiAgentModule {
  aiAgentRouter: Router;
  controller: AiAgentController;
  useCases: AiAgentUseCases;
}

export function createAiAgentModule(deps: {
  connection?: Connection;
}): AiAgentModule {
  const useCases = new AiAgentUseCases();
  const controller = new AiAgentController(useCases);
  const aiAgentRouter = createAiAgentRouter(controller);

  return {
    aiAgentRouter,
    controller,
    useCases,
  };
}

export * from './domain/entities/AiAgent';
export * from './application/use-cases/AiAgentUseCases';
export * from './application/tools/AgentTools';
export * from './presentation/controllers/aiAgent.controller';
export * from './presentation/routes/aiAgent.routes';
