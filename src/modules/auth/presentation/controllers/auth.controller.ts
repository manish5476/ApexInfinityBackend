import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { GetCurrentUserUseCase } from '../../application/use-cases/GetCurrentUserUseCase';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserByIdUseCase';
import { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { LogoutAllUseCase } from '../../application/use-cases/LogoutAllUseCase';
import { ForgotPasswordUseCase } from '../../application/use-cases/ForgotPasswordUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';
import { UpdateMyPasswordUseCase } from '../../application/use-cases/UpdateMyPasswordUseCase';
import { VerifyTokenUseCase } from '../../application/use-cases/VerifyTokenUseCase';
import { SendVerificationEmailUseCase } from '../../application/use-cases/SendVerificationEmailUseCase';
import { VerifyEmailUseCase } from '../../application/use-cases/VerifyEmailUseCase';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateMyPasswordSchema,
} from '../validators/auth.validator';
import { ApiResponseFactory } from '../../../../shared/contracts';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';
import { ValidationError } from '../../../../shared/errors';
import {
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  readRefreshToken,
  extractAccessToken,
  deviceFromRequest,
} from '../http/auth-cookies';

export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly logoutAllUseCase: LogoutAllUseCase,
    private readonly forgotPasswordUseCase: ForgotPasswordUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly updateMyPasswordUseCase: UpdateMyPasswordUseCase,
    private readonly verifyTokenUseCase: VerifyTokenUseCase,
    private readonly sendVerificationEmailUseCase: SendVerificationEmailUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    isProduction = false
  ) {
    this.isProduction = isProduction;
  }

  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = registerSchema.parse(req.body);
      const context = RequestContextHolder.get();

      const result = await this.registerUseCase.execute(
        {
          email: validated.email,
          password: validated.password,
          name: validated.name,
          organizationId: validated.organizationId,
          uniqueShopId: validated.uniqueShopId,
          phone: validated.phone,
          roles: validated.roles,
        },
        context
      );
      if (result.isFailure) {
        return next(result.getError());
      }

      const value = result.getValue();
      if (value.refreshToken) {
        setRefreshTokenCookie(res, value.refreshToken, this.isProduction);
      }

      res.status(201).json(ApiResponseFactory.success(value));
    } catch (err) {
      next(err);
    }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = loginSchema.parse(req.body);
      const context = RequestContextHolder.get();

      const result = await this.loginUseCase.execute(
        {
          ...validated,
          device: deviceFromRequest(req),
        },
        context
      );
      if (result.isFailure) {
        return next(result.getError());
      }

      const value = result.getValue();
      if (value.refreshToken) {
        setRefreshTokenCookie(res, value.refreshToken, this.isProduction);
      }

      res.status(200).json(ApiResponseFactory.success(value));
    } catch (err) {
      next(err);
    }
  };

  public refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.refreshTokenUseCase.execute({
        refreshToken: readRefreshToken(req),
      });
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = forgotPasswordSchema.parse(req.body);
      const result = await this.forgotPasswordUseCase.execute(validated);
      if (result.isFailure) {
        return next(result.getError());
      }
      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.params.token;
      if (!token) {
        throw new ValidationError('Reset token is required.');
      }
      const validated = resetPasswordSchema.parse(req.body);
      const result = await this.resetPasswordUseCase.execute({
        token,
        password: validated.password,
        device: deviceFromRequest(req),
      });
      if (result.isFailure) {
        return next(result.getError());
      }

      const value = result.getValue();
      if (value.refreshToken) {
        setRefreshTokenCookie(res, value.refreshToken, this.isProduction);
      }
      res.status(200).json(ApiResponseFactory.success(value));
    } catch (err) {
      next(err);
    }
  };

  public verifyToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.verifyTokenUseCase.execute({
        accessToken: extractAccessToken(req),
      });
      if (result.isFailure) {
        return next(result.getError());
      }
      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.params.token;
      if (!token) {
        throw new ValidationError('Verification token is required.');
      }
      const result = await this.verifyEmailUseCase.execute({ token });
      if (result.isFailure) {
        return next(result.getError());
      }
      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public updateMyPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = updateMyPasswordSchema.parse(req.body);
      const context = RequestContextHolder.get();
      const result = await this.updateMyPasswordUseCase.execute(
        {
          currentPassword: validated.passwordCurrent,
          newPassword: validated.password,
          accessToken: extractAccessToken(req),
        },
        context
      );
      if (result.isFailure) {
        return next(result.getError());
      }
      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public sendVerificationEmail = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const result = await this.sendVerificationEmailUseCase.execute(undefined, context);
      if (result.isFailure) {
        return next(result.getError());
      }
      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const result = await this.logoutUseCase.execute(
        {
          accessToken: extractAccessToken(req),
          refreshToken: readRefreshToken(req),
          userId: context?.userId,
        },
        context
      );
      if (result.isFailure) {
        return next(result.getError());
      }
      clearRefreshTokenCookie(res, this.isProduction);
      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public logoutAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const result = await this.logoutAllUseCase.execute(undefined, context);
      if (result.isFailure) {
        return next(result.getError());
      }
      clearRefreshTokenCookie(res, this.isProduction);
      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public me = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const result = await this.getCurrentUserUseCase.execute(undefined, context);
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id;
      if (!id) {
        throw new ValidationError('User ID is required.');
      }
      const context = RequestContextHolder.get();
      const result = await this.getUserByIdUseCase.execute({
        userId: id,
        organizationId: context?.organizationId,
      });
      if (result.isFailure) {
        return next(result.getError());
      }

      res.status(200).json(ApiResponseFactory.success(result.getValue()));
    } catch (err) {
      next(err);
    }
  };

  public listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = RequestContextHolder.get();
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const search = req.query.search as string | undefined;
      const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

      const result = await this.listUsersUseCase.execute({
        organizationId: context?.organizationId,
        isActive,
        search,
        pagination: { page, limit },
      });

      res.status(200).json(
        ApiResponseFactory.success(result.getValue().items, {
          page: result.getValue().page,
          limit: result.getValue().limit,
          total: result.getValue().total,
          totalPages: result.getValue().totalPages,
        })
      );
    } catch (err) {
      next(err);
    }
  };
}
