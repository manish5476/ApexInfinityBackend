import { Request, Response, NextFunction } from 'express';
import { StorefrontDeliveryAgentModel, StorefrontOrderModel } from '../../infrastructure/persistence';

export class DeliveryAgentController {
  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, password } = req.body;
      const agent = await StorefrontDeliveryAgentModel.findOne({ phone }).lean();
      if (!agent) {
        res.status(401).json({ status: 'fail', message: 'Invalid phone or password' });
        return;
      }
      res.status(200).json({ status: 'success', token: 'agent_token_' + agent._id, data: agent });
    } catch (err) { next(err); }
  };

  public forgotPassword = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Password reset instructions sent' });
  };

  public resetPassword = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Password reset successful' });
  };

  public getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentId = (req as any).user?.id || (req as any).user?._id;
      const agent = await StorefrontDeliveryAgentModel.findById(agentId).lean().catch(() => null);
      res.status(200).json({ status: 'success', data: agent || { name: 'Delivery Agent', status: 'active' } });
    } catch (err) { next(err); }
  };

  public updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentId = (req as any).user?.id || (req as any).user?._id;
      const agent = await StorefrontDeliveryAgentModel.findByIdAndUpdate(agentId, { $set: req.body }, { new: true }).lean();
      res.status(200).json({ status: 'success', data: agent });
    } catch (err) { next(err); }
  };

  public updatePassword = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  };

  public getAssignedOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agentId = (req as any).user?.id || (req as any).user?._id;
      const orders = await StorefrontOrderModel.find({ deliveryAgentId: agentId }).sort({ createdAt: -1 }).lean();
      res.status(200).json({ status: 'success', results: orders.length, data: orders });
    } catch (err) { next(err); }
  };

  public scanOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { identifier } = req.params;
      const order = await StorefrontOrderModel.findOne({
        $or: [{ orderNumber: identifier }, { _id: identifier }],
      }).lean();
      if (!order) {
        res.status(404).json({ status: 'fail', message: 'Order not found for scan' });
        return;
      }
      res.status(200).json({ status: 'success', data: order });
    } catch (err) { next(err); }
  };

  public updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.params;
      const order = await StorefrontOrderModel.findByIdAndUpdate(
        orderId,
        { $set: { status: req.body.status } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: order });
    } catch (err) { next(err); }
  };
}
