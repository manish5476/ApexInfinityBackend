import { WorkAssignment } from '../../../../src/modules/field-service/domain/entities/WorkAssignment';
import {
  WorkAssignmentUseCases,
  CreateSeriesResult,
} from '../../../../src/modules/field-service/application/use-cases/WorkAssignmentUseCases';
import { InMemoryWorkAssignmentRepository } from '../../../../src/modules/field-service/infrastructure/repositories/InMemoryWorkAssignmentRepository';

// ─────────────────────────────────────────────────────────────────────────────
//  Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRepo() {
  return new InMemoryWorkAssignmentRepository();
}

function makeUseCases(repo = makeRepo()) {
  return { useCases: new WorkAssignmentUseCases(repo), repo };
}

/** Type guard: CreateSeriesResult has a 'count' property; WorkAssignment does not. */
function isSeries(
  r: WorkAssignment | CreateSeriesResult,
): r is CreateSeriesResult {
  return 'count' in r;
}

const ORG = 'org-001';
const ACTOR = 'user-001';

const baseInput = {
  title: 'Fix HVAC Unit',
  organizationId: ORG,
  priority: 'high' as const,
  createdBy: ACTOR,
};

// ─────────────────────────────────────────────────────────────────────────────
//  Domain entity tests
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignment domain entity', () => {
  it('creates with draft status and medium priority by default', () => {
    const wa = WorkAssignment.create('wa-1', {
      title: 'Test',
      organizationId: ORG,
    });
    expect(wa.status).toBe('draft');
    expect(wa.priority).toBe('medium');
    expect(wa.inventoryItems).toHaveLength(0);
    expect(wa.sla.breached).toBe(false);
  });

  it('trims the title on creation', () => {
    const wa = WorkAssignment.create('wa-2', { title: '  Trim Me  ', organizationId: ORG });
    expect(wa.title).toBe('Trim Me');
  });

  it('transitionStatus advances status and remains immutable', () => {
    const wa = WorkAssignment.create('wa-3', { title: 'T', organizationId: ORG });
    const assigned = wa.transitionStatus('assigned');
    expect(assigned.status).toBe('assigned');
    expect(wa.status).toBe('draft'); // original unchanged
  });

  it('transitionStatus records actualArrival when transitioning to arrived', () => {
    const wa = WorkAssignment.create('wa-4', { title: 'T', organizationId: ORG });
    const now = new Date('2025-01-01T10:00:00Z');
    const arrived = wa.transitionStatus('arrived', now);
    expect(arrived.sla.actualArrival).toEqual(now);
  });

  it('transitionStatus records actualCompletion when transitioning to completed', () => {
    const wa = WorkAssignment.create('wa-5', { title: 'T', organizationId: ORG });
    const now = new Date();
    const completed = wa.transitionStatus('completed', now);
    expect(completed.sla.actualCompletion).toEqual(now);
  });

  it('transitionStatus flags SLA breach when completionDeadline is past', () => {
    const past = new Date(Date.now() - 60_000); // 1 minute ago
    const wa = WorkAssignment.create('wa-6', {
      title: 'T',
      organizationId: ORG,
      sla: { completionDeadline: past, breached: false },
    });
    const closed = wa.transitionStatus('closed');
    expect(closed.sla.breached).toBe(true);
    expect(closed.sla.breachType).toBe('completion');
  });

  it('throws when transitioning out of a terminal state', () => {
    const wa = WorkAssignment.create('wa-7', { title: 'T', organizationId: ORG });
    const cancelled = wa.transitionStatus('cancelled');
    expect(() => cancelled.transitionStatus('assigned')).toThrow(
      'Cannot transition from terminal state "cancelled"',
    );
  });

  it('isTerminal() returns true for terminal states', () => {
    for (const status of ['completed', 'verified', 'closed', 'cancelled'] as const) {
      const wa = WorkAssignment.fromPersistence({
        ...WorkAssignment.create('x', { title: 'T', organizationId: ORG }).toPersistence(),
        id: 'wa-term',
        status,
      });
      expect(wa.isTerminal()).toBe(true);
    }
  });

  it('addInventoryItem appends an item', () => {
    const wa = WorkAssignment.create('wa-8', { title: 'T', organizationId: ORG });
    const updated = wa.addInventoryItem('item-1', 'prod-1', 5);
    expect(updated.inventoryItems).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updated.inventoryItems[0]!.qty).toBe(5);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(updated.inventoryItems[0]!.consumed).toBe(false);
  });

  it('consumeInventoryItem marks the item consumed', () => {
    const wa = WorkAssignment.create('wa-9', { title: 'T', organizationId: ORG });
    const withItem = wa.addInventoryItem('item-1', 'prod-1', 2);
    const consumed = withItem.consumeInventoryItem('item-1');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(consumed.inventoryItems[0]!.consumed).toBe(true);
  });

  it('calculateActualDuration returns minutes from scheduledAt to actualCompletion', () => {
    const scheduledAt = new Date('2025-01-01T08:00:00Z');
    const actualCompletion = new Date('2025-01-01T10:30:00Z'); // 150 minutes later
    const wa = WorkAssignment.fromPersistence({
      ...WorkAssignment.create('dur-1', { title: 'T', organizationId: ORG }).toPersistence(),
      id: 'dur-1',
      scheduledAt,
      sla: { breached: false, actualCompletion },
    });
    expect(wa.calculateActualDuration()).toBe(150);
  });

  it('calculateActualDuration returns undefined when timestamps are missing', () => {
    const wa = WorkAssignment.create('wa-10', { title: 'T', organizationId: ORG });
    expect(wa.calculateActualDuration()).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Use Case tests — create
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignmentUseCases.create()', () => {
  it('creates a single non-recurring assignment', async () => {
    const { useCases } = makeUseCases();
    const result = await useCases.create({ ...baseInput });
    expect(result).toBeInstanceOf(WorkAssignment);
    expect((result as WorkAssignment).title).toBe('Fix HVAC Unit');
    expect((result as WorkAssignment).status).toBe('draft');
  });

  it('creates a recurring series and returns seriesId + count + first', async () => {
    const { useCases } = makeUseCases();
    const scheduledAt = '2025-03-01T09:00:00.000Z';
    const result = await useCases.create({
      ...baseInput,
      scheduledAt,
      recurrenceRule: { frequency: 'daily', interval: 1, maxOccurrences: 5 },
    });
    expect(isSeries(result)).toBe(true);
    if (isSeries(result)) {
      expect(result.count).toBe(5);
      expect(result.first).toBeInstanceOf(WorkAssignment);
      expect(result.first.status).toBe('scheduled');
    }
  });

  it('throws when recurrence rule produces no occurrences', async () => {
    const { useCases } = makeUseCases();
    await expect(
      useCases.create({
        ...baseInput,
        scheduledAt: '2025-01-01T09:00:00.000Z',
        recurrenceRule: {
          frequency: 'daily',
          interval: 1,
          endDate: '2024-12-31T23:59:59.000Z', // before scheduledAt
          maxOccurrences: 10,
        },
      }),
    ).rejects.toThrow('Recurrence rule produced no occurrences');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Use Case tests — getById
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignmentUseCases.getById()', () => {
  it('throws when assignment is not found', async () => {
    const { useCases } = makeUseCases();
    await expect(useCases.getById(ORG, 'nonexistent')).rejects.toThrow('Work assignment not found');
  });

  it('returns the assignment when found', async () => {
    const { useCases } = makeUseCases();
    const created = await useCases.create({ ...baseInput }) as WorkAssignment;
    const found = await useCases.getById(ORG, created.id);
    expect(found.id).toBe(created.id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Use Case tests — updateStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignmentUseCases.updateStatus()', () => {
  it('transitions status successfully', async () => {
    const { useCases } = makeUseCases();
    const created = await useCases.create({ ...baseInput }) as WorkAssignment;
    const updated = await useCases.updateStatus(ORG, created.id, 'assigned', ACTOR);
    expect(updated.status).toBe('assigned');
  });

  it('throws when transitioning from a terminal state', async () => {
    const { useCases } = makeUseCases();
    const created = await useCases.create({ ...baseInput }) as WorkAssignment;
    await useCases.updateStatus(ORG, created.id, 'cancelled', ACTOR);
    await expect(
      useCases.updateStatus(ORG, created.id, 'assigned', ACTOR),
    ).rejects.toThrow('Cannot transition from terminal state "cancelled"');
  });

  it('detects SLA breach on completion', async () => {
    const { useCases } = makeUseCases();
    const past = new Date(Date.now() - 60_000);
    const created = await useCases.create({
      ...baseInput,
      sla: { completionDeadline: past, breached: false },
    }) as WorkAssignment;
    const completed = await useCases.updateStatus(ORG, created.id, 'completed', ACTOR);
    expect(completed.sla.breached).toBe(true);
    expect(completed.sla.breachType).toBe('completion');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Use Case tests — complete
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignmentUseCases.complete()', () => {
  it('transitions to completed and records customer rating', async () => {
    const { useCases } = makeUseCases();
    const created = await useCases.create({
      ...baseInput,
      scheduledAt: new Date(Date.now() - 120_000).toISOString(), // 2 min ago
    }) as WorkAssignment;
    const completed = await useCases.complete(
      ORG,
      created.id,
      { customerRating: 5, firstVisitResolution: true, completionRate: 100 },
      ACTOR,
    );
    expect(completed.status).toBe('completed');
    expect(completed.ai.customerRating).toBe(5);
    expect(completed.ai.firstVisitResolution).toBe(true);
    expect(completed.ai.completionRate).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Use Case tests — calendar & series
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignmentUseCases — calendar & series', () => {
  it('getCalendarRange returns assignments within date window', async () => {
    const { useCases } = makeUseCases();
    await useCases.create({
      ...baseInput,
      scheduledAt: '2025-06-15T09:00:00.000Z',
    });
    await useCases.create({
      ...baseInput,
      title: 'Out of range',
      scheduledAt: '2025-07-01T09:00:00.000Z',
    });
    const results = await useCases.getCalendarRange(
      ORG,
      '2025-06-01T00:00:00.000Z',
      '2025-06-30T23:59:59.000Z',
    );
    expect(results).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(results[0]!.title).toBe('Fix HVAC Unit');
  });

  it('getSeries returns all occurrences of a recurring assignment', async () => {
    const { useCases } = makeUseCases();
    const result = await useCases.create({
      ...baseInput,
      scheduledAt: '2025-03-01T09:00:00.000Z',
      recurrenceRule: { frequency: 'daily', interval: 1, maxOccurrences: 3 },
    });
    if (isSeries(result)) {
      const series = await useCases.getSeries(ORG, result.seriesId);
      expect(series).toHaveLength(3);
    } else {
      fail('Expected a series result');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Use Case tests — stats
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignmentUseCases.getStats()', () => {
  it('returns aggregated stats', async () => {
    const { useCases } = makeUseCases();
    await useCases.create({ ...baseInput });
    await useCases.create({ ...baseInput, title: 'Another job' });
    const stats = await useCases.getStats(ORG);
    expect(stats.byStatus.find(s => s.status === 'draft')?.count).toBe(2);
    expect(stats.byPriority.find(p => p.priority === 'high')?.count).toBe(2);
    expect(stats.sla.total).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
//  Use Case tests — SLA at risk
// ─────────────────────────────────────────────────────────────────────────────

describe('WorkAssignmentUseCases.getSlaAtRisk()', () => {
  it('returns assignments that are past their SLA deadline', async () => {
    const { useCases } = makeUseCases();
    const pastDeadline = new Date(Date.now() - 3_600_000); // 1 hour ago
    await useCases.create({
      ...baseInput,
      sla: { completionDeadline: pastDeadline, breached: false },
    });
    const atRisk = await useCases.getSlaAtRisk(ORG);
    expect(atRisk.length).toBeGreaterThanOrEqual(1);
  });

  it('does not return already-terminal assignments', async () => {
    const { useCases } = makeUseCases();
    const pastDeadline = new Date(Date.now() - 3_600_000);
    const created = await useCases.create({
      ...baseInput,
      sla: { completionDeadline: pastDeadline, breached: false },
    }) as WorkAssignment;
    await useCases.updateStatus(ORG, created.id, 'cancelled', ACTOR);
    const atRisk = await useCases.getSlaAtRisk(ORG);
    expect(atRisk.find(a => a.id === created.id)).toBeUndefined();
  });
});
