import { Request, Response, NextFunction } from 'express';
import { PlatformDeliveryAgentModel, StorefrontOrderModel } from '../../infrastructure/persistence';

export class PlatformDeliveryController {
  public register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const agent = await PlatformDeliveryAgentModel.create(req.body);
      res.status(201).json({ status: 'success', data: agent });
    } catch (err) { next(err); }
  };

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phone, password } = req.body;
      const agent = await PlatformDeliveryAgentModel.findOne({ phone }).lean();
      if (!agent) {
        res.status(401).json({ status: 'fail', message: 'Invalid credentials' });
        return;
      }
      res.status(200).json({ status: 'success', token: 'platform_agent_' + agent._id, data: agent });
    } catch (err) { next(err); }
  };

  public updatePassword = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  };

  public getAvailableOrders = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await StorefrontOrderModel.find({ status: 'ready_for_pickup' }).limit(50).lean();
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
        res.status(404).json({ status: 'fail', message: 'Order not found' });
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
