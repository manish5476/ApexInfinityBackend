export interface RoleData {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  permissions: string[];
  isSuperAdmin: boolean;
  isDefault: boolean;
  isActive: boolean;
  isDeleted: boolean;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IRoleRepository {
  findById(id: string): Promise<RoleData | null>;
  findByName(orgId: string, name: string): Promise<RoleData | null>;
  listByOrg(orgId: string, options?: { includeDeleted?: boolean }): Promise<RoleData[]>;
  save(role: RoleData): Promise<void>;
  delete(id: string): Promise<void>;
  countUsersWithRole(orgId: string, roleId: string): Promise<number>;
}
