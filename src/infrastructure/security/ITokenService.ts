export interface TokenPayload {
  userId: string;
  organizationId?: string;
  roles?: string[];
  permissions?: string[];
  tokenType?: 'access' | 'refresh';
  [key: string]: unknown;
}

export interface ITokenService {
  generateToken(payload: TokenPayload, expiresIn?: string): string;
  verifyToken<T extends TokenPayload = TokenPayload>(token: string): T;
  generateRefreshToken(payload: TokenPayload): string;
  verifyRefreshToken<T extends TokenPayload = TokenPayload>(token: string): T;
}
