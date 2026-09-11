import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { UserDocument } from '../../infrastructure/persistence/user.model';
import { RoleDocument } from '../../infrastructure/persistence/role.model';
import { SessionDocument } from '../../infrastructure/persistence/session.model';
import { AuthenticatedUser } from '../../../../middleware/auth.middleware';
import { IPasswordHasher } from '../../../../infrastructure/security/IPasswordHasher';
import { ITokenService } from '../../../../infrastructure/security/ITokenService';
import { IEmailSender } from '../../../../infrastructure/email/IEmailSender';
import { SYSTEM_PERMISSIONS } from './role.controller';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../../shared/errors';
import crypto from 'crypto';

export class UserController {
  private readonly userModel: Model<UserDocument>;
  private readonly roleModel: Model<RoleDocument>;
  private readonly sessionModel: Model<SessionDocument>;
  private readonly passwordHasher: IPasswordHasher;
  private readonly tokenService: ITokenService;
  private readonly emailSender: IEmailSender;

  constructor(
    userModel: Model<UserDocument>,
    roleModel: Model<RoleDocument>,
    sessionModel: Model<SessionDocument>,
    passwordHasher: IPasswordHasher,
    tokenService: ITokenService,
    emailSender: IEmailSender
  ) {
    this.userModel = userModel;
    this.roleModel = roleModel;
    this.sessionModel = sessionModel;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.emailSender = emailSender;
  }

  // 1. Self Profile Management
  public getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const doc = await this.userModel.findById(user.id).select('-passwordHash').lean().exec();
      if (!doc) throw new NotFoundError('User not found.');

      res.status(200).json({
        status: 'success',
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  };

  public updateMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { name, phone, avatar, preferences, language, themeId, upiId } = req.body;

      const updates: Record<string, unknown> = {};
      if (name) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone;
      if (avatar !== undefined) updates.avatar = avatar;
      if (preferences) updates.preferences = preferences;
      if (language) updates.language = language;
      if (themeId) updates.themeId = themeId;
      if (upiId) updates.upiId = upiId;

      const updated = await this.userModel
        .findByIdAndUpdate(user.id, { $set: updates }, { new: true })
        .select('-passwordHash')
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  public uploadProfilePhoto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const file = req.file;
      const avatarUrl = file ? `/uploads/avatars/${file.filename || file.originalname}` : (req.body.photo || req.body.avatar);

      await this.userModel.findByIdAndUpdate(user.id, { $set: { avatar: avatarUrl } }).exec();

      res.status(200).json({
        status: 'success',
        message: 'Profile photo updated.',
        data: { avatar: avatarUrl },
      });
    } catch (err) {
      next(err);
    }
  };

  public getMyPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      res.status(200).json({
        status: 'success',
        data: {
          roles: user.roles,
          permissions: user.permissions,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public getMyDevices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const sessions = await this.sessionModel
        .find({ userId: user.id, isValid: true })
        .sort({ lastActivityAt: -1 })
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: sessions.length,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  };

  public revokeDevice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const sessionId = req.params.sessionId;

      const session = await this.sessionModel.findOne({ _id: sessionId, userId: user.id }).exec();
      if (!session) throw new NotFoundError('Session not found.');

      session.isValid = false;
      session.terminatedAt = new Date();
      await session.save();

      res.status(200).json({
        status: 'success',
        message: 'Device session revoked.',
      });
    } catch (err) {
      next(err);
    }
  };

  // 2. Admin & Directory Endpoints
  public getAllAvailablePermissions = async (req: Request, res: Response): Promise<void> => {
    const groups = Array.from(new Set(SYSTEM_PERMISSIONS.map((p) => p.group))).map((g) => ({
      name: g,
      permissions: SYSTEM_PERMISSIONS.filter((p) => p.group === g),
    }));

    res.status(200).json({
      status: 'success',
      results: SYSTEM_PERMISSIONS.length,
      data: { groups, permissions: SYSTEM_PERMISSIONS },
    });
  };

  public searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const q = String(req.query.q || req.query.search || '').trim();

      const filter: Record<string, unknown> = {
        organizationId: user.organizationId,
      };

      if (q) {
        filter.$or = [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } },
          { phone: { $regex: q, $options: 'i' } },
        ];
      }

      const users = await this.userModel.find(filter).select('-passwordHash').limit(50).lean().exec();

      res.status(200).json({
        status: 'success',
        results: users.length,
        data: users,
      });
    } catch (err) {
      next(err);
    }
  };

  public getOrgHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const users = await this.userModel
        .find({ organizationId: user.organizationId })
        .select('_id name email roles departmentId designationId avatar')
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        data: {
          organizationId: user.organizationId,
          totalUsers: users.length,
          users,
        },
      });
    } catch (err) {
      next(err);
    }
  };

  public exportUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const users = await this.userModel
        .find({ organizationId: user.organizationId })
        .select('name email phone roles isActive createdAt')
        .lean()
        .exec();

      const csvRows = ['Name,Email,Phone,Roles,Status,Joined'];
      for (const u of users) {
        csvRows.push(
          `"${u.name}","${u.email}","${u.phone || ''}","${(u.roles || []).join(';')}","${u.isActive ? 'Active' : 'Inactive'}","${u.createdAt}"`
        );
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
      res.status(200).send(csvRows.join('\n'));
    } catch (err) {
      next(err);
    }
  };

  public checkPermission = async (req: Request, res: Response): Promise<void> => {
    const user = (req as unknown as { user: AuthenticatedUser }).user;
    const { permission } = req.body;

    const hasPermission =
      user.roles.includes('superadmin') || (Array.isArray(permission) ? permission.every((p) => user.permissions.includes(p)) : user.permissions.includes(permission));

    res.status(200).json({
      status: 'success',
      data: { permission, granted: Boolean(hasPermission) },
    });
  };

  public toggleUserBlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId, blockReason } = req.body;
      if (!userId) throw new BadRequestError('userId is required.');

      const targetUser = await this.userModel.findById(userId).exec();
      if (!targetUser) throw new NotFoundError('User not found.');

      targetUser.isActive = !targetUser.isActive;
      await targetUser.save();

      res.status(200).json({
        status: 'success',
        message: targetUser.isActive ? 'User reactivated.' : 'User blocked.',
        data: { userId, isActive: targetUser.isActive, blockReason },
      });
    } catch (err) {
      next(err);
    }
  };

  // 3. Collection CRUD
  public getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
      const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '20'), 10)));
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (user.organizationId && !user.roles.includes('superadmin')) {
        filter.organizationId = user.organizationId;
      }
      if (req.query.role) filter.roles = req.query.role;
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

      const total = await this.userModel.countDocuments(filter).exec();
      const users = await this.userModel
        .find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec();

      res.status(200).json({
        status: 'success',
        results: users.length,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        data: users,
      });
    } catch (err) {
      next(err);
    }
  };

  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { name, email, password, roles = ['user'], phone, branchId } = req.body;

      if (!name || !email) throw new BadRequestError('Name and email are required.');

      const existing = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
      if (existing) throw new BadRequestError('User with this email already exists.');

      const rawPassword = password || crypto.randomBytes(8).toString('hex');
      const passwordHash = await this.passwordHasher.hash(rawPassword);

      const userId = crypto.randomUUID();
      const newUser = await this.userModel.create({
        _id: userId,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        organizationId: user.organizationId,
        roles,
        phone,
        branchId,
        isActive: true,
        emailVerified: true,
      });

      const responseData = newUser.toObject();
      delete (responseData as { passwordHash?: string }).passwordHash;

      res.status(201).json({
        status: 'success',
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  };

  public getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doc = await this.userModel.findById(req.params.id).select('-passwordHash').lean().exec();
      if (!doc) throw new NotFoundError('User not found.');

      res.status(200).json({
        status: 'success',
        data: doc,
      });
    } catch (err) {
      next(err);
    }
  };

  public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name, phone, roles, isActive, branchId } = req.body;
      const updates: Record<string, unknown> = {};
      if (name) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone;
      if (roles) updates.roles = roles;
      if (isActive !== undefined) updates.isActive = Boolean(isActive);
      if (branchId !== undefined) updates.branchId = branchId;

      const updated = await this.userModel
        .findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
        .select('-passwordHash')
        .lean()
        .exec();

      if (!updated) throw new NotFoundError('User not found.');

      res.status(200).json({
        status: 'success',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  };

  public deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: false, isDeleted: true } },
        { new: true }
      ).exec();

      if (!user) throw new NotFoundError('User not found.');

      res.status(200).json({
        status: 'success',
        message: 'User deactivated.',
      });
    } catch (err) {
      next(err);
    }
  };

  public changeRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { roleId, roleName } = req.body;
      const role = roleId ? await this.roleModel.findById(roleId).exec() : null;
      const finalRoleName = role ? role.name : roleName;

      if (!finalRoleName) throw new BadRequestError('roleId or roleName required.');

      const user = await this.userModel.findById(req.params.id).exec();
      if (!user) throw new NotFoundError('User not found.');

      user.roles = [finalRoleName];
      if (role) {
        user.permissions = role.permissions;
      }
      await user.save();

      res.status(200).json({
        status: 'success',
        message: `Role changed to ${finalRoleName}.`,
        data: { userId: user._id, roles: user.roles },
      });
    } catch (err) {
      next(err);
    }
  };

  public adminResetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { newPassword } = req.body;
      const passwordToSet = newPassword || crypto.randomBytes(8).toString('hex');
      const passwordHash = await this.passwordHasher.hash(passwordToSet);

      const user = await this.userModel.findByIdAndUpdate(
        req.params.id,
        { $set: { passwordHash } },
        { new: true }
      ).exec();

      if (!user) throw new NotFoundError('User not found.');

      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully.',
        data: { tempPassword: newPassword ? undefined : passwordToSet },
      });
    } catch (err) {
      next(err);
    }
  };

  public resendInvite = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userModel.findById(req.params.id).exec();
      if (!user) throw new NotFoundError('User not found.');

      await this.emailSender.send({
        to: user.email,
        subject: 'Invitation to Apex Infinity Platform',
        html: `<p>Hello ${user.name},</p><p>You have been invited to Apex. Please log in at ${process.env.FRONTEND_URL || 'http://localhost:4200'}.</p>`,
      });

      res.status(200).json({
        status: 'success',
        message: 'Invitation resent.',
      });
    } catch (err) {
      next(err);
    }
  };

  public restoreUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        req.params.id,
        { $set: { isActive: true, isDeleted: false } },
        { new: true }
      ).select('-passwordHash').exec();

      if (!user) throw new NotFoundError('User not found.');

      res.status(200).json({
        status: 'success',
        message: 'User restored.',
        data: user,
      });
    } catch (err) {
      next(err);
    }
  };
}
