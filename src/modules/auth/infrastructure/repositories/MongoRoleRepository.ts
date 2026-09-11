import { Model } from 'mongoose';
import { IRoleRepository, RoleData } from '../../domain/ports/IRoleRepository';
import { RoleDocument } from '../persistence/role.model';
import { UserDocument } from '../persistence/user.model';

export class MongoRoleRepository implements IRoleRepository {
  private readonly roleModel: Model<RoleDocument>;
  private readonly userModel: Model<UserDocument>;

  constructor(roleModel: Model<RoleDocument>, userModel: Model<UserDocument>) {
    this.roleModel = roleModel;
    this.userModel = userModel;
  }

  public async findById(id: string): Promise<RoleData | null> {
    const doc = await this.roleModel.findById(id).lean<RoleDocument | null>().exec();
    if (!doc) return null;
    return this.toData(doc);
  }

  public async findByName(orgId: string, name: string): Promise<RoleData | null> {
    const doc = await this.roleModel.findOne({
      organizationId: orgId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isDeleted: false,
    }).lean<RoleDocument | null>().exec();
    if (!doc) return null;
    return this.toData(doc);
  }

  public async listByOrg(orgId: string, options?: { includeDeleted?: boolean }): Promise<RoleData[]> {
    const filter: Record<string, unknown> = { organizationId: orgId };
    if (!options?.includeDeleted) {
      filter.isDeleted = false;
    }
    const docs = await this.roleModel.find(filter).sort({ name: 1 }).lean<RoleDocument[]>().exec();
    return docs.map((d) => this.toData(d));
  }

  public async save(role: RoleData): Promise<void> {
    await this.roleModel.findByIdAndUpdate(
      role.id,
      {
        $set: {
          organizationId: role.organizationId,
          name: role.name,
          description: role.description,
          permissions: role.permissions,
          isSuperAdmin: role.isSuperAdmin,
          isDefault: role.isDefault,
          isActive: role.isActive,
          isDeleted: role.isDeleted,
          createdBy: role.createdBy,
          updatedBy: role.updatedBy,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).exec();
  }

  public async delete(id: string): Promise<void> {
    await this.roleModel.findByIdAndUpdate(id, { $set: { isDeleted: true, isActive: false } }).exec();
  }

  public async countUsersWithRole(orgId: string, roleNameOrId: string): Promise<number> {
    return await this.userModel.countDocuments({
      organizationId: orgId,
      roles: roleNameOrId,
    }).exec();
  }

  private toData(doc: RoleDocument): RoleData {
    return {
      id: doc._id.toString(),
      organizationId: doc.organizationId,
      name: doc.name,
      description: doc.description,
      permissions: doc.permissions || [],
      isSuperAdmin: doc.isSuperAdmin || false,
      isDefault: doc.isDefault || false,
      isActive: doc.isActive !== false,
      isDeleted: doc.isDeleted || false,
      createdBy: doc.createdBy,
      updatedBy: doc.updatedBy,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
