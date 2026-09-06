import { Connection } from 'mongoose';
import { EnvironmentConfig } from '../../config/environment';
import { ILogger } from '../../infrastructure/logging/ILogger';
import { ICache } from '../../infrastructure/cache/ICache';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';
import { MongoConnectionManager } from '../../infrastructure/database/MongoConnectionManager';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IPasswordHasher } from '../../infrastructure/security/IPasswordHasher';
import { IEmailSender } from '../../infrastructure/email/IEmailSender';
import { createHealthModule, HealthModule } from '../../modules/health';
import { createOrganizationModule, OrganizationModule } from '../../modules/organization';
import { createAuthModule, AuthModule } from '../../modules/auth';
import { createHrmsModule, HrmsModule } from '../../modules/hrms';
import { createCrmModule, CrmModule } from '../../modules/crm';
import { createInventoryModule, InventoryModule } from '../../modules/inventory';
import { createAccountingModule, AccountingModule } from '../../modules/accounting';
import { createStorefrontModule, StorefrontModule } from '../../modules/storefront';
import { createNotificationModule, NotificationModule } from '../../modules/notification';
import { createWebhookModule, WebhookModule } from '../../modules/webhook';
import { MongoUnitOfWork } from '../../infrastructure/database/MongoUnitOfWork';

export interface ApplicationDependencies {
  config: EnvironmentConfig;
  logger: ILogger;
  dbManager: MongoConnectionManager;
  connection: Connection;
  cache?: ICache;
  eventBus: IEventBus;
  tokenService: ITokenService;
  passwordHasher: IPasswordHasher;
  emailSender: IEmailSender;
}

export interface ApplicationModules {
  health: HealthModule;
  organization: OrganizationModule;
  auth: AuthModule;
  hrms: HrmsModule;
  crm: CrmModule;
  inventory: InventoryModule;
  accounting: AccountingModule;
  storefront: StorefrontModule;
  notification: NotificationModule;
  webhook: WebhookModule;
}

export interface ApplicationContainer {
  deps: ApplicationDependencies;
  modules: ApplicationModules;
}

/**
 * Global Composition Root.
 * Pure dependency injection: explicit constructor injection, zero service locator.
 */
export function buildApplicationContainer(deps: ApplicationDependencies): ApplicationContainer {
  deps.logger.info('[composition] Wiring application modules...');

  // 1. Health Module
  const health = createHealthModule({
    dbManager: deps.dbManager,
    cache: deps.cache,
  });

  // 2. Organization Module
  const organization = createOrganizationModule({
    connection: deps.connection,
    eventBus: deps.eventBus,
    tokenService: deps.tokenService,
  });

  // 3. Auth Module
  const auth = createAuthModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    passwordHasher: deps.passwordHasher,
    emailSender: deps.emailSender,
    eventBus: deps.eventBus,
    organizationRepo: organization.repository,
    accessTokenExpiresIn: deps.config.JWT_EXPIRES_IN,
    frontendUrl: deps.config.FRONTEND_URL,
    isProduction: deps.config.NODE_ENV === 'production',
  });

  // 4. HRMS Module
  const hrms = createHrmsModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    userRepo: auth.repository,
    eventBus: deps.eventBus,
  });

  // 5. CRM Module
  const uow = new MongoUnitOfWork(deps.connection, deps.logger);
  const crm = createCrmModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
    uow,
  });

  // 6. Inventory Module
  const inventory = createInventoryModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 7. Accounting Module
  const accounting = createAccountingModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 8. Storefront Module
  const storefront = createStorefrontModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 9. Notification Module
  const notification = createNotificationModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 10. Webhook Module
  const webhook = createWebhookModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  deps.logger.info('[composition] Application modules wired successfully.');

  return {
    deps,
    modules: {
      health,
      organization,
      auth,
      hrms,
      crm,
      inventory,
      accounting,
      storefront,
      notification,
      webhook,
    },
  };
}
