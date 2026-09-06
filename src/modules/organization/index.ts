import { Router } from 'express';
import { Connection } from 'mongoose';
import { getOrganizationModel } from './infrastructure/persistence/organization.model';
import { getBranchModel } from './infrastructure/persistence/branch.model';
import { OrganizationMapper } from './application/mappers/OrganizationMapper';
import { MongoOrganizationRepository } from './infrastructure/repositories/MongoOrganizationRepository';
import { InMemoryBranchRepository } from './infrastructure/repositories/InMemoryBranchRepository';
import { IOrganizationRepository } from './domain/ports/IOrganizationRepository';
import { IBranchRepository } from './domain/ports/IBranchRepository';
import { CreateOrganizationUseCase } from './application/use-cases/CreateOrganizationUseCase';
import { GetOrganizationByIdUseCase } from './application/use-cases/GetOrganizationByIdUseCase';
import { UpdateOrganizationUseCase } from './application/use-cases/UpdateOrganizationUseCase';
import { GetMyOrganizationUseCase } from './application/use-cases/GetMyOrganizationUseCase';
import { CreateBranchUseCase } from './application/use-cases/CreateBranchUseCase';
import { ListBranchesUseCase } from './application/use-cases/ListBranchesUseCase';
import { GetBranchByIdUseCase } from './application/use-cases/GetBranchByIdUseCase';
import { UpdateBranchUseCase } from './application/use-cases/UpdateBranchUseCase';
import { DeleteBranchUseCase } from './application/use-cases/DeleteBranchUseCase';
import { OrganizationController } from './presentation/organization.controller';
import { BranchController } from './presentation/branch.controller';
import { createOrganizationRoutes } from './presentation/organization.routes';
import { createBranchRoutes } from './presentation/branch.routes';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';
import { ITokenService } from '../../infrastructure/security/ITokenService';

export * from './domain';
export * from './application';
export * from './infrastructure';
export * from './presentation';

export interface OrganizationModuleDependencies {
  connection: Connection;
  eventBus?: IEventBus;
  tokenService?: ITokenService;
  repositoryOverride?: IOrganizationRepository;
  branchRepoOverride?: IBranchRepository;
}

export interface OrganizationModule {
  repository: IOrganizationRepository;
  branchRepository: IBranchRepository;
  createUseCase: CreateOrganizationUseCase;
  getByIdUseCase: GetOrganizationByIdUseCase;
  updateUseCase: UpdateOrganizationUseCase;
  controller: OrganizationController;
  routes: Router;
  branchRoutes: Router;
}

export function createOrganizationModule(deps: OrganizationModuleDependencies): OrganizationModule {
  const mapper = new OrganizationMapper();

  let repository: IOrganizationRepository;
  if (deps.repositoryOverride) {
    repository = deps.repositoryOverride;
  } else {
    const model = getOrganizationModel(deps.connection);
    repository = new MongoOrganizationRepository(model, mapper);
  }

  const branchRepository = deps.branchRepoOverride || new InMemoryBranchRepository();

  const createUseCase = new CreateOrganizationUseCase(repository, mapper, deps.eventBus);
  const getByIdUseCase = new GetOrganizationByIdUseCase(repository, mapper);
  const updateUseCase = new UpdateOrganizationUseCase(repository);
  const getMyOrgUseCase = new GetMyOrganizationUseCase(repository);

  const createBranchUseCase = new CreateBranchUseCase(branchRepository);
  const listBranchesUseCase = new ListBranchesUseCase(branchRepository);
  const getBranchByIdUseCase = new GetBranchByIdUseCase(branchRepository);
  const updateBranchUseCase = new UpdateBranchUseCase(branchRepository);
  const deleteBranchUseCase = new DeleteBranchUseCase(branchRepository);

  const controller = new OrganizationController(createUseCase, getByIdUseCase, updateUseCase, getMyOrgUseCase, repository);
  const branchController = new BranchController(
    createBranchUseCase,
    listBranchesUseCase,
    getBranchByIdUseCase,
    updateBranchUseCase,
    deleteBranchUseCase
  );

  const routes = createOrganizationRoutes(controller, deps.tokenService);
  const dummyTokenService: ITokenService = deps.tokenService || {
    generateToken: () => '',
    generateRefreshToken: () => '',
    verifyToken: () => ({} as any),
    verifyRefreshToken: () => ({} as any),
  };
  const branchRoutes = createBranchRoutes(branchController, dummyTokenService);

  return {
    repository,
    branchRepository,
    createUseCase,
    getByIdUseCase,
    updateUseCase,
    controller,
    routes,
    branchRoutes,
  };
}
