import {
  WorkAssignment,
  WorkAssignmentProps,
  WorkAssignmentSla,
  RecurrenceRule,
  InventoryItem,
  WorkAssignmentAi,
  WorkAssignmentLocation,
  WorkAssignmentStatus,
  WorkAssignmentPriority,
} from '../../domain/entities/WorkAssignment';
import {
  IWorkAssignmentRepository,
  WorkAssignmentListQuery,
  WorkAssignmentListResult,
  WorkAssignmentCalendarQuery,
  WorkAssignmentStats,
} from '../../domain/ports/IWorkAssignmentRepository';

let _idCounter = 0;
const nextId = (): string => `wa-${++_idCounter}`;

export class InMemoryWorkAssignmentRepository implements IWorkAssignmentRepository {
  private store = new Map<string, WorkAssignmentProps>();

  async save(assignment: WorkAssignment): Promise<WorkAssignment> {
    this.store.set(assignment.id, assignment.toPersistence());
    return assignment;
  }

  async saveMany(assignments: WorkAssignment[]): Promise<WorkAssignment[]> {
    for (const a of assignments) {
      this.store.set(a.id, a.toPersistence());
    }
    return assignments;
  }

  async findById(orgId: string, id: string): Promise<WorkAssignment | null> {
    const props = this.store.get(id);
    if (!props || props.organizationId !== orgId) return null;
    return WorkAssignment.fromPersistence(props);
  }

  async findAll(orgId: string, query: WorkAssignmentListQuery): Promise<WorkAssignmentListResult> {
    let items = Array.from(this.store.values()).filter(p => p.organizationId === orgId);

    if (query.status) items = items.filter(p => p.status === query.status);
    if (query.priority) items = items.filter(p => p.priority === query.priority);
    if (query.assignedTo) items = items.filter(p => p.assignedTo.includes(query.assignedTo!));
    if (query.customerId) items = items.filter(p => p.customerId === query.customerId);
    if (query.branchId) items = items.filter(p => p.branchId === query.branchId);
    if (query.search) {
      const term = query.search.toLowerCase();
      items = items.filter(p => p.title.toLowerCase().includes(term));
    }

    const total = items.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: items.slice(start, start + limit).map(p => WorkAssignment.fromPersistence(p)),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findBySeries(orgId: string, seriesId: string): Promise<WorkAssignment[]> {
    return Array.from(this.store.values())
      .filter(p => p.organizationId === orgId && p.seriesId === seriesId)
      .map(p => WorkAssignment.fromPersistence(p));
  }

  async findCalendarRange(
    orgId: string,
    query: WorkAssignmentCalendarQuery,
  ): Promise<WorkAssignment[]> {
    return Array.from(this.store.values())
      .filter(p => {
        if (p.organizationId !== orgId) return false;
        if (!p.scheduledAt) return false;
        if (p.scheduledAt < query.startDate || p.scheduledAt > query.endDate) return false;
        if (query.assignedTo && !p.assignedTo.includes(query.assignedTo)) return false;
        if (query.priority && p.priority !== query.priority) return false;
        return true;
      })
      .map(p => WorkAssignment.fromPersistence(p));
  }

  async update(assignment: WorkAssignment): Promise<WorkAssignment> {
    if (!this.store.has(assignment.id)) {
      throw new Error(`WorkAssignment ${assignment.id} not found`);
    }
    this.store.set(assignment.id, assignment.toPersistence());
    return assignment;
  }

  async updateSeries(
    orgId: string,
    seriesId: string,
    _patch: Partial<WorkAssignment>,
    fromDate?: Date,
  ): Promise<number> {
    let count = 0;
    for (const [id, props] of this.store.entries()) {
      if (props.organizationId !== orgId || props.seriesId !== seriesId) continue;
      if (fromDate && props.scheduledAt && props.scheduledAt < fromDate) continue;
      // In-memory: just bump updatedAt to simulate the update
      this.store.set(id, { ...props, updatedAt: new Date() });
      count++;
    }
    return count;
  }

  async getStats(orgId: string): Promise<WorkAssignmentStats> {
    const items = Array.from(this.store.values()).filter(p => p.organizationId === orgId);

    const statusMap = new Map<string, number>();
    const priorityMap = new Map<string, number>();
    let totalSla = 0;
    let breachedSla = 0;
    let withSla = 0;
    let totalRating = 0;
    let ratingCount = 0;

    for (const p of items) {
      statusMap.set(p.status, (statusMap.get(p.status) ?? 0) + 1);
      priorityMap.set(p.priority, (priorityMap.get(p.priority) ?? 0) + 1);
      totalSla++;
      if (p.sla.breached) breachedSla++;
      if (p.sla.completionDeadline) withSla++;
      if (p.ai.customerRating) { totalRating += p.ai.customerRating; ratingCount++; }
    }

    return {
      byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({
        status: status as WorkAssignmentStatus,
        count,
      })),
      byPriority: Array.from(priorityMap.entries()).map(([priority, count]) => ({
        priority: priority as WorkAssignmentPriority,
        count,
      })),
      sla: { total: totalSla, breached: breachedSla, withSla },
      completion: {
        avgCustomerRating: ratingCount > 0 ? totalRating / ratingCount : undefined,
      },
    };
  }

  async findSlaAtRisk(orgId: string): Promise<WorkAssignment[]> {
    const now = new Date();
    return Array.from(this.store.values())
      .filter(p => {
        if (p.organizationId !== orgId) return false;
        if (p.sla.breached) return false;
        if (['completed', 'verified', 'closed', 'cancelled'].includes(p.status)) return false;
        if (!p.sla.completionDeadline && !p.sla.arrivalDeadline) return false;
        const completionOverdue = p.sla.completionDeadline && p.sla.completionDeadline < now;
        const arrivalOverdue = p.sla.arrivalDeadline && p.sla.arrivalDeadline < now;
        return !!(completionOverdue || arrivalOverdue);
      })
      .map(p => WorkAssignment.fromPersistence(p));
  }

  /** Test helper — direct access to stored props. */
  _getAll(): WorkAssignmentProps[] {
    return Array.from(this.store.values());
  }

  /** Test helper — generate a unique ID. */
  static nextId = nextId;
}
