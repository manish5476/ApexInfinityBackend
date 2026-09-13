import { User } from '../../domain/entities/User';
import { UserResponseDto } from '../dto/AuthResultDto';
import { EmailAddress } from '../../../../shared/value-objects/EmailAddress';
import { IMapper } from '../../../../core/application/IMapper';

export interface UserPersistenceData {
  _id: string;
  email: string;
  password?: string;
  passwordHash?: string;
  name: string;
  organizationId?: string;
  branchId?: string;
  role?: string;
  roles: string[];
  permissions: string[];
  permissionOverrides?: any;
  isActive: boolean;
  isOwner?: boolean;
  isSuperAdmin?: boolean;
  status?: string;
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
  public toDomain(raw: any): User {
    const isOwner = Boolean(raw.isOwner);
    const isSuperAdmin = Boolean(raw.isSuperAdmin);

    // Ensure owner/superadmin roles and wildcard permissions are preserved
    const rolesSet = new Set<string>(raw.roles || ['user']);
    if (isOwner) {
      rolesSet.add('owner');
      rolesSet.add('superadmin');
    }
    if (isSuperAdmin) {
      rolesSet.add('superadmin');
    }
    const roles = Array.from(rolesSet);

    const permissions = (isOwner || isSuperAdmin)
      ? ['*']
      : (raw.permissions && raw.permissions.length > 0 ? raw.permissions : []);

    const effectivePasswordHash = raw.passwordHash || raw.password || '';

    return User.reconstitute(String(raw._id), {
      email: EmailAddress.create(raw.email),
      passwordHash: effectivePasswordHash,
      name: raw.name,
      organizationId: raw.organizationId ? String(raw.organizationId) : undefined,
      branchId: raw.branchId ? String(raw.branchId) : undefined,
      roles,
      permissions,
      isActive: raw.isActive ?? true,
      isOwner,
      isSuperAdmin,
      status: raw.status || 'approved',
      phone: raw.phone,
      emailVerified: raw.emailVerified ?? false,
      emailVerificationTokenHash: raw.emailVerificationTokenHash,
      emailVerificationExpires: raw.emailVerificationExpires,
      passwordResetTokenHash: raw.passwordResetTokenHash,
      passwordResetExpires: raw.passwordResetExpires,
      createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
    });
  }

  public toPersistence(entity: User): UserPersistenceData {
    return {
      _id: entity.id,
      email: entity.email.value,
      password: entity.passwordHash,
      passwordHash: entity.passwordHash,
      name: entity.name,
      organizationId: entity.organizationId,
      branchId: entity.branchId,
      roles: [...entity.roles],
      permissions: [...entity.permissions],
      isActive: entity.isActive,
      isOwner: entity.isOwner,
      isSuperAdmin: entity.isSuperAdmin,
      status: entity.status,
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
    const role = entity.isOwner || entity.roles.includes('owner')
      ? 'owner'
      : entity.isSuperAdmin || entity.roles.includes('superadmin')
      ? 'superadmin'
      : entity.roles[0] || 'user';

    return {
      id: entity.id,
      _id: entity.id,
      email: entity.email.value,
      name: entity.name,
      organizationId: entity.organizationId,
      branchId: entity.branchId,
      role,
      roles: [...entity.roles],
      permissions: [...entity.permissions],
      isActive: entity.isActive,
      isOwner: entity.isOwner,
      isSuperAdmin: entity.isSuperAdmin,
      status: entity.status,
      phone: entity.phone,
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
