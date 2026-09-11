import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import crypto from 'crypto';
import { OrganizationDocument } from '../infrastructure/persistence/organization.model';
import { TransferRequestDocument } from '../infrastructure/persistence/transferRequest.model';
import { UserDocument } from '../../auth/infrastructure/persistence/user.model';
import { AuthenticatedUser } from '../../../middleware/auth.middleware';
import { IEmailSender } from '../../../infrastructure/email/IEmailSender';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../shared/errors';

export class OwnershipController {
  private readonly orgModel: Model<OrganizationDocument>;
  private readonly transferModel: Model<TransferRequestDocument>;
  private readonly userModel: Model<UserDocument>;
  private readonly emailSender: IEmailSender;
  private readonly frontendUrl: string;

  constructor(
    orgModel: Model<OrganizationDocument>,
    transferModel: Model<TransferRequestDocument>,
    userModel: Model<UserDocument>,
    emailSender: IEmailSender,
    frontendUrl = 'http://localhost:4200'
  ) {
    this.orgModel = orgModel;
    this.transferModel = transferModel;
    this.userModel = userModel;
    this.emailSender = emailSender;
    this.frontendUrl = frontendUrl;
  }

  public initiateOwnershipTransfer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { userId: newOwnerId } = req.body;
      const currentOwnerId = user.id;
      const orgId = user.organizationId;

      if (!orgId) throw new BadRequestError('Organization context required.');
      if (!newOwnerId) throw new BadRequestError('Please provide the User ID of the new owner.');
      if (newOwnerId === currentOwnerId) throw new BadRequestError('You are already the owner.');

      const org = await this.orgModel.findById(orgId).exec();
      if (!org) throw new NotFoundError('Organization not found.');

      const newOwner = await this.userModel.findOne({ _id: newOwnerId, organizationId: orgId }).exec();
      if (!newOwner) throw new NotFoundError('Target user not found in this organization.');

      const existingRequest = await this.transferModel.findOne({
        organizationId: orgId,
        status: 'pending',
      }).exec();
      if (existingRequest) {
        throw new BadRequestError('A transfer request is already pending. Cancel it first.');
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const transferId = crypto.randomUUID();
      await this.transferModel.create({
        _id: transferId,
        organizationId: orgId,
        currentOwner: currentOwnerId,
        newOwner: newOwnerId,
        tokenHash,
        expiresAt,
        status: 'pending',
      });

      const transferLink = `${this.frontendUrl}/dashboard/settings/ownership?token=${rawToken}`;
      await this.emailSender.send({
        to: newOwner.email,
        subject: `Action Required: Accept Ownership of ${org.name}`,
        body: `Hello ${newOwner.name},\n\nYou have been nominated to become the primary owner of "${org.name}".\n\nAccept transfer: ${transferLink}\n\nThis link expires in 24 hours.`,
      });

      res.status(200).json({
        status: 'success',
        message: 'Transfer initiated. Approval email sent to the new owner.',
      });
    } catch (err) {
      next(err);
    }
  };

  public finalizeOwnershipTransfer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const { token } = req.body;
      if (!token) throw new BadRequestError('Transfer token is required.');

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const transferRequest = await this.transferModel.findOne({
        tokenHash,
        status: 'pending',
        expiresAt: { $gt: new Date() },
      }).exec();

      if (!transferRequest) {
        throw new BadRequestError('Invalid or expired transfer token.');
      }

      if (transferRequest.newOwner !== user.id) {
        throw new ForbiddenError('You are not authorized to accept this transfer request.');
      }

      const orgId = transferRequest.organizationId;
      const oldOwnerId = transferRequest.currentOwner;
      const newOwnerId = transferRequest.newOwner;

      // Update old owner role
      const oldOwner = await this.userModel.findById(oldOwnerId).exec();
      if (oldOwner) {
        oldOwner.roles = ['admin'];
        await oldOwner.save();
      }

      // Update new owner role
      const newOwner = await this.userModel.findById(newOwnerId).exec();
      if (newOwner) {
        newOwner.roles = ['owner', 'superadmin'];
        await newOwner.save();
      }

      transferRequest.status = 'completed';
      await transferRequest.save();

      res.status(200).json({
        status: 'success',
        message: 'Ownership transfer completed successfully. You are now the organization owner.',
        data: { organizationId: orgId, ownerId: newOwnerId },
      });
    } catch (err) {
      next(err);
    }
  };

  public cancelOwnershipTransfer = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const orgId = user.organizationId;

      const transferRequest = await this.transferModel.findOne({
        organizationId: orgId,
        status: 'pending',
      }).exec();

      if (!transferRequest) {
        throw new NotFoundError('No active pending transfer request found.');
      }

      if (transferRequest.currentOwner !== user.id && !user.roles.includes('superadmin')) {
        throw new ForbiddenError('Only the initiator can cancel the transfer request.');
      }

      transferRequest.status = 'cancelled';
      await transferRequest.save();

      res.status(200).json({
        status: 'success',
        message: 'Ownership transfer request has been cancelled.',
      });
    } catch (err) {
      next(err);
    }
  };

  public forceTransferOwnership = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = (req as unknown as { user: AuthenticatedUser }).user;
      const orgId = user.organizationId;
      const { newOwnerId } = req.body;

      if (!newOwnerId) throw new BadRequestError('newOwnerId is required.');

      const newOwner = await this.userModel.findOne({ _id: newOwnerId, organizationId: orgId }).exec();
      if (!newOwner) throw new NotFoundError('Target user not found in this organization.');

      // Update new owner
      newOwner.roles = ['owner', 'superadmin'];
      await newOwner.save();

      // Cancel any pending transfer request
      await this.transferModel.updateMany(
        { organizationId: orgId, status: 'pending' },
        { $set: { status: 'cancelled' } }
      ).exec();

      res.status(200).json({
        status: 'success',
        message: 'Ownership successfully force-transferred.',
        data: { organizationId: orgId, newOwnerId },
      });
    } catch (err) {
      next(err);
    }
  };
}
