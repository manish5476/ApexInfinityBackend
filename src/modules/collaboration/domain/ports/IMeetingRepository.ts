import { Meeting } from '../entities/Meeting';

export interface MeetingListQuery {
  organizationId: string;
  userId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface IMeetingRepository {
  save(meeting: Meeting): Promise<void>;
  findById(query: { id: string; organizationId: string }): Promise<Meeting | null>;
  delete(query: { id: string; organizationId: string }): Promise<boolean>;
  list(query: MeetingListQuery): Promise<{ data: Meeting[]; total: number }>;
  getAnalyticsSummary(organizationId: string, userId?: string): Promise<Record<string, unknown>>;
}
