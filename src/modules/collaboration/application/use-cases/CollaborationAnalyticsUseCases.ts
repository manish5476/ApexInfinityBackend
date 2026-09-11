import { INoteRepository, GraphNetworkResult } from '../../domain/ports/INoteRepository';
import { IMeetingRepository } from '../../domain/ports/IMeetingRepository';

export class CollaborationAnalyticsUseCases {
  constructor(
    private readonly noteRepo: INoteRepository,
    private readonly meetingRepo: IMeetingRepository
  ) {}

  async getKnowledgeGraph(organizationId: string, userId?: string): Promise<GraphNetworkResult> {
    return this.noteRepo.getKnowledgeGraph(organizationId, userId);
  }

  async getHeatmapData(organizationId: string, userId?: string, year?: number): Promise<Record<string, number>> {
    return this.noteRepo.getHeatmapData(organizationId, userId, year);
  }

  async getStatsSummary(organizationId: string, userId?: string): Promise<Record<string, unknown>> {
    const noteStats = await this.noteRepo.getStatsSummary(organizationId, userId);
    const meetingStats = await this.meetingRepo.getAnalyticsSummary(organizationId, userId);
    return {
      notes: noteStats,
      meetings: meetingStats,
    };
  }

  async getRecentActivity(organizationId: string, userId?: string): Promise<any[]> {
    const { data } = await this.noteRepo.list({
      organizationId,
      creatorId: userId,
      limit: 10,
    });
    return data.map((n) => ({
      id: n.id,
      title: n.title,
      type: n.itemType,
      action: 'updated',
      updatedAt: n.props.updatedAt,
    }));
  }

  async getCalendarView(
    organizationId: string,
    userId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{ notes: any[]; meetings: any[] }> {
    const [notesRes, meetingsRes] = await Promise.all([
      this.noteRepo.list({
        organizationId,
        creatorId: userId,
        startDate,
        endDate,
        limit: 200,
      }),
      this.meetingRepo.list({
        organizationId,
        userId,
        startDate,
        endDate,
        limit: 200,
      }),
    ]);

    return {
      notes: notesRes.data.filter((n) => n.props.dueDate || n.props.startDate),
      meetings: meetingsRes.data,
    };
  }

  async getMonthlyNotes(
    organizationId: string,
    userId?: string,
    year?: number,
    month?: number
  ): Promise<any[]> {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month !== undefined ? month : new Date().getMonth();

    const startOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
    const endOfMonth = new Date(Date.UTC(targetYear, targetMonth + 1, 0, 23, 59, 59));

    const res = await this.noteRepo.list({
      organizationId,
      creatorId: userId,
      startDate: startOfMonth,
      endDate: endOfMonth,
      limit: 300,
    });
    return res.data;
  }

  async exportData(organizationId: string, userId?: string): Promise<{ notes: any[]; meetings: any[] }> {
    const [notesRes, meetingsRes] = await Promise.all([
      this.noteRepo.list({ organizationId, creatorId: userId, limit: 1000 }),
      this.meetingRepo.list({ organizationId, userId, limit: 1000 }),
    ]);
    return {
      notes: notesRes.data.map((n) => n.props),
      meetings: meetingsRes.data.map((m) => m.props),
    };
  }
}
