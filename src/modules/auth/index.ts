import { Router } from 'express';
import { Connection } from 'mongoose';
import { getUserModel } from './infrastructure/persistence/user.model';
import { getSessionModel } from './infrastructure/persistence/session.model';
import { UserMapper } from './application/mappers/UserMapper';
import { SessionMapper } from './application/mappers/SessionMapper';
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { MongoSessionRepository } from './infrastructure/repositories/MongoSessionRepository';
import { IUserRepository } from './domain/ports/IUserRepository';
import { ISessionRepository } from './domain/ports/ISessionRepository';
import { IssueAuthSessionService } from './application/services/IssueAuthSessionService';
import { RegisterUserUseCase } from './application/use-cases/RegisterUserUseCase';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { GetCurrentUserUseCase } from './application/use-cases/GetCurrentUserUseCase';
import { GetUserByIdUseCase } from './application/use-cases/GetUserByIdUseCase';
import { ListUsersUseCase } from './application/use-cases/ListUsersUseCase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase';
import { LogoutAllUseCase } from './application/use-cases/LogoutAllUseCase';
import { ForgotPasswordUseCase } from './application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from './application/use-cases/ResetPasswordUseCase';
import { UpdateMyPasswordUseCase } from './application/use-cases/UpdateMyPasswordUseCase';
import { VerifyTokenUseCase } from './application/use-cases/VerifyTokenUseCase';
import { SendVerificationEmailUseCase } from './application/use-cases/SendVerificationEmailUseCase';
import { VerifyEmailUseCase } from './application/use-cases/VerifyEmailUseCase';
import { AuthController } from './presentation/controllers/auth.controller';
import { createAuthRoutes } from './presentation/routes/auth.routes';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IPasswordHasher } from '../../infrastructure/security/IPasswordHasher';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';
import { IEmailSender } from '../../infrastructure/email/IEmailSender';
import { IOrganizationRepository } from '../organization/domain/ports/IOrganizationRepository';

export * from './domain';
export * from './application';
export * from './infrastructure';
export * from './presentation';

export interface AuthModuleDependencies {
  connection: Connection;
  tokenService: ITokenService;
  passwordHasher: IPasswordHasher;
  emailSender: IEmailSender;
  eventBus?: IEventBus;
  organizationRepo?: IOrganizationRepository;
  repositoryOverride?: IUserRepository;
  sessionRepositoryOverride?: ISessionRepository;
  accessTokenExpiresIn?: string;
  frontendUrl?: string;
  isProduction?: boolean;
}

export interface AuthModule {
  repository: IUserRepository;
  sessionRepository: ISessionRepository;
  registerUseCase: RegisterUserUseCase;
  loginUseCase: LoginUseCase;
  getCurrentUserUseCase: GetCurrentUserUseCase;
  getUserByIdUseCase: GetUserByIdUseCase;
  listUsersUseCase: ListUsersUseCase;
  controller: AuthController;
  routes: Router;
}

export function createAuthModule(deps: AuthModuleDependencies): AuthModule {
  const mapper = new UserMapper();
  const sessionMapper = new SessionMapper();
  const accessTokenExpiresIn = deps.accessTokenExpiresIn || '15m';
  const frontendUrl = deps.frontendUrl || 'http://localhost:4200';

  let repository: IUserRepository;
  if (deps.repositoryOverride) {
    repository = deps.repositoryOverride;
  } else {
    const model = getUserModel(deps.connection);
    repository = new MongoUserRepository(model, mapper);
  }

  let sessionRepository: ISessionRepository;
  if (deps.sessionRepositoryOverride) {
    sessionRepository = deps.sessionRepositoryOverride;
  } else {
    const sessionModel = getSessionModel(deps.connection);
    sessionRepository = new MongoSessionRepository(sessionModel, sessionMapper);
  }

  const issueSession = new IssueAuthSessionService(
    sessionRepository,
    deps.tokenService,
    accessTokenExpiresIn
  );

  const registerUseCase = new RegisterUserUseCase(
    repository,
    mapper,
    deps.passwordHasher,
    issueSession,
    deps.eventBus,
    deps.organizationRepo
  );

  const loginUseCase = new LoginUseCase(
    repository,
    mapper,
    deps.passwordHasher,
    issueSession,
    deps.organizationRepo
  );

  const getCurrentUserUseCase = new GetCurrentUserUseCase(repository, mapper);
  const getUserByIdUseCase = new GetUserByIdUseCase(repository, mapper);
  const listUsersUseCase = new ListUsersUseCase(repository, mapper);
  const refreshTokenUseCase = new RefreshTokenUseCase(
    repository,
    sessionRepository,
    deps.tokenService,
    accessTokenExpiresIn
  );
  const logoutUseCase = new LogoutUseCase(sessionRepository);
  const logoutAllUseCase = new LogoutAllUseCase(sessionRepository);
  const forgotPasswordUseCase = new ForgotPasswordUseCase(
    repository,
    deps.emailSender,
    frontendUrl
  );
  const resetPasswordUseCase = new ResetPasswordUseCase(
    repository,
    sessionRepository,
    deps.passwordHasher,
    mapper,
    issueSession
  );
  const updateMyPasswordUseCase = new UpdateMyPasswordUseCase(
    repository,
    sessionRepository,
    deps.passwordHasher,
    deps.tokenService
  );
  const verifyTokenUseCase = new VerifyTokenUseCase(
    repository,
    sessionRepository,
    deps.tokenService,
    mapper
  );
  const sendVerificationEmailUseCase = new SendVerificationEmailUseCase(
    repository,
    deps.emailSender,
    frontendUrl
  );
  const verifyEmailUseCase = new VerifyEmailUseCase(repository);

  const controller = new AuthController(
    registerUseCase,
    loginUseCase,
    getCurrentUserUseCase,
    getUserByIdUseCase,
    listUsersUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    logoutAllUseCase,
    forgotPasswordUseCase,
    resetPasswordUseCase,
    updateMyPasswordUseCase,
    verifyTokenUseCase,
    sendVerificationEmailUseCase,
    verifyEmailUseCase,
    deps.isProduction
  );

  const routes = createAuthRoutes(controller, deps.tokenService);

  return {
    repository,
    sessionRepository,
    registerUseCase,
    loginUseCase,
    getCurrentUserUseCase,
    getUserByIdUseCase,
    listUsersUseCase,
    controller,
    routes,
  };
}
