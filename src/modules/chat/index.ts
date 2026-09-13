import { Router } from 'express';
import { Connection } from 'mongoose';
import { IChatRepository } from './domain/ports/IChatRepository';
import { MongoChatRepository } from './infrastructure/repositories/MongoChatRepository';
import { ChatUseCases } from './application/use-cases/ChatUseCases';
import { ChatController } from './presentation/controllers/chat.controller';
import { createChatRouter } from './presentation/routes/chat.routes';

export interface ChatModule {
  chatRouter: Router;
  controller: ChatController;
  useCases: ChatUseCases;
  repository: IChatRepository;
}

export function createChatModule(deps: {
  connection?: Connection;
}): ChatModule {
  const repository: IChatRepository = new MongoChatRepository();
  const useCases = new ChatUseCases(repository);
  const controller = new ChatController(useCases);
  const chatRouter = createChatRouter(controller);

  return {
    chatRouter,
    controller,
    useCases,
    repository,
  };
}

export * from './domain/entities/Chat';
export * from './domain/ports/IChatRepository';
export * from './application/use-cases/ChatUseCases';
export * from './presentation/controllers/chat.controller';
export * from './presentation/routes/chat.routes';
