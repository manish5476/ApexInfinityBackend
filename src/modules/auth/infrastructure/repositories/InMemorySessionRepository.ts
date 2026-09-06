import { ISessionRepository } from '../../domain/ports/ISessionRepository';
import { AuthSession } from '../../domain/entities/AuthSession';

export class InMemorySessionRepository implements ISessionRepository {
  private readonly items: Map<string, AuthSession> = new Map();

  public async findById(id: string): Promise<AuthSession | null> {
    return this.items.get(id) || null;
  }

  public async findByAccessTokenHash(accessTokenHash: string): Promise<AuthSession | null> {
    for (const session of this.items.values()) {
      if (session.matchesAccessToken(accessTokenHash)) {
        return session;
      }
    }
    return null;
  }

  public async findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    for (const session of this.items.values()) {
      if (session.isValid && session.refreshTokenHash === refreshTokenHash) {
        return session;
      }
    }
    return null;
  }

  public async findValidByUserId(userId: string): Promise<AuthSession[]> {
    return Array.from(this.items.values()).filter((s) => s.userId === userId && s.isValid);
  }

  public async terminateAllForUser(userId: string, exceptSessionId?: string): Promise<number> {
    let count = 0;
    for (const session of this.items.values()) {
      if (session.userId === userId && session.isValid && session.id !== exceptSessionId) {
        session.terminate();
        this.items.set(session.id, session);
        count += 1;
      }
    }
    return count;
  }

  public async save(entity: AuthSession): Promise<AuthSession> {
    this.items.set(entity.id, entity);
    return entity;
  }

  public async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  public clear(): void {
    this.items.clear();
  }
}
