import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from './ITokenService';
import { UnauthorizedError } from '../../shared/errors';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly defaultExpiresIn: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  private readonly legacySecret?: string;
  private readonly legacyRefreshSecret?: string;

  constructor(
    secret: string,
    defaultExpiresIn = '1d',
    refreshSecret?: string,
    refreshExpiresIn = '90d',
    legacySecret?: string,
    legacyRefreshSecret?: string
  ) {
    this.secret = secret;
    this.defaultExpiresIn = defaultExpiresIn;
    this.refreshSecret = refreshSecret || secret;
    this.refreshExpiresIn = refreshExpiresIn;
    this.legacySecret = legacySecret || process.env.LEGACY_JWT_SECRET || 'manish5476-prod-secret-secure';
    this.legacyRefreshSecret = legacyRefreshSecret || process.env.LEGACY_REFRESH_TOKEN_SECRET || 'manishnehalsingh_db_user';
  }

  public generateToken(payload: TokenPayload, expiresIn?: string): string {
    const userId = payload.userId || (payload as any).id;
    return jwt.sign(
      {
        ...payload,
        userId,
        id: userId,
        sub: userId,
        type: 'merchant_user',
        tokenType: 'access',
      },
      this.secret,
      {
        expiresIn: (expiresIn || this.defaultExpiresIn) as jwt.SignOptions['expiresIn'],
      }
    );
  }

  public verifyToken<T extends TokenPayload = TokenPayload>(token: string): T {
    let decoded: any;
    try {
      decoded = jwt.verify(token, this.secret) as any;
    } catch (primaryErr) {
      if (primaryErr instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired. Please log in again.');
      }
      if (this.legacySecret) {
        try {
          decoded = jwt.verify(token, this.legacySecret) as any;
        } catch (legacyErr) {
          if (legacyErr instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Token has expired. Please log in again.');
          }
          throw new UnauthorizedError('Invalid authentication token.');
        }
      } else {
        throw new UnauthorizedError('Invalid authentication token.');
      }
    }

    if (decoded.tokenType === 'refresh') {
      throw new UnauthorizedError('Invalid authentication token.');
    }
    // Normalize legacy and framework user identity claims
    if (!decoded.userId && (decoded.id || decoded.sub)) {
      decoded.userId = decoded.id || decoded.sub;
    }
    if (!decoded.id && decoded.userId) {
      decoded.id = decoded.userId;
    }
    return decoded as T;
  }

  public generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      { userId: payload.userId, organizationId: payload.organizationId, tokenType: 'refresh' },
      this.refreshSecret,
      { expiresIn: this.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
    );
  }

  public verifyRefreshToken<T extends TokenPayload = TokenPayload>(token: string): T {
    let decoded: any;
    try {
      decoded = jwt.verify(token, this.refreshSecret) as any;
    } catch (primaryErr) {
      if (primaryErr instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired. Please login again.');
      }
      if (this.legacyRefreshSecret) {
        try {
          decoded = jwt.verify(token, this.legacyRefreshSecret) as any;
        } catch (legacyErr) {
          if (legacyErr instanceof jwt.TokenExpiredError) {
            throw new UnauthorizedError('Refresh token expired. Please login again.');
          }
          throw new UnauthorizedError('Invalid refresh token. Please login again.');
        }
      } else {
        throw new UnauthorizedError('Invalid refresh token. Please login again.');
      }
    }

    if (decoded.tokenType && decoded.tokenType !== 'refresh') {
      throw new UnauthorizedError('Invalid refresh token. Please login again.');
    }
    if (!decoded.userId && (decoded.id || decoded.sub)) {
      decoded.userId = decoded.id || decoded.sub;
    }
    if (!decoded.id && decoded.userId) {
      decoded.id = decoded.userId;
    }
    return decoded as T;
  }
}
