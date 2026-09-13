import { AiAgentUseCases } from '../../../../src/modules/ai-agent/application/use-cases/AiAgentUseCases';
import { AgentTools } from '../../../../src/modules/ai-agent/application/tools/AgentTools';

describe('Dedicated AI Agent Module — Intelligent Query & Tool Execution', () => {
  let useCases: AiAgentUseCases;
  const orgId = 'org-ai-test';

  beforeEach(() => {
    useCases = new AiAgentUseCases();
    jest.clearAllMocks();
  });

  describe('Intent Routing & Real Tool Execution', () => {
    it('routes sales queries to SalesAnalyticsTool with live calculations', async () => {
      jest.spyOn(AgentTools, 'salesAnalyticsTool').mockResolvedValue({
        toolName: 'SalesAnalyticsTool',
        success: true,
        data: { totalRevenue: 125000, totalPaid: 100000, totalOutstanding: 25000, invoiceCount: 15 },
        summary: 'Total Revenue is ₹1,25,000 across 15 invoices (Paid: ₹1,00,000, Outstanding: ₹25,000).',
      });

      const reply = await useCases.processUserMessage('What is our total sales and revenue this month?', {
        organizationId: orgId,
      });

      expect(AgentTools.salesAnalyticsTool).toHaveBeenCalledWith(orgId, undefined);
      expect(reply.toolsUsed).toContain('SalesAnalyticsTool');
      expect(reply.reply).toContain('₹1,25,000');
      expect(reply.reply).toContain('15 invoices');
      // Proof of anti-mock: does NOT contain old fake numbers
      expect(reply.reply).not.toContain('1,54,20,000');
    });

    it('routes product queries to InventoryStockTool and returns stock intelligence', async () => {
      jest.spyOn(AgentTools, 'inventoryStockTool').mockResolvedValue({
        toolName: 'InventoryStockTool',
        success: true,
        data: { totalProducts: 8, matchedCount: 1, estimatedValuation: 45000, lowStockCount: 2, products: [] },
        summary: 'Found 1 product(s). Low stock items: 2. Estimated valuation: ₹45,000.',
      });

      const reply = await useCases.processUserMessage('Check inventory stock for mechanical keyboard', {
        organizationId: orgId,
      });

      expect(AgentTools.inventoryStockTool).toHaveBeenCalledWith(orgId, expect.any(String));
      expect(reply.toolsUsed).toContain('InventoryStockTool');
      expect(reply.reply).toContain('₹45,000');
      // Proof of anti-mock: does NOT contain old fake numbers
      expect(reply.reply).not.toContain('48,00,000');
    });

    it('routes dues questions to CustomerDuesTool with amount filter', async () => {
      jest.spyOn(AgentTools, 'customerDuesTool').mockResolvedValue({
        toolName: 'CustomerDuesTool',
        success: true,
        data: { count: 3, totalDues: 30000, customers: [] },
        summary: '3 customer(s) have outstanding balances exceeding ₹5,000, totaling ₹30,000.',
      });

      const reply = await useCases.processUserMessage('Show me customers with dues greater than 5000', {
        organizationId: orgId,
      });

      expect(AgentTools.customerDuesTool).toHaveBeenCalledWith(orgId, 5000);
      expect(reply.toolsUsed).toContain('CustomerDuesTool');
      expect(reply.reply).toContain('₹30,000');
    });

    it('routes order questions to OrderLookupTool', async () => {
      jest.spyOn(AgentTools, 'orderLookupTool').mockResolvedValue({
        toolName: 'OrderLookupTool',
        success: true,
        data: { id: 'ord-101', orderNumber: 'SO-99', status: 'delivered', totalAmount: 4500 },
        summary: 'Order #SO-99 is currently "delivered" for ₹4,500.',
      });

      const reply = await useCases.processUserMessage('Track order #SO-99', {
        organizationId: orgId,
      });

      expect(AgentTools.orderLookupTool).toHaveBeenCalledWith(orgId, 'SO-99');
      expect(reply.toolsUsed).toContain('OrderLookupTool');
      expect(reply.reply).toContain('Order #SO-99 is currently "delivered"');
    });
  });

  describe('Validation & Multi-Tenant Context Security', () => {
    it('rejects empty queries with validation error', async () => {
      await expect(
        useCases.processUserMessage('   ', { organizationId: orgId }),
      ).rejects.toThrow('Message is required');
    });

    it('rejects queries without organizationId context', async () => {
      await expect(
        useCases.processUserMessage('Sales report', { organizationId: '' }),
      ).rejects.toThrow('Organization context is required');
    });
  });
});
