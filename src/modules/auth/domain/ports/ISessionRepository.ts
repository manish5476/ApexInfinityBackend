import { AuthSession } from '../entities/AuthSession';
import { IRepository } from '../../../../core/domain/IRepository';

export interface ISessionRepository extends IRepository<AuthSession, string> {
  findByAccessTokenHash(accessTokenHash: string): Promise<AuthSession | null>;
  findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null>;
  findValidByUserId(userId: string): Promise<AuthSession[]>;
  terminateAllForUser(userId: string, exceptSessionId?: string): Promise<number>;
}
