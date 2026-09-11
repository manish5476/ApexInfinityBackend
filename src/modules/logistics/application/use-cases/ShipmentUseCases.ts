import { randomUUID } from 'crypto';
import {
  Shipment,
  ShipmentProps,
  CreateShipmentParams,
  TransitionCommand,
} from '../../domain/entities/Shipment';
import {
  IShipmentRepository,
  ShipmentListQuery,
  ShipmentListResult,
  ShipmentDetailResult,
  OperationsSummaryResult,
} from '../../domain/ports/IShipmentRepository';

export interface CreateShipmentInput extends CreateShipmentParams {
  actor?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export interface TransitionShipmentInput {
  command: TransitionCommand;
  assignedDriverId?: string | null;
  assignedVehicleId?: string | null;
  providerId?: string | null;
  partnerId?: string | null;
  codCollected?: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
  actor?: {
    id?: string;
    name?: string;
    email?: string;
  };
}

export class ShipmentUseCases {
  constructor(private readonly repo: IShipmentRepository) {}

  async createShipment(input: CreateShipmentInput): Promise<Shipment> {
    if (!input.organizationId) {
      throw new Error('organizationId is required for logistics tenancy');
    }

    const id = randomUUID();
    const shipment = Shipment.create(id, input);
    const saved = await this.repo.save(shipment);

    // Record initial event and activity
    await this.repo.recordEvent({
      organizationId: saved.organizationId,
      aggregateId: saved.id,
      eventType: 'shipment.created',
      sequence: 1,
      actorId: input.actor?.id ?? null,
      fromStatus: '',
      toStatus: saved.status,
      reason: 'Shipment created',
      payload: { sourceType: saved.sourceType, sourceId: saved.sourceId },
    });

    await this.repo.recordActivity({
      organizationId: saved.organizationId,
      shipmentId: saved.id,
      type: 'shipment.created',
      title: 'Created',
      body: `Shipment entered ${saved.status}`,
      actorId: input.actor?.id ?? null,
      actorName: input.actor?.name || input.actor?.email || '',
      metadata: { sourceType: saved.sourceType },
    });

    return saved;
  }

  async listShipments(orgId: string, query: ShipmentListQuery): Promise<ShipmentListResult> {
    if (!orgId) throw new Error('organizationId is required for logistics tenancy');
    return this.repo.findAll(orgId, query);
  }

  async getShipmentDetail(orgId: string, shipmentId: string): Promise<ShipmentDetailResult> {
    if (!orgId) throw new Error('organizationId is required for logistics tenancy');
    return this.repo.getDetail(orgId, shipmentId);
  }

  async transitionShipment(
    orgId: string,
    shipmentId: string,
    input: TransitionShipmentInput,
  ): Promise<Shipment> {
    if (!orgId) throw new Error('organizationId is required for logistics tenancy');

    const existing = await this.repo.findById(orgId, shipmentId);
    if (!existing) {
      throw new Error('Shipment not found');
    }

    const fromStatus = existing.status;
    const { shipment: transitioned, eventType } = existing.transition(input.command, {
      assignedDriverId: input.assignedDriverId,
      assignedVehicleId: input.assignedVehicleId,
      providerId: input.providerId,
      partnerId: input.partnerId,
      codCollected: input.codCollected,
    });

    const updated = await this.repo.update(transitioned);

    // Record event
    await this.repo.recordEvent({
      organizationId: orgId,
      aggregateId: shipmentId,
      eventType,
      sequence: Date.now(),
      actorId: input.actor?.id ?? null,
      fromStatus,
      toStatus: updated.status,
      reason: input.reason ?? '',
      payload: input.metadata ?? {},
    });

    // Record activity
    await this.repo.recordActivity({
      organizationId: orgId,
      shipmentId,
      type: eventType,
      title: input.command.replace(/_/g, ' ').toUpperCase(),
      body: input.reason || `Shipment moved from ${fromStatus} to ${updated.status}`,
      actorId: input.actor?.id ?? null,
      actorName: input.actor?.name || input.actor?.email || '',
      metadata: input.metadata ?? {},
    });

    return updated;
  }

  async getOperationsSummary(orgId: string): Promise<OperationsSummaryResult> {
    if (!orgId) throw new Error('organizationId is required for logistics tenancy');
    return this.repo.getOperationsSummary(orgId);
  }
}
