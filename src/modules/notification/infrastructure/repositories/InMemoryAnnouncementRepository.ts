import { IAnnouncementRepository, AnnouncementStats } from '../../domain/ports/IAnnouncementRepository';
import { Announcement } from '../../domain/entities/Announcement';

export class InMemoryAnnouncementRepository implements IAnnouncementRepository {
  public announcements: Announcement[] = [];
  public reads: Array<{ announcementId: string; userId: string; readAt: Date }> = [];

  async findById(query: { id: string; organizationId: string }): Promise<Announcement | null> {
    const a = this.announcements.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return a ? Announcement.reconstitute({ ...a.props, id: a.id }) : null;
  }

  async save(announcement: Announcement): Promise<void> {
    const idx = this.announcements.findIndex((x) => x.id === announcement.id);
    if (idx >= 0) {
      this.announcements[idx] = Announcement.reconstitute({ ...announcement.props, id: announcement.id });
    } else {
      this.announcements.push(Announcement.reconstitute({ ...announcement.props, id: announcement.id }));
    }
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const initialLen = this.announcements.length;
    this.announcements = this.announcements.filter(
      (x) => !(x.id === query.id && x.organizationId === query.organizationId)
    );
    return this.announcements.length < initialLen;
  }

  async list(query: {
    organizationId: string;
    page?: number;
    limit?: number;
    type?: string;
    targetAudience?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<{ data: Announcement[]; total: number }> {
    let filtered = this.announcements.filter((x) => x.organizationId === query.organizationId);

    if (query.isActive !== undefined) {
      filtered = filtered.filter((x) => x.isActive === query.isActive);
    }
    if (query.type) {
      filtered = filtered.filter((x) => x.type === query.type);
    }
    if (query.targetAudience) {
      filtered = filtered.filter((x) => x.targetAudience === query.targetAudience);
    }
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter((x) => x.title.toLowerCase().includes(s) || x.message.toLowerCase().includes(s));
    }

    filtered.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return b.props.createdAt.getTime() - a.props.createdAt.getTime();
    });

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((a) => Announcement.reconstitute({ ...a.props, id: a.id })),
      total: filtered.length,
    };
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    const exists = this.reads.some((r) => r.announcementId === announcementId && r.userId === userId);
    if (!exists) {
      this.reads.push({ announcementId, userId, readAt: new Date() });
    }
  }

  async isReadByUser(announcementId: string, userId: string): Promise<boolean> {
    return this.reads.some((r) => r.announcementId === announcementId && r.userId === userId);
  }

  async getStats(organizationId: string): Promise<AnnouncementStats> {
    const orgAnnouncements = this.announcements.filter((x) => x.organizationId === organizationId);
    return {
      total: orgAnnouncements.length,
      active: orgAnnouncements.filter((x) => x.isActive).length,
      pinned: orgAnnouncements.filter((x) => x.isPinned).length,
    };
  }

  async search(organizationId: string, searchTerm: string): Promise<Announcement[]> {
    const res = await this.list({ organizationId, search: searchTerm, limit: 50 });
    return res.data;
  }
}
