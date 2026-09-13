import { Connection } from 'mongoose';
import crypto from 'crypto';
import { getUserModel, UserDocument } from '../../../auth/infrastructure/persistence/user.model';
import { getRoleModel } from '../../../auth/infrastructure/persistence/role.model';
import { getEmployeeModel } from '../../../hrms/infrastructure/persistence/employee.model';
import { IOrganizationRepository } from '../../domain/ports/IOrganizationRepository';
import { IPasswordHasher } from '../../../../infrastructure/security/IPasswordHasher';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../../../shared/errors';

export interface InviteUserParams {
  orgId: string;
  email: string;
  name: string;
  role: string;
  phone?: string;
}

export class OrganizationMemberService {
  constructor(private readonly connection: Connection) {}

  public async getMembers(orgId: string): Promise<unknown[]> {
    const UserModel = getUserModel(this.connection);
    return UserModel.find({ organizationId: orgId, status: { $ne: 'rejected' } })
      .populate('roles')
      .lean();
  }

  public async lookupOrganizationsByEmail(
    email: string,
    orgRepo: IOrganizationRepository
  ): Promise<Array<{ name: string; uniqueShopId?: string }>> {
    const UserModel = getUserModel(this.connection);
    const users = await UserModel.find({ email }).lean();

    const organizations: Array<{ name: string; uniqueShopId?: string }> = [];
    const orgIds = [...new Set(users.map((u: any) => u.organizationId).filter(Boolean))];

    for (const orgId of orgIds) {
      const org = await orgRepo.findById(orgId as string);
      if (org) {
        organizations.push({ name: org.name, uniqueShopId: org.uniqueShopId });
      }
    }

    return organizations;
  }

  public async getPendingMembers(orgId: string): Promise<unknown[]> {
    const UserModel = getUserModel(this.connection);
    return UserModel.find({ organizationId: orgId, status: 'pending' })
      .select('name email phone createdAt status')
      .sort({ createdAt: -1 })
      .lean();
  }

  public async approveMember(
    orgId: string,
    userId: string,
    roleId: string,
    branchId?: string
  ): Promise<unknown> {
    const UserModel = getUserModel(this.connection);
    const user = await UserModel.findOne({ _id: userId, organizationId: orgId, status: 'pending' });
    if (!user) {
      throw new NotFoundError('Pending user not found in this organization');
    }

    const RoleModel = getRoleModel(this.connection);
    const role = await RoleModel.findOne({ _id: roleId, organizationId: orgId });
    if (!role) {
      throw new BadRequestError('Invalid role for this organization');
    }

    user.status = 'approved';
    user.roles = [roleId];
    if (branchId) {
      (user as unknown as { branchId: string }).branchId = branchId;
    }

    await user.save();
    return user.toObject();
  }

  public async rejectMember(orgId: string, userId: string): Promise<void> {
    const UserModel = getUserModel(this.connection);
    const result = await UserModel.deleteOne({ _id: userId, organizationId: orgId, status: 'pending' });

    if (result.deletedCount === 0) {
      throw new NotFoundError('Pending user not found in this organization');
    }
  }

  public async inviteUser(
    params: InviteUserParams,
    passwordHasher: IPasswordHasher
  ): Promise<Record<string, unknown>> {
    const UserModel = getUserModel(this.connection);
    const existingUser = await UserModel.findOne({ email: params.email });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    const tempPassword = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await passwordHasher.hash(tempPassword);

    const userId = crypto.randomUUID();
    const newUser = new UserModel({
      _id: userId,
      email: params.email,
      name: params.name,
      phone: params.phone,
      passwordHash: hashedPassword,
      roles: [params.role],
      organizationId: params.orgId,
      status: 'pending',
      isActive: true,
    });

    await newUser.save();

    const userResponse = newUser.toObject() as unknown as Record<string, unknown>;
    delete userResponse.passwordHash;
    return userResponse;
  }

  public async removeMember(orgId: string, memberId: string): Promise<void> {
    const UserModel = getUserModel(this.connection);
    const user = await UserModel.findOne({ _id: memberId, organizationId: orgId });
    if (!user) {
      throw new NotFoundError('Member not found in this organization');
    }

    if (user.roles?.includes('owner')) {
      throw new ForbiddenError('Cannot remove the owner of the organization');
    }

    user.status = 'inactive';
    user.isActive = false;
    await user.save();

    const EmployeeModel = getEmployeeModel(this.connection);
    await EmployeeModel.updateOne({ userId: memberId, organizationId: orgId }, { status: 'inactive' });
  }
}
