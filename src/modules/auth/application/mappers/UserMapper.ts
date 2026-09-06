import { User } from '../../domain/entities/User';
import { UserResponseDto } from '../dto/AuthResultDto';
import { EmailAddress } from '../../../../shared/value-objects/EmailAddress';
import { IMapper } from '../../../../core/application/IMapper';

export interface UserPersistenceData {
  _id: string;
  email: string;
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

export class UserMapper implements IMapper<User, UserPersistenceData, UserResponseDto> {
  public toDomain(raw: UserPersistenceData): User {
    return User.reconstitute(raw._id, {
      email: EmailAddress.create(raw.email),
      passwordHash: raw.passwordHash,
      name: raw.name,
      organizationId: raw.organizationId,
      roles: raw.roles || ['user'],
      permissions: raw.permissions || [],
      isActive: raw.isActive,
      phone: raw.phone,
      emailVerified: raw.emailVerified ?? false,
      emailVerificationTokenHash: raw.emailVerificationTokenHash,
      emailVerificationExpires: raw.emailVerificationExpires,
      passwordResetTokenHash: raw.passwordResetTokenHash,
      passwordResetExpires: raw.passwordResetExpires,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  public toPersistence(entity: User): UserPersistenceData {
    return {
      _id: entity.id,
      email: entity.email.value,
      passwordHash: entity.passwordHash,
      name: entity.name,
      organizationId: entity.organizationId,
      roles: [...entity.roles],
      permissions: [...entity.permissions],
      isActive: entity.isActive,
      phone: entity.phone,
      emailVerified: entity.emailVerified,
      emailVerificationTokenHash: entity.emailVerificationTokenHash,
      emailVerificationExpires: entity.emailVerificationExpires,
      passwordResetTokenHash: entity.passwordResetTokenHash,
      passwordResetExpires: entity.passwordResetExpires,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  public toDto(entity: User): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email.value,
      name: entity.name,
      organizationId: entity.organizationId,
      roles: [...entity.roles],
      permissions: [...entity.permissions],
      isActive: entity.isActive,
      phone: entity.phone,
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
