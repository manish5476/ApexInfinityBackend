import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { SessionId } from '../value-objects/SessionId';
import { DomainError } from '../../../../shared/errors';

export interface AuthSessionProps {
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

export const ACCESS_TOKEN_ROTATION_GRACE_MS = 30_000;
export const MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthSession extends AggregateRoot<string> {
  private _userId: string;
  private _organizationId?: string;
  private _accessTokenHash: string;
  private _refreshTokenHash: string;
  private _previousAccessTokenHash?: string;
  private _isValid: boolean;
  private _browser?: string;
  private _os?: string;
  private _deviceType?: string;
  private _ipAddress?: string;
  private _lastActivityAt: Date;
  private _lastTokenUpdateAt?: Date;
  private _terminatedAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: SessionId, props: AuthSessionProps) {
    super(id.value);
    this._userId = props.userId;
    this._organizationId = props.organizationId;
    this._accessTokenHash = props.accessTokenHash;
    this._refreshTokenHash = props.refreshTokenHash;
    this._previousAccessTokenHash = props.previousAccessTokenHash;
    this._isValid = props.isValid;
    this._browser = props.browser;
    this._os = props.os;
    this._deviceType = props.deviceType;
    this._ipAddress = props.ipAddress;
    this._lastActivityAt = props.lastActivityAt;
    this._lastTokenUpdateAt = props.lastTokenUpdateAt;
    this._terminatedAt = props.terminatedAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    userId: string;
    organizationId?: string;
    accessTokenHash: string;
    refreshTokenHash: string;
    browser?: string;
    os?: string;
    deviceType?: string;
    ipAddress?: string;
  }): AuthSession {
    if (!params.userId) {
      throw new DomainError('Session userId is required.');
    }
    if (!params.accessTokenHash || !params.refreshTokenHash) {
      throw new DomainError('Session token hashes are required.');
    }

    const now = new Date();
    return new AuthSession(new SessionId(), {
      userId: params.userId,
      organizationId: params.organizationId,
      accessTokenHash: params.accessTokenHash,
      refreshTokenHash: params.refreshTokenHash,
      isValid: true,
      browser: params.browser,
      os: params.os,
      deviceType: params.deviceType,
      ipAddress: params.ipAddress,
      lastActivityAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static reconstitute(id: string, props: AuthSessionProps): AuthSession {
    return new AuthSession(new SessionId(id), props);
  }

  public get userId(): string {
    return this._userId;
  }
  public get organizationId(): string | undefined {
    return this._organizationId;
  }
  public get accessTokenHash(): string {
    return this._accessTokenHash;
  }
  public get refreshTokenHash(): string {
    return this._refreshTokenHash;
  }
  public get previousAccessTokenHash(): string | undefined {
    return this._previousAccessTokenHash;
  }
  public get isValid(): boolean {
    return this._isValid;
  }
  public get browser(): string | undefined {
    return this._browser;
  }
  public get os(): string | undefined {
    return this._os;
  }
  public get deviceType(): string | undefined {
    return this._deviceType;
  }
  public get ipAddress(): string | undefined {
    return this._ipAddress;
  }
  public get lastActivityAt(): Date {
    return this._lastActivityAt;
  }
  public get lastTokenUpdateAt(): Date | undefined {
    return this._lastTokenUpdateAt;
  }
  public get terminatedAt(): Date | undefined {
    return this._terminatedAt;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public isExpired(now = new Date(), maxAgeMs = MAX_SESSION_AGE_MS): boolean {
    return now.getTime() - this._createdAt.getTime() > maxAgeMs;
  }

  public matchesAccessToken(accessTokenHash: string, now = new Date()): boolean {
    if (!this._isValid) return false;
    if (this._accessTokenHash === accessTokenHash) return true;
    if (
      this._previousAccessTokenHash === accessTokenHash &&
      this._lastTokenUpdateAt &&
      now.getTime() - this._lastTokenUpdateAt.getTime() <= ACCESS_TOKEN_ROTATION_GRACE_MS
    ) {
      return true;
    }
    return false;
  }

  public rotateAccessToken(newAccessTokenHash: string, now = new Date()): void {
    if (!this._isValid) {
      throw new DomainError('Cannot rotate a terminated session.');
    }
    this._previousAccessTokenHash = this._accessTokenHash;
    this._accessTokenHash = newAccessTokenHash;
    this._lastTokenUpdateAt = now;
    this._lastActivityAt = now;
    this._updatedAt = now;
  }

  public touch(now = new Date()): void {
    this._lastActivityAt = now;
    this._updatedAt = now;
  }

  public terminate(now = new Date()): void {
    this._isValid = false;
    this._terminatedAt = now;
    this._accessTokenHash = 'revoked';
    this._refreshTokenHash = 'revoked';
    this._updatedAt = now;
  }
}
