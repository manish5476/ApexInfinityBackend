import { Router } from 'express';
import { Connection } from 'mongoose';
import { IAiChatRepository } from './domain/ports/IAiChatRepository';
import { InMemoryAiChatRepository } from './infrastructure/repositories/InMemoryAiChatRepository';
import { MongoAiChatRepository } from './infrastructure/repositories/MongoAiChatRepository';
import { AiChatUseCases } from './application/use-cases/AiChatUseCases';
import { AiAgentController } from './presentation/controllers/aiAgent.controller';
import { ChatController } from './presentation/controllers/chat.controller';
import { createAiAgentRouter } from './presentation/routes/aiAgent.routes';
import { createChatRouter } from './presentation/routes/chat.routes';

export interface AiAgentModule {
  aiAgentRouter: Router;
  chatRouter: Router;
  repository: IAiChatRepository;
  useCases: AiChatUseCases;
}

export function createAiAgentModule(deps: {
  connection: Connection;
  useInMemory?: boolean;
}): AiAgentModule {
  const repository: IAiChatRepository = deps.useInMemory
    ? new InMemoryAiChatRepository()
    : new MongoAiChatRepository();

  const useCases = new AiChatUseCases(repository);
  const aiAgentCtrl = new AiAgentController(useCases);
  const chatCtrl = new ChatController(useCases);

  const aiAgentRouter = createAiAgentRouter(aiAgentCtrl);
  const chatRouter = createChatRouter(chatCtrl);

  return {
    aiAgentRouter,
    chatRouter,
    repository,
    useCases,
  };
}
