import { RoleController, SYSTEM_PERMISSIONS } from '../../../src/modules/auth/presentation/controllers/role.controller';
import { IRoleRepository, RoleData } from '../../../src/modules/auth/domain/ports/IRoleRepository';
import { IUserRepository } from '../../../src/modules/auth/domain/ports/IUserRepository';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { EmailAddress } from '../../../src/shared/value-objects/EmailAddress';

class InMemoryRoleRepo implements IRoleRepository {
  private roles: Map<string, RoleData> = new Map();

  async findById(id: string): Promise<RoleData | null> {
    return this.roles.get(id) || null;
  }

  async findByName(orgId: string, name: string): Promise<RoleData | null> {
    for (const r of this.roles.values()) {
      if (r.organizationId === orgId && r.name.toLowerCase() === name.toLowerCase()) {
        return r;
      }
    }
    return null;
  }

  async listByOrg(orgId: string): Promise<RoleData[]> {
    return Array.from(this.roles.values()).filter((r) => r.organizationId === orgId && !r.isDeleted);
  }

  async save(role: RoleData): Promise<void> {
    this.roles.set(role.id, { ...role });
  }

  async delete(id: string): Promise<void> {
    const r = this.roles.get(id);
    if (r) r.isDeleted = true;
  }

  async countUsersWithRole(): Promise<number> {
    return 0;
  }
}

describe('Role & RBAC Controller', () => {
  let roleRepo: InMemoryRoleRepo;
  let mockUserRepo: Partial<IUserRepository>;
  let controller: RoleController;

  beforeEach(() => {
    roleRepo = new InMemoryRoleRepo();
    mockUserRepo = {
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(null as any),
    };
    controller = new RoleController(
      roleRepo,
      mockUserRepo as IUserRepository,
      { publish: jest.fn() } as any
    );
  });

  it('should list available permissions', async () => {
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getAvailablePermissions({} as any, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        results: SYSTEM_PERMISSIONS.length,
      })
    );
  });

  it('should create and list roles', async () => {
    const req: any = {
      user: { id: 'u1', organizationId: 'org1', roles: ['admin'], permissions: [] },
      body: { name: 'Manager', permissions: ['user:read'] },
    };
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await controller.createRole(req, res, next);
    expect(res.status).toHaveBeenCalledWith(201);

    const listRes: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getRoles(req, listRes, next);
    expect(listRes.status).toHaveBeenCalledWith(200);
    expect(listRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        results: 1,
      })
    );
  });
});
