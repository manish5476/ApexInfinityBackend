import { SearchController } from '../../../src/modules/search/presentation/controllers/search.controller';
import { CronController } from '../../../src/modules/system-ops/presentation/controllers/cron.controller';
import { LogController } from '../../../src/modules/system-ops/presentation/controllers/log.controller';
import { DeliveryAgentController } from '../../../src/modules/storefront/presentation/controllers/deliveryAgent.controller';
import { PlatformDeliveryController } from '../../../src/modules/storefront/presentation/controllers/platformDelivery.controller';

describe('Phase 5 & 6: System Ops, Search, and Storefront Delivery Parity', () => {
  describe('SearchController', () => {
    let controller: SearchController;

    beforeEach(() => {
      controller = new SearchController();
    });

    it('should return empty results when search query is less than 2 chars', async () => {
      const req: any = { query: { q: 'a' } };
      let jsonResult: any = null;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          jsonResult = data;
        }),
      };
      const next = jest.fn();

      await controller.globalSearch(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResult.status).toBe('success');
      expect(jsonResult.resultsCount).toBe(0);
      expect(jsonResult.data).toEqual([]);
    });

    it('should return 400 when quickLookup has an unsupported type', async () => {
      const req: any = { query: { type: 'unsupported_entity', q: 'test' } };
      let jsonResult: any = null;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          jsonResult = data;
        }),
      };
      const next = jest.fn();

      await controller.quickLookup(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(jsonResult.status).toBe('fail');
    });
  });

  describe('CronController', () => {
    let controller: CronController;

    beforeEach(() => {
      controller = new CronController();
    });

    it('should report active background cron jobs', async () => {
      const req: any = {};
      let jsonResult: any = null;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          jsonResult = data;
        }),
      };

      await controller.getCronStatus(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResult.status).toBe('success');
      expect(jsonResult.data.managerActive).toBe(true);
      expect(jsonResult.data.totalJobs).toBeGreaterThan(0);
    });

    it('should trigger a named cron job manually', async () => {
      const req: any = { params: { job: 'payment-reconciliation' } };
      let jsonResult: any = null;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          jsonResult = data;
        }),
      };

      await controller.triggerCronJob(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResult.data.job).toBe('payment-reconciliation');
      expect(jsonResult.data.success).toBe(true);
    });

    it('should stop all cron jobs', async () => {
      const req: any = {};
      let jsonResult: any = null;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          jsonResult = data;
        }),
      };

      await controller.stopCronJobs(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResult.message).toBe('Payment cron jobs stopped');
    });
  });

  describe('LogController', () => {
    let controller: LogController;

    beforeEach(() => {
      controller = new LogController();
    });

    it('should return safe system log lines even when log file is absent', async () => {
      const req: any = { query: { file: 'combined' } };
      let jsonResult: any = null;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          jsonResult = data;
        }),
      };
      const next = jest.fn();

      await controller.getLogs(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.data.lines.length).toBeGreaterThan(0);
    });
  });

  describe('DeliveryAgentController', () => {
    let controller: DeliveryAgentController;

    beforeEach(() => {
      controller = new DeliveryAgentController();
    });

    it('should provide profile response for delivery agent', async () => {
      const req: any = { user: { id: 'agent-1' } };
      let jsonResult: any = null;
      const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementation((data) => {
          jsonResult = data;
        }),
      };
      const next = jest.fn();

      await controller.getProfile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(jsonResult.status).toBe('success');
      expect(jsonResult.data).toBeDefined();
    });
  });
});
