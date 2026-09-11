import { IMeetingRepository, MeetingListQuery } from '../../domain/ports/IMeetingRepository';
import { Meeting } from '../../domain/entities/Meeting';

export class InMemoryMeetingRepository implements IMeetingRepository {
  public items: Meeting[] = [];

  async save(meeting: Meeting): Promise<void> {
    const idx = this.items.findIndex((x) => x.id === meeting.id);
    if (idx >= 0) {
      this.items[idx] = meeting;
    } else {
      this.items.push(meeting);
    }
  }

  async findById(query: { id: string; organizationId: string }): Promise<Meeting | null> {
    const item = this.items.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return item ? Meeting.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const idx = this.items.findIndex((x) => x.id === query.id && x.organizationId === query.organizationId);
    if (idx < 0) return false;
    this.items.splice(idx, 1);
    return true;
  }

  async list(query: MeetingListQuery): Promise<{ data: Meeting[]; total: number }> {
    let filtered = this.items.filter((x) => x.organizationId === query.organizationId);

    if (query.userId) {
      filtered = filtered.filter(
        (x) => x.creatorId === query.userId || x.participants.some((p) => p.user === query.userId)
      );
    }
    if (query.status) {
      filtered = filtered.filter((x) => x.status === query.status);
    }
    if (query.startDate) {
      filtered = filtered.filter((x) => x.startTime >= query.startDate!);
    }
    if (query.endDate) {
      filtered = filtered.filter((x) => x.startTime <= query.endDate!);
    }

    filtered.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((x) => Meeting.reconstitute({ ...x.props, id: x.id })),
      total: filtered.length,
    };
  }

  async getAnalyticsSummary(organizationId: string, userId?: string): Promise<Record<string, unknown>> {
    const userMeetings = this.items.filter(
      (x) => x.organizationId === organizationId && (!userId || x.creatorId === userId || x.participants.some((p) => p.user === userId))
    );

    return {
      totalMeetings: userMeetings.length,
      scheduled: userMeetings.filter((x) => x.status === 'scheduled').length,
      completed: userMeetings.filter((x) => x.status === 'completed').length,
      cancelled: userMeetings.filter((x) => x.status === 'cancelled').length,
      inProgress: userMeetings.filter((x) => x.status === 'in_progress').length,
    };
  }
}
