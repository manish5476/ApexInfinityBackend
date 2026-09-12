import { Router } from 'express';
import { CronController } from './presentation/controllers/cron.controller';
import { createCronRoutes } from './presentation/routes/cron.routes';
import { LogController } from './presentation/controllers/log.controller';
import { createLogRoutes } from './presentation/routes/log.routes';
import { DashboardController } from './presentation/controllers/dashboard.controller';
import { createDashboardRoutes } from './presentation/routes/dashboard.routes';
import { ITokenService } from '../../infrastructure/security/ITokenService';

export interface SystemOpsModuleDependencies {
  tokenService?: ITokenService;
}

export interface SystemOpsModule {
  cronController: CronController;
  logController: LogController;
  dashboardController: DashboardController;
  cronRoutes: Router;
  logRoutes: Router;
  dashboardRoutes: Router;
}

export function createSystemOpsModule(deps: SystemOpsModuleDependencies = {}): SystemOpsModule {
  const cronController = new CronController();
  const logController = new LogController();
  const dashboardController = new DashboardController();

  const cronRoutes = createCronRoutes(cronController, deps.tokenService);
  const logRoutes = createLogRoutes(logController, deps.tokenService);
  const dashboardRoutes = createDashboardRoutes(dashboardController, deps.tokenService);

  return {
    cronController,
    logController,
    dashboardController,
    cronRoutes,
    logRoutes,
    dashboardRoutes,
  };
}
