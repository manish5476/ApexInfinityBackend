import { AuthSession } from '../../domain/entities/AuthSession';

export interface SessionPersistenceData {
  _id: string;
  userId: string;
  organizationId?: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  previousAccessTokenHash?: string;
  isValid: boolean;
  browser?: string;
  os?: string;
  deviceType?: string;
  ipAddress?: string;
  lastActivityAt: Date;
  lastTokenUpdateAt?: Date;
  terminatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class SessionMapper {
  public toDomain(raw: SessionPersistenceData): AuthSession {
    return AuthSession.reconstitute(raw._id, {
      userId: raw.userId,
      organizationId: raw.organizationId,
      accessTokenHash: raw.accessTokenHash,
      refreshTokenHash: raw.refreshTokenHash,
      previousAccessTokenHash: raw.previousAccessTokenHash,
      isValid: raw.isValid,
      browser: raw.browser,
      os: raw.os,
      deviceType: raw.deviceType,
      ipAddress: raw.ipAddress,
      lastActivityAt: raw.lastActivityAt,
      lastTokenUpdateAt: raw.lastTokenUpdateAt,
      terminatedAt: raw.terminatedAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public toPersistence(entity: AuthSession): SessionPersistenceData {
    return {
      _id: entity.id,
      userId: entity.userId,
      organizationId: entity.organizationId,
      accessTokenHash: entity.accessTokenHash,
      refreshTokenHash: entity.refreshTokenHash,
      previousAccessTokenHash: entity.previousAccessTokenHash,
      isValid: entity.isValid,
      browser: entity.browser,
      os: entity.os,
      deviceType: entity.deviceType,
      ipAddress: entity.ipAddress,
      lastActivityAt: entity.lastActivityAt,
      lastTokenUpdateAt: entity.lastTokenUpdateAt,
      terminatedAt: entity.terminatedAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
