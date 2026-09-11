import { ShipmentUseCases } from '../../../../src/modules/logistics/application/use-cases/ShipmentUseCases';
import { InMemoryShipmentRepository } from '../../../../src/modules/logistics/infrastructure/repositories/InMemoryShipmentRepository';
import { Shipment } from '../../../../src/modules/logistics/domain/entities/Shipment';

describe('Logistics Module — Shipment Use Cases', () => {
  let repo: InMemoryShipmentRepository;
  let useCases: ShipmentUseCases;

  const orgId = 'org-logistics-101';
  const pickupAddress = {
    fullName: 'Central Warehouse',
    addressLine1: '100 Industrial Parkway',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
  };
  const dropoffAddress = {
    fullName: 'Rahul Sharma',
    phone: '+919876543210',
    addressLine1: '42 Marine Drive',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400020',
  };

  beforeEach(() => {
    repo = new InMemoryShipmentRepository();
    useCases = new ShipmentUseCases(repo);
  });

  describe('Shipment Creation', () => {
    it('creates a shipment in draft state with auto-generated tracking and shipment numbers', async () => {
      const shipment = await useCases.createShipment({
        organizationId: orgId,
        pickupAddress,
        dropoffAddress,
        parcels: [
          { sku: 'LAPTOP-PRO', description: 'Gaming Laptop', quantity: 1, weightGrams: 2500 },
        ],
        cod: { enabled: true, amount: 75000, collected: false },
        customer: { name: 'Rahul Sharma', phone: '+919876543210', email: 'rahul@example.com' },
      });

      expect(shipment.id).toBeDefined();
      expect(shipment.status).toBe('draft');
      expect(shipment.shipmentNumber).toMatch(/^SHP-\d{8}-[A-Z0-9]+$/);
      expect(shipment.trackingNumber).toMatch(/^APX[A-Z0-9]+$/);
      expect(shipment.cod.enabled).toBe(true);
      expect(shipment.cod.amount).toBe(75000);
      expect(shipment.cod.collected).toBe(false);
      expect(shipment.parcels).toHaveLength(1);
    });

    it('throws when organizationId is missing', async () => {
      await expect(
        useCases.createShipment({
          organizationId: '',
          pickupAddress,
          dropoffAddress,
        }),
      ).rejects.toThrow('organizationId is required');
    });
  });

  describe('State Machine & Transitions', () => {
    let testShipment: Shipment;

    beforeEach(async () => {
      testShipment = await useCases.createShipment({
        organizationId: orgId,
        pickupAddress,
        dropoffAddress,
        parcels: [{ sku: 'PHONE-X', quantity: 1 }],
      });
    });

    it('advances shipment through valid lifecycle flow: draft -> ready -> assign -> accept -> start_pickup -> arrive -> confirm -> start_transit -> deliver', async () => {
      // 1. Mark ready
      let current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'mark_ready',
      });
      expect(current.status).toBe('ready_for_fulfillment');

      // 2. Assign to driver
      current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'assign',
        assignedDriverId: 'driver-007',
        assignedVehicleId: 'veh-001',
      });
      expect(current.status).toBe('assigned');
      expect(current.assignedDriverId).toBe('driver-007');
      expect(current.assignedVehicleId).toBe('veh-001');

      // 3. Driver accepts
      current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'accept',
      });
      expect(current.status).toBe('accepted');

      // 4. Start pickup
      current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'start_pickup',
      });
      expect(current.status).toBe('pickup_started');

      // 5. Arrive at pickup
      current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'arrive_pickup',
      });
      expect(current.status).toBe('arrived_at_pickup');

      // 6. Confirm pickup (picked up)
      current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'confirm_pickup',
      });
      expect(current.status).toBe('picked_up');

      // 7. Start transit
      current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'start_transit',
      });
      expect(current.status).toBe('in_transit');

      // 8. Deliver with COD collection
      current = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'deliver',
        codCollected: true,
      });
      expect(current.status).toBe('delivered');
      expect(current.cod.collected).toBe(true);
      expect(current.isTerminal()).toBe(true);
    });

    it('rejects illegal transition and throws descriptive error', async () => {
      // Trying to jump from draft straight to delivered
      await expect(
        useCases.transitionShipment(orgId, testShipment.id, {
          command: 'deliver',
        }),
      ).rejects.toThrow('Cannot apply "deliver" when shipment is in status "draft"');
    });

    it('prevents any transition once in a terminal state (e.g. cancelled)', async () => {
      // Cancel from draft
      const cancelled = await useCases.transitionShipment(orgId, testShipment.id, {
        command: 'cancel',
        reason: 'Customer requested cancellation',
      });
      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.isTerminal()).toBe(true);

      // Attempting transition after cancel fails
      await expect(
        useCases.transitionShipment(orgId, testShipment.id, {
          command: 'mark_ready',
        }),
      ).rejects.toThrow('Cannot apply "mark_ready" when shipment is in status "cancelled"');
    });
  });

  describe('Shipment Detail & Audit Trail', () => {
    it('records activity and event entries for each state transition', async () => {
      const shipment = await useCases.createShipment({
        organizationId: orgId,
        pickupAddress,
        dropoffAddress,
      });

      await useCases.transitionShipment(orgId, shipment.id, {
        command: 'mark_ready',
        reason: 'Packed and verified by warehouse',
      });

      const detail = await useCases.getShipmentDetail(orgId, shipment.id);
      expect(detail.shipment.status).toBe('ready_for_fulfillment');
      expect(detail.events.length).toBeGreaterThanOrEqual(2); // created + mark_ready
      expect(detail.activity.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Operations Summary & Queries', () => {
    it('computes aggregated counts by status and SLA risk', async () => {
      // Create 3 shipments
      const s1 = await useCases.createShipment({ organizationId: orgId, pickupAddress, dropoffAddress });
      const s2 = await useCases.createShipment({ organizationId: orgId, pickupAddress, dropoffAddress });
      const s3 = await useCases.createShipment({
        organizationId: orgId,
        pickupAddress,
        dropoffAddress,
        slaDeadlineAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins from now -> SLA risk
      });

      await useCases.transitionShipment(orgId, s1.id, { command: 'mark_ready' });
      await useCases.transitionShipment(orgId, s2.id, { command: 'cancel' });

      const summary = await useCases.getOperationsSummary(orgId);
      expect(summary.byStatus).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ _id: 'ready_for_fulfillment', count: 1 }),
          expect.objectContaining({ _id: 'cancelled', count: 1 }),
          expect.objectContaining({ _id: 'draft', count: 1 }),
        ]),
      );
      expect(summary.slaRisk).toBe(1);
      expect(summary.recent).toHaveLength(3);
    });

    it('lists shipments with status filtering and text search', async () => {
      const s1 = await useCases.createShipment({
        organizationId: orgId,
        pickupAddress,
        dropoffAddress,
        customer: { name: 'Special Customer Alpha' },
      });
      await useCases.createShipment({
        organizationId: orgId,
        pickupAddress,
        dropoffAddress,
        customer: { name: 'Customer Beta' },
      });

      const searchResult = await useCases.listShipments(orgId, { search: 'Alpha' });
      expect(searchResult.total).toBe(1);
      expect(searchResult.items[0]!.id).toBe(s1.id);
    });
  });
});
