import { Router } from 'express';
import { Connection } from 'mongoose';
import { IMasterRepository } from './domain/ports/IMasterRepository';
import { IMasterTypeRepository } from './domain/ports/IMasterTypeRepository';
import { IDropdownRepository } from './domain/ports/IDropdownRepository';
import { MongoMasterRepository } from './infrastructure/repositories/MongoMasterRepository';
import { MongoMasterTypeRepository } from './infrastructure/repositories/MongoMasterTypeRepository';
import { MongoDropdownRepository } from './infrastructure/repositories/MongoDropdownRepository';
import { InMemoryMasterRepository } from './infrastructure/repositories/InMemoryMasterRepository';
import { InMemoryMasterTypeRepository } from './infrastructure/repositories/InMemoryMasterTypeRepository';
import { InMemoryDropdownRepository } from './infrastructure/repositories/InMemoryDropdownRepository';
import { MasterItemUseCases } from './application/use-cases/MasterItemUseCases';
import { MasterTypeUseCases } from './application/use-cases/MasterTypeUseCases';
import { MasterListUseCases } from './application/use-cases/MasterListUseCases';
import { DropdownUseCases } from './application/use-cases/DropdownUseCases';
import { MasterController } from './presentation/controllers/master.controller';
import { MasterTypeController } from './presentation/controllers/masterType.controller';
import { MasterListController } from './presentation/controllers/masterList.controller';
import { DropdownController } from './presentation/controllers/dropdown.controller';
import { createMasterRoutes } from './presentation/routes/master.routes';
import { createMasterTypeRoutes } from './presentation/routes/masterType.routes';
import { createMasterListRoutes } from './presentation/routes/masterList.routes';
import { createDropdownRoutes } from './presentation/routes/dropdown.routes';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';

export interface MasterModule {
  masterRoutes: Router;
  masterTypeRoutes: Router;
  masterListRoutes: Router;
  dropdownRoutes: Router;
  masterRepository: IMasterRepository;
  masterTypeRepository: IMasterTypeRepository;
  dropdownRepository: IDropdownRepository;
  masterController: MasterController;
  masterTypeController: MasterTypeController;
  masterListController: MasterListController;
  dropdownController: DropdownController;
}

export function createMasterModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  useInMemory?: boolean;
}): MasterModule {
  const masterRepository: IMasterRepository = deps.useInMemory
    ? new InMemoryMasterRepository()
    : new MongoMasterRepository();

  const masterTypeRepository: IMasterTypeRepository = deps.useInMemory
    ? new InMemoryMasterTypeRepository()
    : new MongoMasterTypeRepository();

  const dropdownRepository: IDropdownRepository = deps.useInMemory
    ? new InMemoryDropdownRepository()
    : new MongoDropdownRepository();

  const masterUseCases = new MasterItemUseCases(masterRepository);
  const masterTypeUseCases = new MasterTypeUseCases(masterTypeRepository);
  const masterListUseCases = new MasterListUseCases(dropdownRepository);
  const dropdownUseCases = new DropdownUseCases(dropdownRepository);

  const masterController = new MasterController(masterUseCases);
  const masterTypeController = new MasterTypeController(masterTypeUseCases);
  const masterListController = new MasterListController(masterListUseCases);
  const dropdownController = new DropdownController(dropdownUseCases);

  const masterRoutes = createMasterRoutes(masterController, deps.tokenService);
  const masterTypeRoutes = createMasterTypeRoutes(masterTypeController, deps.tokenService);
  const masterListRoutes = createMasterListRoutes(masterListController, deps.tokenService);
  const dropdownRoutes = createDropdownRoutes(dropdownController, deps.tokenService);

  return {
    masterRoutes,
    masterTypeRoutes,
    masterListRoutes,
    dropdownRoutes,
    masterRepository,
    masterTypeRepository,
    dropdownRepository,
    masterController,
    masterTypeController,
    masterListController,
    dropdownController,
  };
}
