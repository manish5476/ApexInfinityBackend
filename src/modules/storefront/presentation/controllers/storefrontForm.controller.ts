import { Request, Response, NextFunction } from 'express';
import { StorefrontFormSubmissionModel } from '../../infrastructure/persistence';
import { OrganizationModel } from '../../../organization/infrastructure/persistence';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

export class StorefrontFormController {
  public submitForm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { uniqueShopId } = req.params;
      const org = await OrganizationModel.findOne({
        $or: [{ uniqueShopId }, { slug: uniqueShopId }, { _id: uniqueShopId }],
      }).lean();

      if (!org) {
        res.status(404).json({ status: 'fail', message: 'Storefront not found' });
        return;
      }

      const submission = await StorefrontFormSubmissionModel.create({
        organizationId: String(org._id),
        ...req.body,
      });

      res.status(201).json({ status: 'success', message: 'Form submitted successfully', data: submission });
    } catch (err) { next(err); }
  };

  public getSubmissions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const submissions = await StorefrontFormSubmissionModel.find({ organizationId: ctx.organizationId }).sort({ createdAt: -1 }).lean();
      res.status(200).json({ status: 'success', results: submissions.length, data: submissions });
    } catch (err) { next(err); }
  };

  public updateSubmissionStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      const submission = await StorefrontFormSubmissionModel.findOneAndUpdate(
        { organizationId: ctx.organizationId, _id: req.params.id },
        { $set: { status: req.body.status } },
        { new: true }
      ).lean();
      res.status(200).json({ status: 'success', data: submission });
    } catch (err) { next(err); }
  };

  public deleteSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = RequestContextHolder.get()!;
      await StorefrontFormSubmissionModel.deleteOne({ organizationId: ctx.organizationId, _id: req.params.id });
      res.status(200).json({ status: 'success', message: 'Submission deleted' });
    } catch (err) { next(err); }
  };
}
