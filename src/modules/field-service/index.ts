import { Router } from 'express';
import { Connection } from 'mongoose';
import { IWorkAssignmentRepository } from './domain/ports/IWorkAssignmentRepository';
import { InMemoryWorkAssignmentRepository } from './infrastructure/repositories/InMemoryWorkAssignmentRepository';
import { MongoWorkAssignmentRepository } from './infrastructure/repositories/MongoWorkAssignmentRepository';
import { WorkAssignmentUseCases } from './application/use-cases/WorkAssignmentUseCases';
import { WorkAssignmentController } from './presentation/controllers/workAssignment.controller';
import { createFieldServiceRouter } from './presentation/routes/workAssignment.routes';

export interface FieldServiceModule {
  router: Router;
  repository: IWorkAssignmentRepository;
  useCases: WorkAssignmentUseCases;
}

export function createFieldServiceModule(deps: {
  connection: Connection;
  useInMemory?: boolean;
}): FieldServiceModule {
  const repository: IWorkAssignmentRepository = deps.useInMemory
    ? new InMemoryWorkAssignmentRepository()
    : new MongoWorkAssignmentRepository();

  const useCases = new WorkAssignmentUseCases(repository);
  const controller = new WorkAssignmentController(useCases);
  const router = createFieldServiceRouter(controller);

  return { router, repository, useCases };
}
