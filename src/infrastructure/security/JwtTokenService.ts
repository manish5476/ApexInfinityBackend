import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from './ITokenService';
import { UnauthorizedError } from '../../shared/errors';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly defaultExpiresIn: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor(
    secret: string,
    defaultExpiresIn = '1d',
    refreshSecret?: string,
    refreshExpiresIn = '90d'
  ) {
    this.secret = secret;
    this.defaultExpiresIn = defaultExpiresIn;
    this.refreshSecret = refreshSecret || secret;
    this.refreshExpiresIn = refreshExpiresIn;
  }

  public generateToken(payload: TokenPayload, expiresIn?: string): string {
    return jwt.sign({ ...payload, tokenType: 'access' }, this.secret, {
      expiresIn: (expiresIn || this.defaultExpiresIn) as jwt.SignOptions['expiresIn'],
    });
  }

  public verifyToken<T extends TokenPayload = TokenPayload>(token: string): T {
    try {
      const decoded = jwt.verify(token, this.secret) as T;
      if (decoded.tokenType === 'refresh') {
        throw new UnauthorizedError('Invalid authentication token.');
      }
      return decoded;
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token has expired. Please log in again.');
      }
      throw new UnauthorizedError('Invalid authentication token.');
    }
  }

  public generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(
      { userId: payload.userId, organizationId: payload.organizationId, tokenType: 'refresh' },
      this.refreshSecret,
      { expiresIn: this.refreshExpiresIn as jwt.SignOptions['expiresIn'] }
    );
  }

  public verifyRefreshToken<T extends TokenPayload = TokenPayload>(token: string): T {
    try {
      const decoded = jwt.verify(token, this.refreshSecret) as T;
      if (decoded.tokenType && decoded.tokenType !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token. Please login again.');
      }
      return decoded;
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        throw err;
      }
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired. Please login again.');
      }
      throw new UnauthorizedError('Invalid refresh token. Please login again.');
    }
  }
}
