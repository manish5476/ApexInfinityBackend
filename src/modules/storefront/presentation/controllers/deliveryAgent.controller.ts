import { Request, Response, NextFunction } from 'express';
import { StorefrontDeliveryAgentModel, StorefrontOrderModel } from '../../infrastructure/persistence';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const AGENT_JWT_SECRET = process.env.AGENT_JWT_SECRET || process.env.JWT_SECRET || 'changeme';
const AGENT_JWT_EXPIRES_IN = '12h';

/** Allowed order-status transitions an agent may perform */
const AGENT_ALLOWED_TRANSITIONS: Record<string, string[]> = {
  dispatched:       ['out_for_delivery'],
  out_for_delivery: ['delivered', 'failed_delivery'],
  failed_delivery:  ['out_for_delivery'],
};

export class DeliveryAgentController {
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, password } = req.body as { phone?: string; password?: string };
      if (!phone || !password) {
        res.status(400).json({ status: 'fail', message: 'phone and password are required' });
        return;
      }

      // Select passwordHash explicitly (excluded by default via select:false)
      const agent = await StorefrontDeliveryAgentModel.findOne({ phone }).select('+passwordHash').lean();
      if (!agent) {
        // Constant-time dummy compare to prevent phone enumeration via timing attack
        await bcrypt.compare('dummy', '$2b$10$invalidhashfortimingequalisation');
        res.status(401).json({ status: 'fail', message: 'Invalid phone or password' });
        return;
      }

      const passwordHash = (agent as Record<string, unknown>).passwordHash as string | undefined;
      if (!passwordHash) {
        res.status(401).json({ status: 'fail', message: 'Account not configured for password login' });
        return;
      }

      const match = await bcrypt.compare(password, passwordHash);
      if (!match) {
        res.status(401).json({ status: 'fail', message: 'Invalid phone or password' });
        return;
      }

      const token = jwt.sign(
        {
          agentId: String(agent._id),
          organizationId: String((agent as Record<string, unknown>).organizationId),
          type: 'delivery_agent',
        },
        AGENT_JWT_SECRET,
        { expiresIn: AGENT_JWT_EXPIRES_IN } as jwt.SignOptions,
      );

      // Strip passwordHash from response
      const { passwordHash: _ph, ...safeAgent } = agent as Record<string, unknown>;
      res.status(200).json({ status: 'success', token, data: safeAgent });
    } catch (err) { next(err); }
  };

  public forgotPassword = async (_req: Request, res: Response): Promise<void> => {
    // TODO: Send OTP/reset link via SMS or email
    res.status(200).json({ status: 'success', message: 'Password reset instructions sent' });
  };

  public resetPassword = async (_req: Request, res: Response): Promise<void> => {
    // TODO: Validate OTP/token and update passwordHash
    res.status(200).json({ status: 'success', message: 'Password reset successful' });
  };

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentPayload = this.getAgentPayload(req);
      if (!agentPayload) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }
      const agent = await StorefrontDeliveryAgentModel.findOne({
        _id: agentPayload.agentId,
        organizationId: agentPayload.organizationId,
      }).lean();
      if (!agent) { res.status(404).json({ status: 'fail', message: 'Agent not found' }); return; }
      res.status(200).json({ status: 'success', data: agent });
    } catch (err) { next(err); }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentPayload = this.getAgentPayload(req);
      if (!agentPayload) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }
      // Prevent escalation: disallow changing organizationId or passwordHash via profile update
      const { organizationId: _o, passwordHash: _ph, ...safeBody } = req.body as Record<string, unknown>;
      const agent = await StorefrontDeliveryAgentModel.findOneAndUpdate(
        { _id: agentPayload.agentId, organizationId: agentPayload.organizationId },
        { $set: safeBody },
        { new: true },
      ).lean();
      res.status(200).json({ status: 'success', data: agent });
    } catch (err) { next(err); }
  };

  public updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentPayload = this.getAgentPayload(req);
      if (!agentPayload) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }
      const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
      if (!currentPassword || !newPassword) {
        res.status(400).json({ status: 'fail', message: 'currentPassword and newPassword are required' });
        return;
      }
      if (newPassword.length < 8) {
        res.status(400).json({ status: 'fail', message: 'newPassword must be at least 8 characters' });
        return;
      }
      const agent = await StorefrontDeliveryAgentModel.findOne({
        _id: agentPayload.agentId,
        organizationId: agentPayload.organizationId,
      }).select('+passwordHash').lean();
      if (!agent || !(await bcrypt.compare(currentPassword, (agent as Record<string, unknown>).passwordHash as string || ''))) {
        res.status(401).json({ status: 'fail', message: 'Current password is incorrect' });
        return;
      }
      const newHash = await bcrypt.hash(newPassword, 12);
      await StorefrontDeliveryAgentModel.updateOne(
        { _id: agentPayload.agentId, organizationId: agentPayload.organizationId },
        { $set: { passwordHash: newHash } },
      );
      res.status(200).json({ status: 'success', message: 'Password updated successfully' });
    } catch (err) { next(err); }
  };

  public getAssignedOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentPayload = this.getAgentPayload(req);
      if (!agentPayload) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }
      const orders = await StorefrontOrderModel.find({
        deliveryAgentId: agentPayload.agentId,
        organizationId: agentPayload.organizationId,
      }).sort({ createdAt: -1 }).lean();
      res.status(200).json({ status: 'success', results: orders.length, data: orders });
    } catch (err) { next(err); }
  };

  public scanOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentPayload = this.getAgentPayload(req);
      if (!agentPayload) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }
      const { identifier } = req.params;
      // SEC-003 fix: scope by organizationId to prevent cross-org IDOR
      const order = await StorefrontOrderModel.findOne({
        organizationId: agentPayload.organizationId,
        $or: [{ orderNumber: identifier }, { _id: identifier }],
      }).lean();
      if (!order) { res.status(404).json({ status: 'fail', message: 'Order not found' }); return; }
      res.status(200).json({ status: 'success', data: order });
    } catch (err) { next(err); }
  };

  public updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentPayload = this.getAgentPayload(req);
      if (!agentPayload) { res.status(401).json({ status: 'fail', message: 'Unauthorized' }); return; }
      const { orderId } = req.params;
      const { status: newStatus } = req.body as { status?: string };
      if (!newStatus) {
        res.status(400).json({ status: 'fail', message: 'status is required' });
        return;
      }

      // SEC-004 fix: scope to organizationId + verify this agent is assigned to the order
      const order = await StorefrontOrderModel.findOne({
        _id: orderId,
        organizationId: agentPayload.organizationId,
        deliveryAgentId: agentPayload.agentId,
      }).lean();

      if (!order) {
        res.status(404).json({ status: 'fail', message: 'Order not found or not assigned to you' });
        return;
      }

      // Enforce state machine: agent may only perform allowed transitions
      const currentStatus = (order as Record<string, unknown>).status as string;
      const allowed = AGENT_ALLOWED_TRANSITIONS[currentStatus] ?? [];
      if (!allowed.includes(newStatus)) {
        res.status(400).json({
          status: 'fail',
          message: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(', ')}]`,
        });
        return;
      }

      const updated = await StorefrontOrderModel.findOneAndUpdate(
        { _id: orderId, organizationId: agentPayload.organizationId },
        {
          $set: { status: newStatus, updatedAt: new Date() },
          $push: {
            timeline: {
              type: `status_${newStatus}`,
              message: `Order marked as ${newStatus} by delivery agent`,
              at: new Date(),
              actorId: agentPayload.agentId,
            },
          },
        },
        { new: true },
      ).lean();

      res.status(200).json({ status: 'success', data: updated });
    } catch (err) { next(err); }
  };

  /** Extract and verify the agent JWT payload from the request */
  private getAgentPayload(req: Request): { agentId: string; organizationId: string } | null {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    if (!token) return null;
    try {
      const decoded = jwt.verify(token, AGENT_JWT_SECRET) as { agentId?: string; organizationId?: string; type?: string };
      if (decoded.type !== 'delivery_agent' || !decoded.agentId || !decoded.organizationId) return null;
      return { agentId: decoded.agentId, organizationId: decoded.organizationId };
    } catch {
      return null;
    }
  }
}


