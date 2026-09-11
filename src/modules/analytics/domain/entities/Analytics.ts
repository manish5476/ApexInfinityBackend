// ─────────────────────────────────────────────────────────────────────────────
//  Analytics & BI — Domain Models & Value Types
//  Pure domain types for reports, charts, and customer feeds.
// ─────────────────────────────────────────────────────────────────────────────

export interface FinancialMetricTrend {
  period: string; // e.g., '2024-01'
  income: number;
  expense: number;
  netProfit: number;
}

export interface GrossProfitData {
  period: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercentage: number;
}

export interface ChartSeriesData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
  }>;
}

export interface CustomerFeedEvent {
  id: string;
  customerId: string;
  organizationId: string;
  type: 'sale' | 'payment' | 'emi_due' | 'invoice' | 'service' | 'note';
  title: string;
  description: string;
  amount?: number;
  referenceId?: string;
  timestamp: Date;
}

export interface AnalyticsDashboardOverview {
  totalRevenue: number;
  totalOrders: number;
  activeCustomers: number;
  inventoryValuation: number;
  outstandingReceivables: number;
  revenueGrowthPercentage: number;
  lastUpdated: string;
}
