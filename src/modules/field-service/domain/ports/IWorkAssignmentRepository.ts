import {
  WorkAssignment,
  WorkAssignmentStatus,
  WorkAssignmentPriority,
} from '../entities/WorkAssignment';

export interface WorkAssignmentListQuery {
  status?: WorkAssignmentStatus;
  priority?: WorkAssignmentPriority;
  assignedTo?: string;
  customerId?: string;
  branchId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WorkAssignmentCalendarQuery {
  startDate: Date;
  endDate: Date;
  assignedTo?: string;
  priority?: WorkAssignmentPriority;
}

export interface WorkAssignmentListResult {
  data: WorkAssignment[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface WorkAssignmentStats {
  byStatus: Array<{ status: WorkAssignmentStatus; count: number }>;
  byPriority: Array<{ priority: WorkAssignmentPriority; count: number }>;
  sla: { total: number; breached: number; withSla: number };
  completion: {
    avgDurationMins?: number;
    firstVisitResolutionRate?: number;
    avgCustomerRating?: number;
  };
}

export interface IWorkAssignmentRepository {
  /** Persist a new work assignment. */
  save(assignment: WorkAssignment): Promise<WorkAssignment>;

  /** Persist multiple assignments atomically (for recurring series). */
  saveMany(assignments: WorkAssignment[]): Promise<WorkAssignment[]>;

  /** Find by ID within an organisation. Returns null if not found. */
  findById(orgId: string, id: string): Promise<WorkAssignment | null>;

  /** Paginated list with filters. */
  findAll(orgId: string, query: WorkAssignmentListQuery): Promise<WorkAssignmentListResult>;

  /** All assignments in a recurring series. */
  findBySeries(orgId: string, seriesId: string): Promise<WorkAssignment[]>;

  /** Calendar view — all assignments in a date range. */
  findCalendarRange(orgId: string, query: WorkAssignmentCalendarQuery): Promise<WorkAssignment[]>;

  /** Persist changes to an existing assignment. */
  update(assignment: WorkAssignment): Promise<WorkAssignment>;

  /** Update all (or future) assignments in a series. */
  updateSeries(
    orgId: string,
    seriesId: string,
    patch: Partial<WorkAssignment>,
    fromDate?: Date,
  ): Promise<number>;

  /** Aggregated statistics for the organisation. */
  getStats(orgId: string): Promise<WorkAssignmentStats>;

  /** Assignments whose SLA deadline has passed but are not yet breached. */
  findSlaAtRisk(orgId: string): Promise<WorkAssignment[]>;
}
