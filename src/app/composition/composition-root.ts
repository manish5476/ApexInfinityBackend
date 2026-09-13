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
import { createMasterModule, MasterModule } from '../../modules/master';
import { createCollaborationModule, CollaborationModule } from '../../modules/collaboration';
import { createFieldServiceModule, FieldServiceModule } from '../../modules/field-service';
import { createMediaAssetsModule, MediaAssetsModule } from '../../modules/media-assets';
import { createLogisticsModule, LogisticsModule } from '../../modules/logistics';
import { createAdminPlatformModule, AdminPlatformModule } from '../../modules/admin-platform';
import { createAnalyticsModule, AnalyticsModule } from '../../modules/analytics';
import { createAiAgentModule, AiAgentModule } from '../../modules/ai-agent';
import { createChatModule, ChatModule } from '../../modules/chat';
import { createSearchModule, SearchModule } from '../../modules/search';
import { createSystemOpsModule, SystemOpsModule } from '../../modules/system-ops';
import { MongoUnitOfWork } from '../../infrastructure/database/MongoUnitOfWork';
import { ISocketService } from '../../infrastructure/socket';

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
  socketService?: ISocketService;
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
  master: MasterModule;
  collaboration: CollaborationModule;
  fieldService: FieldServiceModule;
  mediaAssets: MediaAssetsModule;
  logistics: LogisticsModule;
  adminPlatform: AdminPlatformModule;
  analytics: AnalyticsModule;
  aiAgent: AiAgentModule;
  chat: ChatModule;
  search: SearchModule;
  systemOps: SystemOpsModule;
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

  // Unit of Work factory for transactions across repositories
  const uowFactory = () => new MongoUnitOfWork(deps.connection, deps.logger);

  // 1. Health Module
  const health = createHealthModule({
    dbManager: deps.dbManager,
    cache: deps.cache,
  });

  // 2. Organization Module (Tenant management & branch isolation)
  const organization = createOrganizationModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 3. Auth & Identity Module
  const auth = createAuthModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    passwordHasher: deps.passwordHasher,
    emailSender: deps.emailSender,
    eventBus: deps.eventBus,
  });

  // 4. HRMS Suite
  const hrms = createHrmsModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 5. CRM Module
  const crm = createCrmModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
    uow: uowFactory(),
  });

  // 6. Inventory Module
  const inventory = createInventoryModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 7. Accounting & Financial Management Module
  const accounting = createAccountingModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 8. Storefront & E-Commerce Module
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

  // 11. Master Data & Dropdowns Module
  const master = createMasterModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 12. Collaboration Module (Notes, Tasks, Meetings)
  const collaboration = createCollaborationModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
    eventBus: deps.eventBus,
  });

  // 13. Field Service Module (Work Assignments)
  const fieldService = createFieldServiceModule({
    connection: deps.connection,
  });

  // 14. Media & Assets Module
  const mediaAssets = createMediaAssetsModule({
    connection: deps.connection,
  });

  // 15. Logistics Module
  const logistics = createLogisticsModule({
    connection: deps.connection,
  });

  // 16. Admin Platform Module
  const adminPlatform = createAdminPlatformModule({
    connection: deps.connection,
    tokenService: deps.tokenService,
  });

  // 17. Analytics & BI Module
  const analytics = createAnalyticsModule({
    connection: deps.connection,
  });

  // 18. Dedicated AI Agent Module (Intelligent Assistant & Tools)
  const aiAgent = createAiAgentModule({
    connection: deps.connection,
  });

  // 19. Dedicated Team Chat & Internal Discussion Module
  const chat = createChatModule({
    connection: deps.connection,
  });

  // 20. Global Multi-Entity Search Module
  const search = createSearchModule({
    tokenService: deps.tokenService,
  });

  // 21. System Operations Module (Cron, Logs, Dashboard)
  const systemOps = createSystemOpsModule({
    tokenService: deps.tokenService,
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
      master,
      collaboration,
      fieldService,
      mediaAssets,
      logistics,
      adminPlatform,
      analytics,
      aiAgent,
      chat,
      search,
      systemOps,
    },
  };
}
