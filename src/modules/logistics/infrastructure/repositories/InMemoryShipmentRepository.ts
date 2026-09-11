import { Shipment, ShipmentProps } from '../../domain/entities/Shipment';
import {
  IShipmentRepository,
  ShipmentListQuery,
  ShipmentListResult,
  ShipmentDetailResult,
  OperationsSummaryResult,
  ShipmentActivityItem,
  ShipmentEventItem,
} from '../../domain/ports/IShipmentRepository';

export class InMemoryShipmentRepository implements IShipmentRepository {
  private shipments = new Map<string, ShipmentProps>();
  private activities: ShipmentActivityItem[] = [];
  private events: ShipmentEventItem[] = [];

  async save(shipment: Shipment): Promise<Shipment> {
    this.shipments.set(shipment.id, shipment.toPersistence());
    return shipment;
  }

  async update(shipment: Shipment): Promise<Shipment> {
    this.shipments.set(shipment.id, shipment.toPersistence());
    return shipment;
  }

  async findById(orgId: string, id: string): Promise<Shipment | null> {
    const props = this.shipments.get(id);
    if (!props || props.organizationId !== orgId) return null;
    return Shipment.fromPersistence(props);
  }

  async findAll(orgId: string, query: ShipmentListQuery): Promise<ShipmentListResult> {
    let list = Array.from(this.shipments.values()).filter(s => s.organizationId === orgId);

    if (query.status) {
      list = list.filter(s => s.status === query.status);
    }
    if (query.fulfillmentMode) {
      list = list.filter(s => s.fulfillmentMode === query.fulfillmentMode);
    }
    if (query.storeId) {
      list = list.filter(s => s.storeId === query.storeId);
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      list = list.filter(s =>
        s.shipmentNumber.toLowerCase().includes(term) ||
        s.trackingNumber.toLowerCase().includes(term) ||
        (s.customer?.name && s.customer.name.toLowerCase().includes(term)),
      );
    }

    list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = list.length;
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 50, 200);
    const startIndex = (page - 1) * limit;

    return {
      items: list.slice(startIndex, startIndex + limit).map(p => Shipment.fromPersistence(p)),
      total,
      page,
      limit,
    };
  }

  async getDetail(orgId: string, id: string): Promise<ShipmentDetailResult> {
    const shipment = await this.findById(orgId, id);
    if (!shipment) {
      throw new Error('Shipment not found');
    }

    const activity = this.activities
      .filter(a => a.organizationId === orgId && a.shipmentId === id)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const events = this.events
      .filter(e => e.organizationId === orgId && e.aggregateId === id)
      .sort((a, b) => a.sequence - b.sequence);

    return { shipment, activity, events };
  }

  async getOperationsSummary(orgId: string): Promise<OperationsSummaryResult> {
    const orgShipments = Array.from(this.shipments.values()).filter(s => s.organizationId === orgId);

    const statusCounts = new Map<string, number>();
    let slaRisk = 0;
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    for (const s of orgShipments) {
      statusCounts.set(s.status, (statusCounts.get(s.status) || 0) + 1);

      if (
        !['delivered', 'returned', 'cancelled'].includes(s.status) &&
        s.slaDeadlineAt &&
        s.slaDeadlineAt <= oneHourFromNow
      ) {
        slaRisk++;
      }
    }

    const byStatus = Array.from(statusCounts.entries())
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count);

    const recent = orgShipments
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, 8)
      .map(p => Shipment.fromPersistence(p));

    return {
      byStatus,
      slaRisk,
      recent,
      generatedAt: new Date().toISOString(),
    };
  }

  async recordEvent(event: Omit<ShipmentEventItem, 'id' | 'createdAt'>): Promise<void> {
    this.events.push({
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date(),
    });
  }

  async recordActivity(activity: Omit<ShipmentActivityItem, 'id' | 'createdAt'>): Promise<void> {
    this.activities.push({
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date(),
    });
  }
}
