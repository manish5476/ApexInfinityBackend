import { randomUUID } from 'crypto';
import {
  WorkAssignment,
  WorkAssignmentStatus,
  WorkAssignmentPriority,
  RecurrenceRule,
  WorkAssignmentSla,
  WorkAssignmentLocation,
  InventoryItem,
} from '../../domain/entities/WorkAssignment';
import {
  IWorkAssignmentRepository,
  WorkAssignmentListQuery,
  WorkAssignmentListResult,
  WorkAssignmentStats,
} from '../../domain/ports/IWorkAssignmentRepository';

// ─────────────────────────────────────────────────────────────────────────────
//  Input types
// ─────────────────────────────────────────────────────────────────────────────

export interface WorkAssignmentSlaInput {
  responseDeadline?: string | Date;
  arrivalDeadline?: string | Date;
  completionDeadline?: string | Date;
  breached?: boolean;
  breachType?: 'response' | 'arrival' | 'completion';
  breachReason?: string;
}

export interface CreateWorkAssignmentInput {
  title: string;
  description?: string;
  internalNotes?: string;
  priority?: WorkAssignmentPriority;
  organizationId: string;
  assignedTo?: string[];
  customerId?: string;
  branchId?: string;
  requiredSkills?: string[];
  location?: WorkAssignmentLocation;
  travelTimeEstimateMins?: number;
  scheduledAt?: string | Date;
  estimatedDurationMins?: number;
  sla?: WorkAssignmentSlaInput;
  inventoryItems?: Array<{ productId: string; qty: number }>;
  recurrenceRule?: RecurrenceRule;
  createdBy?: string;
}

export interface UpdateWorkAssignmentInput {
  title?: string;
  description?: string;
  internalNotes?: string;
  priority?: WorkAssignmentPriority;
  assignedTo?: string[];
  customerId?: string;
  branchId?: string;
  requiredSkills?: string[];
  location?: WorkAssignmentLocation;
  travelTimeEstimateMins?: number;
  scheduledAt?: string | Date;
  estimatedDurationMins?: number;
  sla?: WorkAssignmentSlaInput;
  scope?: 'single' | 'future' | 'all';
  updatedBy?: string;
}

export interface CompleteWorkAssignmentInput {
  customerRating?: number;
  firstVisitResolution?: boolean;
  completionRate?: number;
  delayReason?: string;
  notes?: string;
}

export interface CreateSeriesResult {
  seriesId: string;
  count: number;
  first: WorkAssignment;
}

// ─────────────────────────────────────────────────────────────────────────────
//  iCal-compatible recurrence expansion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Expand a recurrence rule into an array of scheduled Date objects.
 * Ported from the legacy workAssignment.service.js — no external deps.
 *
 * @param startDate - First occurrence date/time
 * @param rule      - RecurrenceRule sub-document
 */
function expandRecurrence(startDate: Date, rule: RecurrenceRule): Date[] {
  const dates: Date[] = [];
  const { frequency, interval = 1, endDate, maxOccurrences = 52, daysOfWeek } = rule;
  const limit = maxOccurrences || 52; // safety cap

  let current = new Date(startDate);

  while (dates.length < limit) {
    if (endDate && current > new Date(endDate)) break;

    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      // Expand each matching day in the current week
      const weekStart = new Date(current);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday

      for (const day of [...daysOfWeek].sort()) {
        const occ = new Date(weekStart);
        occ.setDate(weekStart.getDate() + day);
        occ.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
        if (occ >= new Date(startDate) && (!endDate || occ <= new Date(endDate))) {
          dates.push(new Date(occ));
        }
        if (dates.length >= limit) break;
      }

      current.setDate(current.getDate() + 7 * interval);
      continue;
    }

    dates.push(new Date(current));

    switch (frequency) {
      case 'daily':   current.setDate(current.getDate() + interval); break;
      case 'weekly':  current.setDate(current.getDate() + 7 * interval); break;
      case 'monthly': current.setMonth(current.getMonth() + interval); break;
      case 'yearly':  current.setFullYear(current.getFullYear() + interval); break;
      default:        break;
    }

    if (!frequency) break; // non-recurring — single date only
  }

  return dates;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Coerce SLA input (which may carry ISO string dates) to WorkAssignmentSla shape. */
function parseSla(sla?: WorkAssignmentSlaInput): Partial<WorkAssignmentSla> | undefined {
  if (!sla) return undefined;
  const toDate = (v?: string | Date): Date | undefined =>
    v ? (v instanceof Date ? v : new Date(v)) : undefined;
  return {
    responseDeadline:   toDate(sla.responseDeadline),
    arrivalDeadline:    toDate(sla.arrivalDeadline),
    completionDeadline: toDate(sla.completionDeadline),
    breached:           sla.breached ?? false,
    breachType:         sla.breachType,
    breachReason:       sla.breachReason,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Use Cases
// ─────────────────────────────────────────────────────────────────────────────

export class WorkAssignmentUseCases {
  constructor(private readonly repo: IWorkAssignmentRepository) {}

  /**
   * Create a single or recurring work assignment.
   * Recurring assignments share a seriesId and are all persisted atomically.
   */
  async create(
    input: CreateWorkAssignmentInput,
  ): Promise<WorkAssignment | CreateSeriesResult> {
    const { recurrenceRule, scheduledAt } = input;
    const parsedScheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
    const sla = parseSla(input.sla);

    if (!recurrenceRule || !parsedScheduledAt) {
      // Simple non-recurring assignment
      const id = randomUUID();
      const assignment = WorkAssignment.create(id, {
        ...input,
        scheduledAt: parsedScheduledAt,
        sla,
      });
      return this.repo.save(assignment);
    }

    // Recurring: expand dates and create all occurrences
    const dates = expandRecurrence(parsedScheduledAt, recurrenceRule);
    if (dates.length === 0) {
      throw new Error('Recurrence rule produced no occurrences');
    }

    const seriesId = randomUUID();

    const assignments = dates.map((date, idx) => {
      const id = randomUUID();
      const a = WorkAssignment.create(id, {
        ...input,
        scheduledAt: date,
        recurrenceRule,
        sla,
      });
      // Override status to 'scheduled' and stamp seriesId for recurring items
      return WorkAssignment.fromPersistence({
        ...a.toPersistence(),
        status: 'scheduled',
        seriesId,
        nextOccurrence: dates[idx + 1] ?? undefined,
      });
    });

    const created = await this.repo.saveMany(assignments);
    const first = created[0];
    if (!first) throw new Error('No assignments were created for the series');
    return { seriesId, count: created.length, first };
  }

  async getList(
    orgId: string,
    query: WorkAssignmentListQuery,
  ): Promise<WorkAssignmentListResult> {
    return this.repo.findAll(orgId, query);
  }

  async getById(orgId: string, id: string): Promise<WorkAssignment> {
    const assignment = await this.repo.findById(orgId, id);
    if (!assignment) throw new Error(`Work assignment not found: ${id}`);
    return assignment;
  }

  async getSeries(orgId: string, seriesId: string): Promise<WorkAssignment[]> {
    return this.repo.findBySeries(orgId, seriesId);
  }

  async getCalendarRange(
    orgId: string,
    startDate: string | Date,
    endDate: string | Date,
    filters?: { assignedTo?: string; priority?: WorkAssignmentPriority },
  ): Promise<WorkAssignment[]> {
    return this.repo.findCalendarRange(orgId, {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      assignedTo: filters?.assignedTo,
      priority: filters?.priority,
    });
  }

  /**
   * Update a single assignment or all future/all occurrences in a series.
   * scope: 'single' | 'future' | 'all'
   */
  async update(
    orgId: string,
    id: string,
    input: UpdateWorkAssignmentInput,
    actorId?: string,
  ): Promise<WorkAssignment> {
    const existing = await this.getById(orgId, id);
    const { scope = 'single', ...patch } = input;

    if (scope !== 'single' && existing.seriesId) {
      const fromDate = scope === 'future' ? existing.scheduledAt : undefined;
      await this.repo.updateSeries(orgId, existing.seriesId, existing, fromDate);
    }

    // Apply patch to the entity
    const props = existing.toPersistence();
    const updated = WorkAssignment.fromPersistence({
      ...props,
      title: patch.title ?? props.title,
      description: patch.description ?? props.description,
      internalNotes: patch.internalNotes ?? props.internalNotes,
      priority: patch.priority ?? props.priority,
      assignedTo: patch.assignedTo ?? props.assignedTo,
      customerId: patch.customerId ?? props.customerId,
      branchId: patch.branchId ?? props.branchId,
      requiredSkills: patch.requiredSkills ?? props.requiredSkills,
      location: patch.location ?? props.location,
      travelTimeEstimateMins: patch.travelTimeEstimateMins ?? props.travelTimeEstimateMins,
      scheduledAt: patch.scheduledAt ? new Date(patch.scheduledAt) : props.scheduledAt,
      estimatedDurationMins: patch.estimatedDurationMins ?? props.estimatedDurationMins,
      sla: patch.sla ? { ...props.sla, ...parseSla(patch.sla) } : props.sla,
      updatedBy: actorId ?? props.updatedBy,
      updatedAt: new Date(),
    });

    return this.repo.update(updated);
  }

  /**
   * Transition assignment status with terminal state guard.
   * Automatically captures SLA timestamps and breach flags.
   */
  async updateStatus(
    orgId: string,
    id: string,
    newStatus: WorkAssignmentStatus,
    actorId?: string,
    meta?: { customerRating?: number; firstVisitResolution?: boolean },
  ): Promise<WorkAssignment> {
    const existing = await this.getById(orgId, id);

    // transitionStatus throws if terminal
    const transitioned = existing.transitionStatus(newStatus);

    const props = transitioned.toPersistence();

    // Apply meta from completion data
    if (meta?.customerRating !== undefined) {
      props.ai = { ...props.ai, customerRating: meta.customerRating };
    }
    if (meta?.firstVisitResolution !== undefined) {
      props.ai = { ...props.ai, firstVisitResolution: meta.firstVisitResolution };
    }

    props.updatedBy = actorId;

    return this.repo.update(WorkAssignment.fromPersistence(props));
  }

  /**
   * Complete an assignment — transitions to 'completed', fills AI duration field.
   */
  async complete(
    orgId: string,
    id: string,
    input: CompleteWorkAssignmentInput,
    actorId?: string,
  ): Promise<WorkAssignment> {
    const afterStatus = await this.updateStatus(orgId, id, 'completed', actorId, {
      customerRating: input.customerRating,
      firstVisitResolution: input.firstVisitResolution,
    });

    // Calculate actual duration from scheduledAt → actualCompletion
    const durationMins = afterStatus.calculateActualDuration();
    const props = afterStatus.toPersistence();

    props.ai = {
      ...props.ai,
      actualDuration: durationMins ?? props.ai.actualDuration,
      completionRate: input.completionRate ?? props.ai.completionRate,
      delayReason: input.delayReason ?? props.ai.delayReason,
    };

    return this.repo.update(WorkAssignment.fromPersistence(props));
  }

  async getStats(orgId: string): Promise<WorkAssignmentStats> {
    return this.repo.getStats(orgId);
  }

  async getSlaAtRisk(orgId: string): Promise<WorkAssignment[]> {
    return this.repo.findSlaAtRisk(orgId);
  }
}
