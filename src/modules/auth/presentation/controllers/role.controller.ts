import { Request, Response, NextFunction } from 'express';
import { IRoleRepository } from '../../domain/ports/IRoleRepository';
import { IUserRepository } from '../../domain/ports/IUserRepository';
import { IEventBus } from '../../../../infrastructure/messaging/IEventBus';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../../shared/errors';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import crypto from 'crypto';

export const SYSTEM_PERMISSIONS = [
  { tag: 'user:read', group: 'System', description: 'View Users & Organization Hierarchy' },
  { tag: 'user:manage', group: 'System', description: 'Manage Users, Statuses, and Admin Actions' },
  { tag: 'role:manage', group: 'System', description: 'Manage Roles' },
  { tag: 'session:view_all', group: 'System', description: 'View All System Sessions' },
  { tag: 'master:read', group: 'System', description: 'View Master Data lists and filters' },
  { tag: 'master:manage', group: 'System', description: 'Export and manage Master Data' },
  { tag: 'logs:view', group: 'System', description: 'Read server-side system and error logs' },
  { tag: 'system:manage', group: 'System', description: 'Manage background jobs, cache, and system status' },
  { tag: 'platform:read', group: 'Admin Platform', description: 'View enterprise admin dashboard' },
  { tag: 'platform:manage', group: 'Admin Platform', description: 'Manage admin platform operations' },
  { tag: 'org:manage', group: 'Organization', description: 'Manage Own Organization' },
  { tag: 'org:manage_members', group: 'Organization', description: 'Invite/Remove Members' },
  { tag: 'ownership:transfer', group: 'Organization', description: 'Transfer organization ownership' },
  { tag: 'branch:read', group: 'Organization', description: 'View branch lists and details' },
  { tag: 'branch:manage', group: 'Organization', description: 'Create, Update, and Delete branches' },
  { tag: 'customer:read', group: 'CRM', description: 'View customers' },
  { tag: 'customer:create', group: 'CRM', description: 'Create customers' },
  { tag: 'customer:update', group: 'CRM', description: 'Update customers' },
  { tag: 'customer:delete', group: 'CRM', description: 'Delete customers' },
  { tag: 'supplier:read', group: 'CRM', description: 'View suppliers' },
  { tag: 'supplier:create', group: 'CRM', description: 'Create suppliers' },
  { tag: 'supplier:update', group: 'CRM', description: 'Update suppliers' },
  { tag: 'supplier:delete', group: 'CRM', description: 'Delete suppliers' },
  { tag: 'product:read', group: 'Inventory', description: 'View products' },
  { tag: 'product:create', group: 'Inventory', description: 'Create products' },
  { tag: 'product:update', group: 'Inventory', description: 'Update products' },
  { tag: 'product:delete', group: 'Inventory', description: 'Delete products' },
  { tag: 'sales:read', group: 'Sales', description: 'View sales orders' },
  { tag: 'sales:manage', group: 'Sales', description: 'Create and update sales orders' },
  { tag: 'purchase:read', group: 'Purchase', description: 'View purchase orders' },
  { tag: 'purchase:manage', group: 'Purchase', description: 'Create and update purchase orders' },
  { tag: 'invoice:read', group: 'Accounting', description: 'View invoices' },
  { tag: 'invoice:create', group: 'Accounting', description: 'Create invoices' },
  { tag: 'invoice:download', group: 'Accounting', description: 'Download and print invoice PDFs' },
  { tag: 'payment:read', group: 'Accounting', description: 'View payments' },
  { tag: 'payment:create', group: 'Accounting', description: 'Record payments' },
  { tag: 'emi:read', group: 'Accounting', description: 'View EMI schedules and reports' },
  { tag: 'emi:manage', group: 'Accounting', description: 'Manage EMI plans and payments' },
  { tag: 'statement:read', group: 'Accounting', description: 'View financial statements' },
  { tag: 'reconciliation:manage', group: 'Accounting', description: 'Manage account reconciliation' },
  { tag: 'transaction:read', group: 'Accounting', description: 'View financial transactions' },
  { tag: 'field_service:read', group: 'Field Service', description: 'View work assignments' },
  { tag: 'field_service:create', group: 'Field Service', description: 'Create work assignments' },
  { tag: 'field_service:manage', group: 'Field Service', description: 'Manage work assignments' },
  { tag: 'logistics:read', group: 'Logistics', description: 'View shipments' },
  { tag: 'logistics:manage', group: 'Logistics', description: 'Manage logistics' },
  { tag: 'analytics:read', group: 'Analytics', description: 'View standard analytics' },
  { tag: 'analytics:view_financial', group: 'Analytics', description: 'View financial analytics' },
  { tag: 'analytics:view_executive', group: 'Analytics', description: 'View executive analytics' },
  { tag: 'ai:chat', group: 'AI', description: 'Interact with AI assistant' },
];

export class RoleController {
  private readonly roleRepo: IRoleRepository;
  private readonly userRepo: IUserRepository;
  private readonly eventBus: IEventBus;

  constructor(roleRepo: IRoleRepository, userRepo: IUserRepository, eventBus: IEventBus) {
    this.roleRepo = roleRepo;
    this.userRepo = userRepo;
    this.eventBus = eventBus;
  }

  public getAvailablePermissions = async (req: Request, res: Response): Promise<void> => {
    const groups = Array.from(new Set(SYSTEM_PERMISSIONS.map((p) => p.group))).map((g) => ({
      name: g,
      permissions: SYSTEM_PERMISSIONS.filter((p) => p.group === g),
    }));

    res.status(200).json({
      status: 'success',
      results: SYSTEM_PERMISSIONS.length,
      data: {
        groups,
        permissions: SYSTEM_PERMISSIONS,
      },
    });
  };

  public getRoles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const orgId = user.organizationId;
      if (!orgId) throw new BadRequestError('Organization context required.');

      const roles = await this.roleRepo.listByOrg(orgId);
      const withCounts = await Promise.all(
        roles.map(async (r) => {
          const userCount = await this.roleRepo.countUsersWithRole(orgId, r.id);
          return { ...r, userCount };
        })
      );

      res.status(200).json({
        status: 'success',
        results: withCounts.length,
        data: withCounts,
      });
    } catch (err) {
      next(err);
    }
  };

  public getRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await this.roleRepo.findById(req.params.id);
      if (!role || role.isDeleted) throw new NotFoundError('Role not found.');

      const user = (req as unknown as { user: AuthenticatedUser }).user;
      if (role.organizationId !== user.organizationId && !user.roles.includes('superadmin')) {
        throw new ForbiddenError('Cannot access role from another organization.');
      }

      const userCount = await this.roleRepo.countUsersWithRole(role.organizationId, role.id);
      res.status(200).json({
        status: 'success',
        data: { ...role, userCount },
      });
    } catch (err) {
      next(err);
    }
  };

  public createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const orgId = user.organizationId;
      if (!orgId) throw new BadRequestError('Organization context required.');

      const { name, description, permissions = [], isDefault = false, isSuperAdmin = false } = req.body;
      if (!name || typeof name !== 'string') throw new BadRequestError('Role name is required.');

      const existing = await this.roleRepo.findByName(orgId, name);
      if (existing) throw new BadRequestError('A role with this name already exists.');

      const roleId = crypto.randomUUID();
      const role = {
        id: roleId,
        organizationId: orgId,
        name: name.trim(),
        description,
        permissions,
        isDefault: Boolean(isDefault),
        isSuperAdmin: Boolean(isSuperAdmin),
        isActive: true,
        isDeleted: false,
        createdBy: user.id,
        updatedBy: user.id,
      };

      await this.roleRepo.save(role);

      res.status(201).json({
        status: 'success',
        data: role,
      });
    } catch (err) {
      next(err);
    }
  };

  public updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await this.roleRepo.findById(req.params.id);
      if (!role || role.isDeleted) throw new NotFoundError('Role not found.');

      const user = (req as unknown as { user: AuthenticatedUser }).user;
      if (role.organizationId !== user.organizationId && !user.roles.includes('superadmin')) {
        throw new ForbiddenError('Cannot modify role from another organization.');
      }

      const { name, description, permissions, isDefault, isSuperAdmin } = req.body;
      if (name) role.name = name.trim();
      if (description !== undefined) role.description = description;
      if (Array.isArray(permissions)) role.permissions = permissions;
      if (isDefault !== undefined) role.isDefault = Boolean(isDefault);
      if (isSuperAdmin !== undefined) role.isSuperAdmin = Boolean(isSuperAdmin);
      role.updatedBy = user.id;

      await this.roleRepo.save(role);

      res.status(200).json({
        status: 'success',
        data: role,
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const role = await this.roleRepo.findById(req.params.id);
      if (!role || role.isDeleted) throw new NotFoundError('Role not found.');

      const user = (req as unknown as { user: AuthenticatedUser }).user;
      if (role.organizationId !== user.organizationId && !user.roles.includes('superadmin')) {
        throw new ForbiddenError('Cannot delete role from another organization.');
      }

      if (role.isDefault) throw new BadRequestError('Cannot delete the organization default role.');

      const userCount = await this.roleRepo.countUsersWithRole(role.organizationId, role.id);
      if (userCount > 0) {
        throw new BadRequestError(`Cannot delete role: ${userCount} users are currently assigned to it.`);
      }

      await this.roleRepo.delete(role.id);

      res.status(200).json({
        status: 'success',
        message: 'Role deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  };

  public assignRoleToUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, roleId } = req.body;
      if (!userId || !roleId) throw new BadRequestError('userId and roleId are required.');

      const role = await this.roleRepo.findById(roleId);
      if (!role || role.isDeleted) throw new NotFoundError('Role not found.');

      const targetUser = await this.userRepo.findById(userId);
      if (!targetUser) throw new NotFoundError('User not found.');

      targetUser.updateRoles([role.name]);
      targetUser.updatePermissions(role.permissions);
      await this.userRepo.save(targetUser);

      res.status(200).json({
        status: 'success',
        message: `Role "${role.name}" successfully assigned to user ${targetUser.name}.`,
        data: { userId, roleId: role.id, roleName: role.name },
      });
    } catch (err) {
      next(err);
    }
  };

  public assignRoleBulk = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userIds, roleId } = req.body;
      if (!Array.isArray(userIds) || !userIds.length || !roleId) {
        throw new BadRequestError('userIds array and roleId are required.');
      }

      const role = await this.roleRepo.findById(roleId);
      if (!role || role.isDeleted) throw new NotFoundError('Role not found.');

      let updatedCount = 0;
      for (const uid of userIds) {
        const u = await this.userRepo.findById(uid);
        if (u) {
          u.updateRoles([role.name]);
          u.updatePermissions(role.permissions);
          await this.userRepo.save(u);
          updatedCount++;
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Role "${role.name}" assigned to ${updatedCount} users.`,
        data: { updatedCount, roleId: role.id },
      });
    } catch (err) {
      next(err);
    }
  };
}
