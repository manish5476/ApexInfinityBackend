import mongoose from 'mongoose';
import { Shipment, ShipmentProps, ShipmentStatus } from '../../domain/entities/Shipment';
import {
  IShipmentRepository,
  ShipmentListQuery,
  ShipmentListResult,
  ShipmentDetailResult,
  OperationsSummaryResult,
  ShipmentActivityItem,
  ShipmentEventItem,
} from '../../domain/ports/IShipmentRepository';
import {
  ShipmentModel,
  ShipmentDoc,
  ShipmentActivityModel,
  ShipmentEventModel,
} from '../persistence/shipment.model';

function toEntity(doc: ShipmentDoc): Shipment {
  const p: ShipmentProps = {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    businessId: doc.businessId?.toString() ?? null,
    storeId: doc.storeId?.toString() ?? null,
    shopId: doc.shopId?.toString() ?? null,
    warehouseId: doc.warehouseId?.toString() ?? null,
    shipmentNumber: doc.shipmentNumber,
    trackingNumber: doc.trackingNumber,
    sourceType: doc.sourceType as ShipmentProps['sourceType'],
    sourceId: doc.sourceId?.toString() ?? null,
    sourceNumber: doc.sourceNumber,
    fulfillmentMode: doc.fulfillmentMode as ShipmentProps['fulfillmentMode'],
    providerId: doc.providerId?.toString() ?? null,
    partnerId: doc.partnerId?.toString() ?? null,
    assignedDriverId: doc.assignedDriverId?.toString() ?? null,
    assignedVehicleId: doc.assignedVehicleId?.toString() ?? null,
    status: doc.status as ShipmentStatus,
    priority: doc.priority as ShipmentProps['priority'],
    serviceLevel: doc.serviceLevel as ShipmentProps['serviceLevel'],
    slaDeadlineAt: doc.slaDeadlineAt,
    scheduledPickupAt: doc.scheduledPickupAt,
    promisedDeliveryAt: doc.promisedDeliveryAt,
    pickupAddress: doc.pickupAddress as ShipmentProps['pickupAddress'],
    dropoffAddress: doc.dropoffAddress as ShipmentProps['dropoffAddress'],
    returnAddress: doc.returnAddress as ShipmentProps['returnAddress'],
    parcels: (doc.parcels ?? []).map((parcel: any) => ({
      id: parcel._id?.toString(),
      sku: parcel.sku,
      description: parcel.description,
      quantity: parcel.quantity,
      weightGrams: parcel.weightGrams,
      lengthCm: parcel.lengthCm,
      widthCm: parcel.widthCm,
      heightCm: parcel.heightCm,
      declaredValue: parcel.declaredValue,
    })),
    cod: {
      enabled: doc.cod?.enabled ?? false,
      amount: doc.cod?.amount ?? 0,
      collected: doc.cod?.collected ?? false,
      collectedAt: doc.cod?.collectedAt ?? null,
    },
    customer: {
      name: doc.customer?.name,
      phone: doc.customer?.phone,
      email: doc.customer?.email,
    },
    lastEventType: doc.lastEventType,
    lastEventAt: doc.lastEventAt,
    notes: doc.notes,
    metadata: doc.metadata,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return Shipment.fromPersistence(p);
}

function toDoc(shipment: Shipment): Record<string, unknown> {
  const p = shipment.toPersistence();
  return {
    organizationId: p.organizationId,
    businessId: p.businessId,
    storeId: p.storeId,
    shopId: p.shopId,
    warehouseId: p.warehouseId,
    shipmentNumber: p.shipmentNumber,
    trackingNumber: p.trackingNumber,
    sourceType: p.sourceType,
    sourceId: p.sourceId,
    sourceNumber: p.sourceNumber,
    fulfillmentMode: p.fulfillmentMode,
    providerId: p.providerId,
    partnerId: p.partnerId,
    assignedDriverId: p.assignedDriverId,
    assignedVehicleId: p.assignedVehicleId,
    status: p.status,
    priority: p.priority,
    serviceLevel: p.serviceLevel,
    slaDeadlineAt: p.slaDeadlineAt,
    scheduledPickupAt: p.scheduledPickupAt,
    promisedDeliveryAt: p.promisedDeliveryAt,
    pickupAddress: p.pickupAddress,
    dropoffAddress: p.dropoffAddress,
    returnAddress: p.returnAddress,
    parcels: p.parcels,
    cod: p.cod,
    customer: p.customer,
    lastEventType: p.lastEventType,
    lastEventAt: p.lastEventAt,
    notes: p.notes,
    metadata: p.metadata,
  };
}

export class MongoShipmentRepository implements IShipmentRepository {
  async save(shipment: Shipment): Promise<Shipment> {
    const doc = await ShipmentModel.create(toDoc(shipment));
    return toEntity(doc);
  }

  async update(shipment: Shipment): Promise<Shipment> {
    const doc = await ShipmentModel.findByIdAndUpdate(
      shipment.id,
      { $set: toDoc(shipment) },
      { new: true },
    ).lean<ShipmentDoc>();
    if (!doc) throw new Error(`Shipment ${shipment.id} not found`);
    return toEntity(doc as ShipmentDoc);
  }

  async findById(orgId: string, id: string): Promise<Shipment | null> {
    const doc = await ShipmentModel.findOne({ _id: id, organizationId: orgId }).lean<ShipmentDoc>();
    if (!doc) return null;
    return toEntity(doc as ShipmentDoc);
  }

  async findAll(orgId: string, query: ShipmentListQuery): Promise<ShipmentListResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { organizationId: orgId };
    if (query.status) filter.status = query.status;
    if (query.fulfillmentMode) filter.fulfillmentMode = query.fulfillmentMode;
    if (query.storeId) filter.storeId = query.storeId;
    if (query.search) {
      filter.$or = [
        { shipmentNumber: new RegExp(query.search, 'i') },
        { trackingNumber: new RegExp(query.search, 'i') },
        { sourceNumber: new RegExp(query.search, 'i') },
        { 'customer.name': new RegExp(query.search, 'i') },
        { 'customer.phone': new RegExp(query.search, 'i') },
      ];
    }

    const limit = Math.min(Number(query.limit) || 50, 200);
    const page = Math.max(Number(query.page) || 1, 1);

    const [docs, total] = await Promise.all([
      ShipmentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<ShipmentDoc[]>(),
      ShipmentModel.countDocuments(filter),
    ]);

    return {
      items: docs.map(toEntity),
      total,
      page,
      limit,
    };
  }

  async getDetail(orgId: string, id: string): Promise<ShipmentDetailResult> {
    const [doc, activities, events] = await Promise.all([
      ShipmentModel.findOne({ _id: id, organizationId: orgId }).lean<ShipmentDoc>(),
      ShipmentActivityModel.find({ shipmentId: id, organizationId: orgId })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      ShipmentEventModel.find({ aggregateId: id, organizationId: orgId })
        .sort({ sequence: 1 })
        .lean(),
    ]);

    if (!doc) {
      throw new Error('Shipment not found');
    }

    const mappedActivities: ShipmentActivityItem[] = activities.map((a: any) => ({
      id: a._id.toString(),
      organizationId: a.organizationId.toString(),
      shipmentId: a.shipmentId.toString(),
      type: a.type,
      title: a.title,
      body: a.body,
      actorId: a.actorId?.toString() ?? null,
      actorName: a.actorName,
      metadata: a.metadata,
      createdAt: a.createdAt,
    }));

    const mappedEvents: ShipmentEventItem[] = events.map((e: any) => ({
      id: e._id.toString(),
      organizationId: e.organizationId.toString(),
      aggregateId: e.aggregateId.toString(),
      eventType: e.eventType,
      sequence: e.sequence,
      actorId: e.actorId?.toString() ?? null,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      reason: e.reason,
      payload: e.payload,
      createdAt: e.createdAt,
    }));

    return {
      shipment: toEntity(doc as ShipmentDoc),
      activity: mappedActivities,
      events: mappedEvents,
    };
  }

  async getOperationsSummary(orgId: string): Promise<OperationsSummaryResult> {
    const scopedOrgId = new mongoose.Types.ObjectId(String(orgId));
    const now = new Date();
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

    const [byStatus, slaRisk, recentDocs] = await Promise.all([
      ShipmentModel.aggregate([
        { $match: { organizationId: scopedOrgId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ShipmentModel.countDocuments({
        organizationId: orgId,
        status: { $nin: ['delivered', 'returned', 'cancelled'] },
        slaDeadlineAt: { $lte: oneHourFromNow },
      }),
      ShipmentModel.find({ organizationId: orgId })
        .sort({ updatedAt: -1 })
        .limit(8)
        .lean<ShipmentDoc[]>(),
    ]);

    return {
      byStatus,
      slaRisk,
      recent: recentDocs.map(toEntity),
      generatedAt: new Date().toISOString(),
    };
  }

  async recordEvent(event: Omit<ShipmentEventItem, 'id' | 'createdAt'>): Promise<void> {
    await ShipmentEventModel.create(event);
  }

  async recordActivity(activity: Omit<ShipmentActivityItem, 'id' | 'createdAt'>): Promise<void> {
    await ShipmentActivityModel.create(activity);
  }
}
