import { IMeetingRepository, MeetingListQuery } from '../../domain/ports/IMeetingRepository';
import { Meeting, MeetingProps } from '../../domain/entities/Meeting';
import { FwMeeting, MeetingDoc } from '../persistence/collaboration.model';

export class MongoMeetingRepository implements IMeetingRepository {
  private toEntity(doc: any): Meeting {
    return Meeting.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      creatorId: doc.creatorId,
      title: doc.title,
      description: doc.description || null,
      meetingType: doc.meetingType as any,
      status: doc.status as any,
      startTime: doc.startTime,
      endTime: doc.endTime,
      timeZone: doc.timeZone,
      location: doc.location || null,
      participants: doc.participants || [],
      actionItems: doc.actionItems || [],
      polls: doc.polls || [],
      noteId: doc.noteId || null,
      recordingUrl: doc.recordingUrl || null,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async save(meeting: Meeting): Promise<void> {
    const props = meeting.props;
    await FwMeeting.findOneAndUpdate(
      { _id: meeting.id, organizationId: props.organizationId },
      {
        $set: {
          creatorId: props.creatorId,
          title: props.title,
          description: props.description,
          meetingType: props.meetingType,
          status: props.status,
          startTime: props.startTime,
          endTime: props.endTime,
          timeZone: props.timeZone,
          location: props.location,
          participants: props.participants,
          actionItems: props.actionItems,
          polls: props.polls,
          noteId: props.noteId,
          recordingUrl: props.recordingUrl,
          metadata: props.metadata,
        },
      },
      { upsert: true }
    );
  }

  async findById(query: { id: string; organizationId: string }): Promise<Meeting | null> {
    const doc = await FwMeeting.findOne({ _id: query.id, organizationId: query.organizationId }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const res = await FwMeeting.deleteOne({ _id: query.id, organizationId: query.organizationId });
    return res.deletedCount > 0;
  }

  async list(query: MeetingListQuery): Promise<{ data: Meeting[]; total: number }> {
    const filter: Record<string, any> = { organizationId: query.organizationId };

    if (query.userId) {
      filter.$or = [{ creatorId: query.userId }, { 'participants.user': query.userId }];
    }
    if (query.status) filter.status = query.status;
    if (query.startDate) filter.startTime = { $gte: query.startDate };
    if (query.endDate) {
      filter.startTime = { ...(filter.startTime || {}), $lte: query.endDate };
    }

    const page = Math.max(query.page ?? 1, 1);
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 500);
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      FwMeeting.find(filter).sort({ startTime: 1 }).skip(skip).limit(limit).lean(),
      FwMeeting.countDocuments(filter),
    ]);

    return {
      data: docs.map((d) => this.toEntity(d)),
      total,
    };
  }

  async getAnalyticsSummary(organizationId: string, userId?: string): Promise<Record<string, unknown>> {
    const filter: Record<string, any> = { organizationId };
    if (userId) {
      filter.$or = [{ creatorId: userId }, { 'participants.user': userId }];
    }

    const [totalMeetings, scheduled, completed, cancelled, inProgress] = await Promise.all([
      FwMeeting.countDocuments(filter),
      FwMeeting.countDocuments({ ...filter, status: 'scheduled' }),
      FwMeeting.countDocuments({ ...filter, status: 'completed' }),
      FwMeeting.countDocuments({ ...filter, status: 'cancelled' }),
      FwMeeting.countDocuments({ ...filter, status: 'in_progress' }),
    ]);

    return {
      totalMeetings,
      scheduled,
      completed,
      cancelled,
      inProgress,
    };
  }
}
