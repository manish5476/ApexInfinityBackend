import { Announcement } from '../entities/Announcement';

export interface AnnouncementStats {
  total: number;
  active: number;
  pinned: number;
}

export interface IAnnouncementRepository {
  findById(query: { id: string; organizationId: string }): Promise<Announcement | null>;
  save(announcement: Announcement): Promise<void>;
  delete(query: { id: string; organizationId: string }): Promise<boolean>;
  list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    type?: string;
    targetAudience?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: Announcement[]; total: number }>;
  markAsRead(announcementId: string, userId: string): Promise<void>;
  isReadByUser(announcementId: string, userId: string): Promise<boolean>;
  getStats(organizationId: string): Promise<AnnouncementStats>;
  search(organizationId: string, searchTerm: string): Promise<Announcement[]>;
}
