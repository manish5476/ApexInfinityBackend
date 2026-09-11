// ─────────────────────────────────────────────────────────────────────────────
//  Shipment — Logistics Domain Entity & State Machine
//  Pure domain model — zero infrastructure imports.
// ─────────────────────────────────────────────────────────────────────────────

export type ShipmentStatus =
  | 'draft'
  | 'ready_for_fulfillment'
  | 'pending_assignment'
  | 'assigned'
  | 'accepted'
  | 'pickup_scheduled'
  | 'pickup_started'
  | 'arrived_at_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'near_destination'
  | 'delivery_attempted'
  | 'delivered'
  | 'failed'
  | 'return_pending'
  | 'return_in_transit'
  | 'returned'
  | 'cancelled'
  | 'escalated';

export type TransitionCommand =
  | 'mark_ready'
  | 'request_assignment'
  | 'assign'
  | 'accept'
  | 'schedule_pickup'
  | 'start_pickup'
  | 'arrive_pickup'
  | 'confirm_pickup'
  | 'start_transit'
  | 'near_destination'
  | 'attempt_delivery'
  | 'deliver'
  | 'fail'
  | 'start_return'
  | 'return_in_transit'
  | 'complete_return'
  | 'cancel'
  | 'escalate';

export const TERMINAL_SHIPMENT_STATUSES: ReadonlySet<ShipmentStatus> = new Set([
  'delivered',
  'returned',
  'cancelled',
]);

export interface TransitionRule {
  from: ShipmentStatus[];
  to: ShipmentStatus;
  eventType: string;
}

export const TRANSITION_RULES: Record<TransitionCommand, TransitionRule> = {
  mark_ready: {
    from: ['draft'],
    to: 'ready_for_fulfillment',
    eventType: 'shipment.ready_for_fulfillment',
  },
  request_assignment: {
    from: ['ready_for_fulfillment'],
    to: 'pending_assignment',
    eventType: 'shipment.assignment_requested',
  },
  assign: {
    from: ['pending_assignment', 'ready_for_fulfillment'],
    to: 'assigned',
    eventType: 'shipment.assigned',
  },
  accept: {
    from: ['assigned'],
    to: 'accepted',
    eventType: 'shipment.accepted',
  },
  schedule_pickup: {
    from: ['accepted', 'assigned'],
    to: 'pickup_scheduled',
    eventType: 'shipment.pickup_scheduled',
  },
  start_pickup: {
    from: ['accepted', 'pickup_scheduled'],
    to: 'pickup_started',
    eventType: 'shipment.pickup_started',
  },
  arrive_pickup: {
    from: ['pickup_started'],
    to: 'arrived_at_pickup',
    eventType: 'shipment.arrived_at_pickup',
  },
  confirm_pickup: {
    from: ['arrived_at_pickup', 'pickup_started'],
    to: 'picked_up',
    eventType: 'shipment.picked_up',
  },
  start_transit: {
    from: ['picked_up'],
    to: 'in_transit',
    eventType: 'shipment.in_transit',
  },
  near_destination: {
    from: ['in_transit'],
    to: 'near_destination',
    eventType: 'shipment.near_destination',
  },
  attempt_delivery: {
    from: ['in_transit', 'near_destination'],
    to: 'delivery_attempted',
    eventType: 'shipment.delivery_attempted',
  },
  deliver: {
    from: ['in_transit', 'near_destination', 'delivery_attempted'],
    to: 'delivered',
    eventType: 'shipment.delivered',
  },
  fail: {
    from: [
      'pending_assignment',
      'assigned',
      'accepted',
      'pickup_started',
      'picked_up',
      'in_transit',
      'near_destination',
      'delivery_attempted',
    ],
    to: 'failed',
    eventType: 'shipment.failed',
  },
  start_return: {
    from: ['failed', 'delivery_attempted'],
    to: 'return_pending',
    eventType: 'shipment.return_requested',
  },
  return_in_transit: {
    from: ['return_pending'],
    to: 'return_in_transit',
    eventType: 'shipment.return_in_transit',
  },
  complete_return: {
    from: ['return_in_transit', 'return_pending'],
    to: 'returned',
    eventType: 'shipment.returned',
  },
  cancel: {
    from: [
      'draft',
      'ready_for_fulfillment',
      'pending_assignment',
      'assigned',
      'accepted',
      'pickup_scheduled',
    ],
    to: 'cancelled',
    eventType: 'shipment.cancelled',
  },
  escalate: {
    from: [
      'draft',
      'ready_for_fulfillment',
      'pending_assignment',
      'assigned',
      'accepted',
      'pickup_scheduled',
      'pickup_started',
      'arrived_at_pickup',
      'picked_up',
      'in_transit',
      'near_destination',
      'delivery_attempted',
      'failed',
      'return_pending',
      'return_in_transit',
      'escalated',
    ],
    to: 'escalated',
    eventType: 'shipment.escalated',
  },
};

export interface Address {
  label?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  coordinates?: { lat?: number | null; lng?: number | null };
}

export interface Parcel {
  id?: string;
  sku?: string;
  description?: string;
  quantity: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  declaredValue?: number;
}

export interface CodDetails {
  enabled: boolean;
  amount: number;
  collected: boolean;
  collectedAt?: Date | null;
}

export interface CustomerContact {
  name?: string;
  phone?: string;
  email?: string;
}

export interface ShipmentProps {
  id: string;
  organizationId: string;
  businessId?: string | null;
  storeId?: string | null;
  shopId?: string | null;
  warehouseId?: string | null;
  shipmentNumber: string;
  trackingNumber: string;
  sourceType: 'storefront_order' | 'sales_order' | 'invoice' | 'return' | 'transfer' | 'manual';
  sourceId?: string | null;
  sourceNumber?: string;
  fulfillmentMode: 'merchant_internal' | 'platform_partner' | 'hybrid_ranked' | 'manual_external' | 'pickup_only';
  providerId?: string | null;
  partnerId?: string | null;
  assignedDriverId?: string | null;
  assignedVehicleId?: string | null;
  status: ShipmentStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  serviceLevel: 'standard' | 'express' | 'same_day' | 'scheduled';
  slaDeadlineAt?: Date | null;
  scheduledPickupAt?: Date | null;
  promisedDeliveryAt?: Date | null;
  pickupAddress: Address;
  dropoffAddress: Address;
  returnAddress?: Address | null;
  parcels: Parcel[];
  cod: CodDetails;
  customer: CustomerContact;
  lastEventType?: string;
  lastEventAt?: Date | null;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateShipmentParams {
  organizationId: string;
  businessId?: string | null;
  storeId?: string | null;
  shopId?: string | null;
  warehouseId?: string | null;
  shipmentNumber?: string;
  trackingNumber?: string;
  sourceType?: ShipmentProps['sourceType'];
  sourceId?: string | null;
  sourceNumber?: string;
  fulfillmentMode?: ShipmentProps['fulfillmentMode'];
  priority?: ShipmentProps['priority'];
  serviceLevel?: ShipmentProps['serviceLevel'];
  slaDeadlineAt?: Date | null;
  scheduledPickupAt?: Date | null;
  promisedDeliveryAt?: Date | null;
  pickupAddress: Address;
  dropoffAddress: Address;
  returnAddress?: Address | null;
  parcels?: Parcel[];
  cod?: Partial<CodDetails>;
  customer?: CustomerContact;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export class Shipment {
  private readonly _props: ShipmentProps;

  private constructor(props: ShipmentProps) {
    this._props = { ...props };
  }

  static create(id: string, params: CreateShipmentParams, now = new Date()): Shipment {
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const shipmentNumber = params.shipmentNumber || `SHP-${dateStr}-${randSuffix}`;
    const trackingNumber = params.trackingNumber || `APX${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    return new Shipment({
      id,
      organizationId: params.organizationId,
      businessId: params.businessId ?? null,
      storeId: params.storeId ?? null,
      shopId: params.shopId ?? null,
      warehouseId: params.warehouseId ?? null,
      shipmentNumber,
      trackingNumber,
      sourceType: params.sourceType ?? 'manual',
      sourceId: params.sourceId ?? null,
      sourceNumber: params.sourceNumber ?? '',
      fulfillmentMode: params.fulfillmentMode ?? 'merchant_internal',
      providerId: null,
      partnerId: null,
      assignedDriverId: null,
      assignedVehicleId: null,
      status: 'draft',
      priority: params.priority ?? 'normal',
      serviceLevel: params.serviceLevel ?? 'standard',
      slaDeadlineAt: params.slaDeadlineAt ?? null,
      scheduledPickupAt: params.scheduledPickupAt ?? null,
      promisedDeliveryAt: params.promisedDeliveryAt ?? null,
      pickupAddress: params.pickupAddress,
      dropoffAddress: params.dropoffAddress,
      returnAddress: params.returnAddress ?? null,
      parcels: params.parcels ?? [],
      cod: {
        enabled: params.cod?.enabled ?? false,
        amount: params.cod?.amount ?? 0,
        collected: params.cod?.collected ?? false,
        collectedAt: params.cod?.collectedAt ?? null,
      },
      customer: params.customer ?? {},
      lastEventType: 'shipment.created',
      lastEventAt: now,
      notes: params.notes ?? '',
      metadata: params.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ShipmentProps): Shipment {
    return new Shipment(props);
  }

  get id(): string { return this._props.id; }
  get organizationId(): string { return this._props.organizationId; }
  get businessId(): string | null | undefined { return this._props.businessId; }
  get storeId(): string | null | undefined { return this._props.storeId; }
  get shopId(): string | null | undefined { return this._props.shopId; }
  get warehouseId(): string | null | undefined { return this._props.warehouseId; }
  get shipmentNumber(): string { return this._props.shipmentNumber; }
  get trackingNumber(): string { return this._props.trackingNumber; }
  get sourceType(): ShipmentProps['sourceType'] { return this._props.sourceType; }
  get sourceId(): string | null | undefined { return this._props.sourceId; }
  get sourceNumber(): string | undefined { return this._props.sourceNumber; }
  get fulfillmentMode(): ShipmentProps['fulfillmentMode'] { return this._props.fulfillmentMode; }
  get providerId(): string | null | undefined { return this._props.providerId; }
  get partnerId(): string | null | undefined { return this._props.partnerId; }
  get assignedDriverId(): string | null | undefined { return this._props.assignedDriverId; }
  get assignedVehicleId(): string | null | undefined { return this._props.assignedVehicleId; }
  get status(): ShipmentStatus { return this._props.status; }
  get priority(): ShipmentProps['priority'] { return this._props.priority; }
  get serviceLevel(): ShipmentProps['serviceLevel'] { return this._props.serviceLevel; }
  get slaDeadlineAt(): Date | null | undefined { return this._props.slaDeadlineAt; }
  get scheduledPickupAt(): Date | null | undefined { return this._props.scheduledPickupAt; }
  get promisedDeliveryAt(): Date | null | undefined { return this._props.promisedDeliveryAt; }
  get pickupAddress(): Address { return { ...this._props.pickupAddress }; }
  get dropoffAddress(): Address { return { ...this._props.dropoffAddress }; }
  get returnAddress(): Address | null | undefined { return this._props.returnAddress; }
  get parcels(): Parcel[] { return [...this._props.parcels]; }
  get cod(): CodDetails { return { ...this._props.cod }; }
  get customer(): CustomerContact { return { ...this._props.customer }; }
  get lastEventType(): string | undefined { return this._props.lastEventType; }
  get lastEventAt(): Date | null | undefined { return this._props.lastEventAt; }
  get notes(): string | undefined { return this._props.notes; }
  get metadata(): Record<string, unknown> | undefined { return this._props.metadata; }
  get createdAt(): Date { return this._props.createdAt; }
  get updatedAt(): Date { return this._props.updatedAt; }

  isTerminal(): boolean {
    return TERMINAL_SHIPMENT_STATUSES.has(this._props.status);
  }

  transition(
    command: TransitionCommand,
    options?: {
      assignedDriverId?: string | null;
      assignedVehicleId?: string | null;
      providerId?: string | null;
      partnerId?: string | null;
      codCollected?: boolean;
      now?: Date;
    },
  ): { shipment: Shipment; eventType: string } {
    const rule = TRANSITION_RULES[command];
    if (!rule) {
      throw new Error(`Unknown shipment transition command: ${command}`);
    }

    if (!rule.from.includes(this._props.status)) {
      throw new Error(`Cannot apply "${command}" when shipment is in status "${this._props.status}"`);
    }

    const now = options?.now ?? new Date();
    const updatedCod: CodDetails = { ...this._props.cod };
    if (options?.codCollected === true) {
      updatedCod.collected = true;
      updatedCod.collectedAt = now;
    }

    const updated = new Shipment({
      ...this._props,
      status: rule.to,
      lastEventType: rule.eventType,
      lastEventAt: now,
      assignedDriverId: options?.assignedDriverId !== undefined ? options.assignedDriverId : this._props.assignedDriverId,
      assignedVehicleId: options?.assignedVehicleId !== undefined ? options.assignedVehicleId : this._props.assignedVehicleId,
      providerId: options?.providerId !== undefined ? options.providerId : this._props.providerId,
      partnerId: options?.partnerId !== undefined ? options.partnerId : this._props.partnerId,
      cod: updatedCod,
      updatedAt: now,
    });

    return { shipment: updated, eventType: rule.eventType };
  }

  toPersistence(): ShipmentProps {
    return { ...this._props };
  }
}
