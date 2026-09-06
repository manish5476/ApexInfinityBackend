import { Router } from 'express';
import { Connection } from 'mongoose';
import { CrmController } from './presentation/controllers/crm.controller';
import { createCrmRoutes, createCustomerRoutes } from './presentation/routes/crm.routes';
import { MongoCustomerRepository } from './infrastructure/repositories/MongoCustomerRepository';
import { MongoLeadRepository } from './infrastructure/repositories/MongoLeadRepository';
import { MongoOpportunityRepository } from './infrastructure/repositories/MongoOpportunityRepository';
import { CreateCustomerUseCase } from './application/use-cases/CreateCustomerUseCase';
import { ListCustomersUseCase } from './application/use-cases/ListCustomersUseCase';
import { GetCustomerByIdUseCase } from './application/use-cases/GetCustomerByIdUseCase';
import { UpdateCustomerUseCase } from './application/use-cases/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from './application/use-cases/DeleteCustomerUseCase';
import { RestoreCustomerUseCase } from './application/use-cases/RestoreCustomerUseCase';
import { UpdateCreditLimitUseCase } from './application/use-cases/UpdateCreditLimitUseCase';
import { AddGuarantorUseCase } from './application/use-cases/AddGuarantorUseCase';
import { RemoveGuarantorUseCase } from './application/use-cases/RemoveGuarantorUseCase';
import { GetGuaranteedCustomersUseCase } from './application/use-cases/GetGuaranteedCustomersUseCase';
import { SearchCustomersUseCase } from './application/use-cases/SearchCustomersUseCase';
import { CheckDuplicateCustomerUseCase } from './application/use-cases/CheckDuplicateCustomerUseCase';
import { CreateLeadUseCase } from './application/use-cases/CreateLeadUseCase';
import { ConvertLeadUseCase } from './application/use-cases/ConvertLeadUseCase';
import { CreateOpportunityUseCase } from './application/use-cases/CreateOpportunityUseCase';
import { UpdateOpportunityStageUseCase } from './application/use-cases/UpdateOpportunityStageUseCase';
import { ListOpportunitiesUseCase } from './application/use-cases/ListOpportunitiesUseCase';
import { ICustomerRepository } from './domain/ports/ICustomerRepository';
import { IOpportunityRepository } from './domain/ports/IOpportunityRepository';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';
import { IUnitOfWork } from '../../core/application/IUnitOfWork';

export interface CrmModule {
  routes: Router;
  customerRoutes: Router;
  customerRepo: ICustomerRepository;
  opportunityRepo: IOpportunityRepository;
}

export function createCrmModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  uow: IUnitOfWork;
}): CrmModule {
  // Repositories
  const customerRepo = new MongoCustomerRepository();
  const leadRepo = new MongoLeadRepository();
  const opportunityRepo = new MongoOpportunityRepository();

  // Use Cases
  const createCustomerUseCase = new CreateCustomerUseCase(customerRepo, deps.eventBus, deps.uow);
  const listCustomersUseCase = new ListCustomersUseCase(customerRepo);
  const getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepo);
  const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo, deps.uow);
  const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepo, deps.uow);
  const restoreCustomerUseCase = new RestoreCustomerUseCase(customerRepo, deps.uow);
  const updateCreditLimitUseCase = new UpdateCreditLimitUseCase(customerRepo, deps.uow);
  const addGuarantorUseCase = new AddGuarantorUseCase(customerRepo, deps.uow);
  const removeGuarantorUseCase = new RemoveGuarantorUseCase(customerRepo, deps.uow);
  const getGuaranteedCustomersUseCase = new GetGuaranteedCustomersUseCase(customerRepo);
  const searchCustomersUseCase = new SearchCustomersUseCase(customerRepo);
  const checkDuplicateCustomerUseCase = new CheckDuplicateCustomerUseCase(customerRepo);
  const createLeadUseCase = new CreateLeadUseCase(leadRepo, deps.uow);
  const convertLeadUseCase = new ConvertLeadUseCase(leadRepo, customerRepo, deps.eventBus, deps.uow);
  const createOpportunityUseCase = new CreateOpportunityUseCase(opportunityRepo, customerRepo, deps.uow);
  const updateOpportunityStageUseCase = new UpdateOpportunityStageUseCase(opportunityRepo, deps.eventBus, deps.uow);
  const listOpportunitiesUseCase = new ListOpportunitiesUseCase(opportunityRepo);

  // Controllers
  const crmController = new CrmController(
    createCustomerUseCase,
    listCustomersUseCase,
    getCustomerByIdUseCase,
    updateCustomerUseCase,
    deleteCustomerUseCase,
    restoreCustomerUseCase,
    updateCreditLimitUseCase,
    addGuarantorUseCase,
    removeGuarantorUseCase,
    getGuaranteedCustomersUseCase,
    searchCustomersUseCase,
    checkDuplicateCustomerUseCase,
    createLeadUseCase,
    convertLeadUseCase,
    createOpportunityUseCase,
    updateOpportunityStageUseCase,
    listOpportunitiesUseCase
  );

  // Routes
  const routes = createCrmRoutes(crmController, deps.tokenService);
  const customerRoutes = createCustomerRoutes(crmController, deps.tokenService);

  return { routes, customerRoutes, customerRepo, opportunityRepo };
}

