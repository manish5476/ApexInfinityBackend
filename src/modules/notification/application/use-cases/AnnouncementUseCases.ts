import { v4 as uuidv4 } from 'uuid';
import { IAnnouncementRepository, AnnouncementStats } from '../../domain/ports/IAnnouncementRepository';
import { Announcement, AnnouncementType, AnnouncementAudience } from '../../domain/entities/Announcement';
import { NotFoundError } from '../../../../shared/errors';

export class AnnouncementUseCases {
  constructor(private readonly repo: IAnnouncementRepository) {}

  async createAnnouncement(
    organizationId: string,
    senderId: string,
    params: {
      title: string;
      message: string;
      type?: AnnouncementType;
      targetAudience?: AnnouncementAudience;
      targetRoles?: string[];
      targetUsers?: string[];
      isPinned?: boolean;
      expiresAt?: Date | null;
    }
  ): Promise<Announcement> {
    const announcement = Announcement.create({
      id: uuidv4(),
      organizationId,
      senderId,
      ...params,
    });

    await this.repo.save(announcement);
    return announcement;
  }

  async listAnnouncements(
    organizationId: string,
    query: {
      page?: number;
      limit?: number;
      type?: string;
      targetAudience?: string;
      search?: string;
      isActive?: boolean;
      userId?: string;
    }
  ): Promise<{ data: Array<Announcement & { isRead?: boolean }>; total: number }> {
    const result = await this.repo.list({
      organizationId,
      page: query.page,
      limit: query.limit,
      type: query.type,
      targetAudience: query.targetAudience,
      search: query.search,
      isActive: query.isActive,
    });

    if (query.userId) {
      const enriched = await Promise.all(
        result.data.map(async (a) => {
          const isRead = await this.repo.isReadByUser(a.id, query.userId!);
          return Object.assign(a, { isRead });
        })
      );
      return { data: enriched, total: result.total };
    }

    return result;
  }

  async getAnnouncementById(organizationId: string, id: string): Promise<Announcement> {
    const announcement = await this.repo.findById({ id, organizationId });
    if (!announcement) throw new NotFoundError('Announcement', id);
    return announcement;
  }

  async updateAnnouncement(
    organizationId: string,
    id: string,
    params: Partial<{
      title: string;
      message: string;
      type: AnnouncementType;
      targetAudience: AnnouncementAudience;
      targetRoles: string[];
      targetUsers: string[];
      isPinned: boolean;
      expiresAt?: Date | null;
      isActive: boolean;
    }>
  ): Promise<Announcement> {
    const announcement = await this.repo.findById({ id, organizationId });
    if (!announcement) throw new NotFoundError('Announcement', id);

    announcement.updateDetails(params);
    await this.repo.save(announcement);
    return announcement;
  }

  async deleteAnnouncement(organizationId: string, id: string): Promise<void> {
    const deleted = await this.repo.delete({ id, organizationId });
    if (!deleted) throw new NotFoundError('Announcement', id);
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    await this.repo.markAsRead(announcementId, userId);
  }

  async getStats(organizationId: string): Promise<AnnouncementStats> {
    return this.repo.getStats(organizationId);
  }

  async search(organizationId: string, term: string): Promise<Announcement[]> {
    return this.repo.search(organizationId, term);
  }
}
