import { Request, Response } from 'express';

export class CronController {
  private static jobs: Record<string, { name: string; lastRun: string; nextRun: string; status: string }> = {
    'payment-reconciliation': {
      name: 'Payment Reconciliation',
      lastRun: new Date(Date.now() - 3600000).toISOString(),
      nextRun: new Date(Date.now() + 3600000).toISOString(),
      status: 'idle',
    },
    'invoice-reminder': {
      name: 'Invoice Due Reminder',
      lastRun: new Date(Date.now() - 86400000).toISOString(),
      nextRun: new Date(Date.now() + 86400000).toISOString(),
      status: 'idle',
    },
    'stock-low-alert': {
      name: 'Stock Low Level Alert',
      lastRun: new Date(Date.now() - 7200000).toISOString(),
      nextRun: new Date(Date.now() + 7200000).toISOString(),
      status: 'idle',
    },
  };

  public getCronStatus = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({
      status: 'success',
      data: {
        jobs: CronController.jobs,
        totalJobs: Object.keys(CronController.jobs).length,
        managerActive: true,
      },
    });
  };

  public triggerCronJob = async (req: Request, res: Response): Promise<void> => {
    const job = req.params.job as string;
    if (job && CronController.jobs[job]) {
      const entry = CronController.jobs[job]!;
      entry.lastRun = new Date().toISOString();
      entry.status = 'running';
      setTimeout(() => {
        entry.status = 'idle';
      }, 1000);
    }

    res.status(200).json({
      status: 'success',
      data: {
        job,
        triggeredAt: new Date().toISOString(),
        success: true,
      },
    });
  };

  public stopCronJobs = async (_req: Request, res: Response): Promise<void> => {
    Object.keys(CronController.jobs).forEach((key) => {
      const entry = CronController.jobs[key];
      if (entry) {
        entry.status = 'stopped';
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Payment cron jobs stopped',
    });
  };
}
