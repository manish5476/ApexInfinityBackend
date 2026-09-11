import mongoose from 'mongoose';
import { WorkAssignment, WorkAssignmentProps } from '../../domain/entities/WorkAssignment';
import {
  IWorkAssignmentRepository,
  WorkAssignmentListQuery,
  WorkAssignmentListResult,
  WorkAssignmentCalendarQuery,
  WorkAssignmentStats,
} from '../../domain/ports/IWorkAssignmentRepository';
import { WorkAssignmentModel, WorkAssignmentDoc } from '../persistence/workAssignment.model';

// ─────────────────────────────────────────────────────────────────────────────
//  Mapper helpers
// ─────────────────────────────────────────────────────────────────────────────

function toEntity(doc: WorkAssignmentDoc): WorkAssignment {
  const props: WorkAssignmentProps = {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    internalNotes: doc.internalNotes,
    status: doc.status as WorkAssignment['status'],
    priority: doc.priority as WorkAssignment['priority'],
    organizationId: doc.organizationId.toString(),
    assignedTo: (doc.assignedTo ?? []).map((id: mongoose.Types.ObjectId) => id.toString()),
    customerId: doc.customerId?.toString(),
    branchId: doc.branchId?.toString(),
    requiredSkills: (doc.requiredSkills ?? []).map((id: mongoose.Types.ObjectId) => id.toString()),
    location: doc.location,
    travelTimeEstimateMins: doc.travelTimeEstimateMins,
    scheduledAt: doc.scheduledAt,
    estimatedDurationMins: doc.estimatedDurationMins,
    sla: {
      responseDeadline: doc.sla?.responseDeadline,
      arrivalDeadline: doc.sla?.arrivalDeadline,
      completionDeadline: doc.sla?.completionDeadline,
      actualArrival: doc.sla?.actualArrival,
      actualCompletion: doc.sla?.actualCompletion,
      breached: doc.sla?.breached ?? false,
      breachType: doc.sla?.breachType as WorkAssignmentProps['sla']['breachType'],
      breachReason: doc.sla?.breachReason,
    },
    inventoryItems: (doc.inventoryItems ?? []).map((item, idx) => ({
      id: (item as unknown as { _id?: mongoose.Types.ObjectId })._id?.toString() ?? `${doc._id}-inv-${idx}`,
      productId: item.productId.toString(),
      qty: item.qty,
      reservedAt: item.reservedAt,
      consumed: item.consumed,
    })),
    recurrenceRule: doc.recurrenceRule
      ? {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Mongoose doc cast
          frequency: doc.recurrenceRule.frequency as any,
          interval: doc.recurrenceRule.interval,
          daysOfWeek: doc.recurrenceRule.daysOfWeek,
          endDate: doc.recurrenceRule.endDate,
          maxOccurrences: doc.recurrenceRule.maxOccurrences,
        }
      : undefined,
    parentAssignment: doc.parentAssignment?.toString(),
    seriesId: doc.seriesId?.toString(),
    nextOccurrence: doc.nextOccurrence,
    ai: {
      estimatedDuration: doc.ai?.estimatedDuration,
      actualDuration: doc.ai?.actualDuration,
      completionRate: doc.ai?.completionRate,
      firstVisitResolution: doc.ai?.firstVisitResolution,
      customerRating: doc.ai?.customerRating,
      delayReason: doc.ai?.delayReason,
      travelTime: doc.ai?.travelTime,
      energyConsumption: doc.ai?.energyConsumption,
    },
    createdBy: doc.createdBy?.toString(),
    updatedBy: doc.updatedBy?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return WorkAssignment.fromPersistence(props);
}

function toDoc(assignment: WorkAssignment): Record<string, unknown> {
  const p = assignment.toPersistence();
  return {
    title: p.title,
    description: p.description,
    internalNotes: p.internalNotes,
    status: p.status,
    priority: p.priority,
    organizationId: p.organizationId,
    assignedTo: p.assignedTo,
    customerId: p.customerId,
    branchId: p.branchId,
    requiredSkills: p.requiredSkills,
    location: p.location,
    travelTimeEstimateMins: p.travelTimeEstimateMins,
    scheduledAt: p.scheduledAt,
    estimatedDurationMins: p.estimatedDurationMins,
    sla: p.sla,
    inventoryItems: p.inventoryItems.map(item => ({
      _id: item.id,
      productId: item.productId,
      qty: item.qty,
      reservedAt: item.reservedAt,
      consumed: item.consumed,
    })),
    recurrenceRule: p.recurrenceRule,
    parentAssignment: p.parentAssignment,
    seriesId: p.seriesId,
    nextOccurrence: p.nextOccurrence,
    ai: p.ai,
    createdBy: p.createdBy,
    updatedBy: p.updatedBy,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Repository
// ─────────────────────────────────────────────────────────────────────────────

export class MongoWorkAssignmentRepository implements IWorkAssignmentRepository {
  async save(assignment: WorkAssignment): Promise<WorkAssignment> {
    const doc = await WorkAssignmentModel.create(toDoc(assignment));
    return toEntity(doc);
  }

  async saveMany(assignments: WorkAssignment[]): Promise<WorkAssignment[]> {
    const docs = await WorkAssignmentModel.insertMany(assignments.map(toDoc));
    return (docs as unknown as WorkAssignmentDoc[]).map(toEntity);
  }

  async findById(orgId: string, id: string): Promise<WorkAssignment | null> {
    const doc = await WorkAssignmentModel.findOne({
      _id: id,
      organizationId: orgId,
    }).lean<WorkAssignmentDoc>();
    if (!doc) return null;
    return toEntity(doc as WorkAssignmentDoc);
  }

  async findAll(orgId: string, query: WorkAssignmentListQuery): Promise<WorkAssignmentListResult> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Mongo filter
    const filter: Record<string, any> = { organizationId: orgId };
    if (query.status) filter['status'] = query.status;
    if (query.priority) filter['priority'] = query.priority;
    if (query.assignedTo) filter['assignedTo'] = query.assignedTo;
    if (query.customerId) filter['customerId'] = query.customerId;
    if (query.branchId) filter['branchId'] = query.branchId;
    if (query.search) filter['title'] = { $regex: query.search, $options: 'i' };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortField = query.sortBy ?? 'createdAt';
    const sortDir = query.sortOrder === 'asc' ? 1 : -1;

    const [docs, total] = await Promise.all([
      WorkAssignmentModel.find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .lean<WorkAssignmentDoc[]>(),
      WorkAssignmentModel.countDocuments(filter),
    ]);

    return {
      data: (docs as WorkAssignmentDoc[]).map(toEntity),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    };
  }

  async findBySeries(orgId: string, seriesId: string): Promise<WorkAssignment[]> {
    const docs = await WorkAssignmentModel.find({ organizationId: orgId, seriesId })
      .sort({ scheduledAt: 1 })
      .lean<WorkAssignmentDoc[]>();
    return (docs as WorkAssignmentDoc[]).map(toEntity);
  }

  async findCalendarRange(
    orgId: string,
    query: WorkAssignmentCalendarQuery,
  ): Promise<WorkAssignment[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {
      organizationId: orgId,
      scheduledAt: { $gte: query.startDate, $lte: query.endDate },
    };
    if (query.assignedTo) filter['assignedTo'] = query.assignedTo;
    if (query.priority) filter['priority'] = query.priority;

    const docs = await WorkAssignmentModel.find(filter)
      .sort({ scheduledAt: 1 })
      .lean<WorkAssignmentDoc[]>();
    return (docs as WorkAssignmentDoc[]).map(toEntity);
  }

  async update(assignment: WorkAssignment): Promise<WorkAssignment> {
    const doc = await WorkAssignmentModel.findByIdAndUpdate(
      assignment.id,
      { $set: toDoc(assignment) },
      { new: true },
    ).lean<WorkAssignmentDoc>();
    if (!doc) throw new Error(`WorkAssignment ${assignment.id} not found`);
    return toEntity(doc as WorkAssignmentDoc);
  }

  async updateSeries(
    orgId: string,
    seriesId: string,
    _patch: Partial<WorkAssignment>,
    fromDate?: Date,
  ): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { organizationId: orgId, seriesId };
    if (fromDate) filter['scheduledAt'] = { $gte: fromDate };
    const result = await WorkAssignmentModel.updateMany(filter, {
      $set: { updatedAt: new Date() },
    });
    return result.modifiedCount;
  }

  async getStats(orgId: string): Promise<WorkAssignmentStats> {
    const now = new Date();
    const [raw] = await WorkAssignmentModel.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(orgId) } },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          sla: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                breached: { $sum: { $cond: ['$sla.breached', 1, 0] } },
                withSla: { $sum: { $cond: [{ $ifNull: ['$sla.completionDeadline', false] }, 1, 0] } },
              },
            },
          ],
          completion: [
            {
              $group: {
                _id: null,
                avgDurationMins: { $avg: '$ai.actualDuration' },
                avgCustomerRating: { $avg: '$ai.customerRating' },
              },
            },
          ],
        },
      },
    ]);

    return {
      byStatus: (raw?.byStatus ?? []).map((b: { _id: string; count: number }) => ({
        status: b._id as WorkAssignment['status'],
        count: b.count,
      })),
      byPriority: (raw?.byPriority ?? []).map((b: { _id: string; count: number }) => ({
        priority: b._id as WorkAssignment['priority'],
        count: b.count,
      })),
      sla: raw?.sla?.[0] ?? { total: 0, breached: 0, withSla: 0 },
      completion: raw?.completion?.[0] ?? {},
    };
  }

  async findSlaAtRisk(orgId: string): Promise<WorkAssignment[]> {
    const now = new Date();
    const docs = await WorkAssignmentModel.find({
      organizationId: orgId,
      'sla.breached': false,
      status: { $nin: ['completed', 'verified', 'closed', 'cancelled'] },
      $or: [
        { 'sla.completionDeadline': { $lt: now } },
        { 'sla.arrivalDeadline': { $lt: now } },
      ],
    })
      .select('_id title assignedTo sla status')
      .lean<WorkAssignmentDoc[]>();
    return (docs as WorkAssignmentDoc[]).map(toEntity);
  }
}
