import { Shipment, ShipmentStatus } from '../entities/Shipment';

export interface ShipmentListQuery {
  page?: number;
  limit?: number;
  status?: ShipmentStatus;
  fulfillmentMode?: string;
  storeId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ShipmentListResult {
  items: Shipment[];
  total: number;
  page: number;
  limit: number;
}

export interface ShipmentActivityItem {
  id: string;
  organizationId: string;
  shipmentId: string;
  type: string;
  title: string;
  body: string;
  actorId?: string | null;
  actorName?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ShipmentEventItem {
  id: string;
  organizationId: string;
  aggregateId: string;
  eventType: string;
  sequence: number;
  actorId?: string | null;
  fromStatus?: string;
  toStatus?: string;
  reason?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

export interface ShipmentDetailResult {
  shipment: Shipment;
  activity: ShipmentActivityItem[];
  events: ShipmentEventItem[];
}

export interface OperationsSummaryResult {
  byStatus: Array<{ _id: string; count: number }>;
  slaRisk: number;
  recent: Shipment[];
  generatedAt: string;
}

export interface IShipmentRepository {
  save(shipment: Shipment): Promise<Shipment>;
  update(shipment: Shipment): Promise<Shipment>;
  findById(orgId: string, id: string): Promise<Shipment | null>;
  findAll(orgId: string, query: ShipmentListQuery): Promise<ShipmentListResult>;
  getDetail(orgId: string, id: string): Promise<ShipmentDetailResult>;
  getOperationsSummary(orgId: string): Promise<OperationsSummaryResult>;
  recordEvent(event: Omit<ShipmentEventItem, 'id' | 'createdAt'>): Promise<void>;
  recordActivity(activity: Omit<ShipmentActivityItem, 'id' | 'createdAt'>): Promise<void>;
}
