import { AgentTools } from '../tools/AgentTools';
import { AiAgentReply, AiUserContext } from '../../domain/entities/AiAgent';

export class AiAgentUseCases {
  /**
   * Processes a natural language prompt from the user against live MongoDB business data.
   */
  async processUserMessage(message: string, context: AiUserContext): Promise<AiAgentReply> {
    if (!message || !message.trim()) {
      throw new Error('Message is required');
    }

    const orgId = context.organizationId;
    if (!orgId) {
      throw new Error('Organization context is required to query business data');
    }

    const text = message.trim();
    const lower = text.toLowerCase();
    const toolsUsed: string[] = [];
    let reply = '';
    let data: unknown = null;

    // Intent 1: Sales / Revenue / Financials
    if (/\b(sales|revenue|turnover|income|financial|earnings)\b/.test(lower)) {
      toolsUsed.push('SalesAnalyticsTool');
      const result = await AgentTools.salesAnalyticsTool(orgId, context.branchId);
      data = result.data;
      reply = `Apex AI Financial Analysis: ${result.summary}`;
      return {
        reply,
        toolsUsed,
        data,
        timestamp: new Date().toISOString(),
      };
    }

    // Intent 2: Inventory / Stock / Products
    if (/\b(product|stock|inventory|valuation|catalog|reorder|items)\b/.test(lower)) {
      toolsUsed.push('InventoryStockTool');
      // Extract optional product search term (e.g. "stock for keyboard" or "product iPhone")
      const match = text.match(/(?:product|stock|item|for|named)\s+([a-zA-Z0-9\s\-]+)/i);
      const searchTerm = match ? match[1]?.trim() : undefined;

      const result = await AgentTools.inventoryStockTool(orgId, searchTerm);
      data = result.data;
      reply = `Apex AI Inventory Intelligence: ${result.summary}`;
      return {
        reply,
        toolsUsed,
        data,
        timestamp: new Date().toISOString(),
      };
    }

    // Intent 3: Customer Outstanding Dues / Credit
    if (/\b(due|dues|debt|debtor|owing|receivable|credit|outstanding)\b/.test(lower)) {
      toolsUsed.push('CustomerDuesTool');
      const minAmountMatch = text.match(/(?:>|greater than|over|above|exceeding)\s*(\d+)/i);
      const minAmount = minAmountMatch ? parseInt(minAmountMatch[1]!, 10) : 0;

      const result = await AgentTools.customerDuesTool(orgId, minAmount);
      data = result.data;
      reply = `Apex AI Receivables Advisory: ${result.summary}`;
      return {
        reply,
        toolsUsed,
        data,
        timestamp: new Date().toISOString(),
      };
    }

    // Intent 4: Order Lookup
    if (/\b(order|tracking|fulfillment|shipment|delivery)\b/.test(lower)) {
      const orderMatch = text.match(/(?:order|#|tracking)\s*([A-Za-z0-9\-]+)/i);
      const orderQuery = orderMatch ? orderMatch[1]!.trim() : text;

      toolsUsed.push('OrderLookupTool');
      const result = await AgentTools.orderLookupTool(orgId, orderQuery);
      data = result.data;
      reply = `Apex AI Order Tracking: ${result.summary}`;
      return {
        reply,
        toolsUsed,
        data,
        timestamp: new Date().toISOString(),
      };
    }

    // Default Fallback: Guided AI Business Assistant with real catalog metadata
    const generalStock = await AgentTools.inventoryStockTool(orgId);
    const generalSales = await AgentTools.salesAnalyticsTool(orgId, context.branchId);

    reply = `Apex AI Assistant: I can assist you with real-time operations across your organization. ` +
      `Currently you have ${generalStock.data && (generalStock.data as any).totalProducts || 0} active products in inventory ` +
      `and ${generalSales.data && (generalSales.data as any).invoiceCount || 0} recorded invoices. ` +
      `You can ask me questions like: "What is our current revenue?", "Show low stock products", "Which customers owe dues > 10000?", or "Track order #ORD-101".`;

    return {
      reply,
      toolsUsed: ['SalesAnalyticsTool', 'InventoryStockTool'],
      data: { sales: generalSales.data, inventory: generalStock.data },
      timestamp: new Date().toISOString(),
    };
  }
}
