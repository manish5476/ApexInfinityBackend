import { User } from '../../domain/entities/User';
import { AuthSession } from '../../domain/entities/AuthSession';
import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { hashToken } from '../../../../infrastructure/security/hashToken';
import { DeviceMeta } from '../dto/AuthResultDto';

export interface IssuedAuthTokens {
  accessToken: string;
  refreshToken: string;
  session: AuthSession;
}

export class IssueAuthSessionService {
  private readonly sessionRepo: ISessionRepository;
  private readonly tokenService: ITokenService;
  private readonly accessTokenExpiresIn: string;

  constructor(
    sessionRepo: ISessionRepository,
    tokenService: ITokenService,
    accessTokenExpiresIn = '15m'
  ) {
    this.sessionRepo = sessionRepo;
    this.tokenService = tokenService;
    this.accessTokenExpiresIn = accessTokenExpiresIn;
  }

  public get expiresIn(): string {
    return this.accessTokenExpiresIn;
  }

  public async issue(user: User, device?: DeviceMeta): Promise<IssuedAuthTokens> {
    const accessToken = this.tokenService.generateToken({
      userId: user.id,
      organizationId: user.organizationId,
      roles: [...user.roles],
      permissions: [...user.permissions],
    });
    const refreshToken = this.tokenService.generateRefreshToken({
      userId: user.id,
      organizationId: user.organizationId,
    });

    const session = AuthSession.create({
      userId: user.id,
      organizationId: user.organizationId,
      accessTokenHash: hashToken(accessToken),
      refreshTokenHash: hashToken(refreshToken),
      browser: device?.browser,
      os: device?.os,
      deviceType: device?.deviceType,
      ipAddress: device?.ipAddress,
    });

    await this.sessionRepo.save(session);
    return { accessToken, refreshToken, session };
  }
}
