import { AggregateRoot } from '../../../../core/domain/AggregateRoot';
import { UserId } from '../value-objects/UserId';
import { EmailAddress } from '../../../../shared/value-objects/EmailAddress';
import { UserRegisteredEvent } from '../events/UserRegisteredEvent';
import { DomainError } from '../../../../shared/errors';

export interface UserProps {
  email: EmailAddress;
  passwordHash: string;
  name: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  phone?: string;
  emailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<string> {
  private _email: EmailAddress;
  private _passwordHash: string;
  private _name: string;
  private _organizationId?: string;
  private _roles: string[];
  private _permissions: string[];
  private _isActive: boolean;
  private _phone?: string;
  private _emailVerified: boolean;
  private _emailVerificationTokenHash?: string;
  private _emailVerificationExpires?: Date;
  private _passwordResetTokenHash?: string;
  private _passwordResetExpires?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(id: UserId, props: UserProps) {
    super(id.value);
    this._email = props.email;
    this._passwordHash = props.passwordHash;
    this._name = props.name;
    this._organizationId = props.organizationId;
    this._roles = props.roles;
    this._permissions = props.permissions;
    this._isActive = props.isActive;
    this._phone = props.phone;
    this._emailVerified = props.emailVerified;
    this._emailVerificationTokenHash = props.emailVerificationTokenHash;
    this._emailVerificationExpires = props.emailVerificationExpires;
    this._passwordResetTokenHash = props.passwordResetTokenHash;
    this._passwordResetExpires = props.passwordResetExpires;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public static create(params: {
    email: string;
    passwordHash: string;
    name: string;
    organizationId?: string;
    roles?: string[];
    permissions?: string[];
    phone?: string;
  }): User {
    if (!params.name || params.name.trim().length === 0) {
      throw new DomainError('User name cannot be empty.');
    }
    if (!params.passwordHash) {
      throw new DomainError('Password hash is required.');
    }

    const id = new UserId();
    const emailVo = EmailAddress.create(params.email);
    const now = new Date();

    const user = new User(id, {
      email: emailVo,
      passwordHash: params.passwordHash,
      name: params.name.trim(),
      organizationId: params.organizationId,
      roles: params.roles || ['user'],
      permissions: params.permissions || [],
      isActive: true,
      phone: params.phone,
      emailVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(
      new UserRegisteredEvent(id.value, emailVo.value, user.name, user.organizationId)
    );
    return user;
  }

  public static reconstitute(id: string, props: UserProps): User {
    return new User(new UserId(id), {
      ...props,
      emailVerified: props.emailVerified ?? false,
    });
  }

  public get email(): EmailAddress {
    return this._email;
  }

  public get passwordHash(): string {
    return this._passwordHash;
  }

  public get name(): string {
    return this._name;
  }

  public get organizationId(): string | undefined {
    return this._organizationId;
  }

  public get roles(): ReadonlyArray<string> {
    return this._roles;
  }

  public get permissions(): ReadonlyArray<string> {
    return this._permissions;
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get phone(): string | undefined {
    return this._phone;
  }

  public get emailVerified(): boolean {
    return this._emailVerified;
  }

  public get emailVerificationTokenHash(): string | undefined {
    return this._emailVerificationTokenHash;
  }

  public get emailVerificationExpires(): Date | undefined {
    return this._emailVerificationExpires;
  }

  public get passwordResetTokenHash(): string | undefined {
    return this._passwordResetTokenHash;
  }

  public get passwordResetExpires(): Date | undefined {
    return this._passwordResetExpires;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public changePassword(newPasswordHash: string): void {
    if (!newPasswordHash) {
      throw new DomainError('New password hash is required.');
    }
    this._passwordHash = newPasswordHash;
    this._updatedAt = new Date();
  }

  public requestPasswordReset(tokenHash: string, expiresAt: Date): void {
    if (!this._isActive) {
      throw new DomainError('Account is not active.');
    }
    this._passwordResetTokenHash = tokenHash;
    this._passwordResetExpires = expiresAt;
    this._updatedAt = new Date();
  }

  public clearPasswordReset(): void {
    this._passwordResetTokenHash = undefined;
    this._passwordResetExpires = undefined;
    this._updatedAt = new Date();
  }

  public applyPasswordReset(newPasswordHash: string, now = new Date()): void {
    if (!this._passwordResetTokenHash || !this._passwordResetExpires) {
      throw new DomainError('Password reset token is invalid or has expired.');
    }
    if (this._passwordResetExpires.getTime() <= now.getTime()) {
      throw new DomainError('Password reset token is invalid or has expired.');
    }
    this.changePassword(newPasswordHash);
    this.clearPasswordReset();
  }

  public requestEmailVerification(tokenHash: string, expiresAt: Date): void {
    if (this._emailVerified) {
      throw new DomainError('Email already verified.');
    }
    this._emailVerificationTokenHash = tokenHash;
    this._emailVerificationExpires = expiresAt;
    this._updatedAt = new Date();
  }

  public confirmEmailVerification(now = new Date()): void {
    if (!this._emailVerificationTokenHash || !this._emailVerificationExpires) {
      throw new DomainError('Invalid or expired verification token.');
    }
    if (this._emailVerificationExpires.getTime() <= now.getTime()) {
      throw new DomainError('Invalid or expired verification token.');
    }
    this._emailVerified = true;
    this._emailVerificationTokenHash = undefined;
    this._emailVerificationExpires = undefined;
    this._updatedAt = now;
  }

  public assignRoles(roles: string[]): void {
    this._roles = [...roles];
    this._updatedAt = new Date();
  }

  public assignPermissions(permissions: string[]): void {
    this._permissions = [...permissions];
    this._updatedAt = new Date();
  }

  public setOrganization(organizationId: string): void {
    this._organizationId = organizationId;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    if (!this._isActive) {
      throw new DomainError('User is already inactive.');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    if (this._isActive) {
      throw new DomainError('User is already active.');
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }
}
