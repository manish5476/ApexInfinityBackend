import { IAnnouncementRepository, AnnouncementStats } from '../../domain/ports/IAnnouncementRepository';
import { Announcement, AnnouncementType, AnnouncementAudience } from '../../domain/entities/Announcement';
import { AnnouncementModel, AnnouncementReadModel } from '../persistence/announcement.model';

export class MongoAnnouncementRepository implements IAnnouncementRepository {
  async findById(query: { id: string; organizationId: string }): Promise<Announcement | null> {
    const doc = await AnnouncementModel.findOne({ _id: query.id, organizationId: query.organizationId }).lean();
    if (!doc) return null;

    return Announcement.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      senderId: doc.senderId,
      title: doc.title,
      message: doc.message,
      type: doc.type as AnnouncementType,
      targetAudience: doc.targetAudience as AnnouncementAudience,
      targetRoles: doc.targetRoles,
      targetUsers: doc.targetUsers,
      isPinned: doc.isPinned,
      expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : null,
      isActive: doc.isActive,
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    });
  }

  async save(announcement: Announcement): Promise<void> {
    await AnnouncementModel.findByIdAndUpdate(
      announcement.id,
      {
        _id: announcement.id,
        organizationId: announcement.organizationId,
        senderId: announcement.senderId,
        title: announcement.title,
        message: announcement.message,
        type: announcement.type,
        targetAudience: announcement.targetAudience,
        targetRoles: announcement.targetRoles,
        targetUsers: announcement.targetUsers,
        isPinned: announcement.isPinned,
        expiresAt: announcement.expiresAt,
        isActive: announcement.isActive,
        createdAt: announcement.props.createdAt,
        updatedAt: announcement.props.updatedAt,
      },
      { upsert: true, new: true }
    );
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const res = await AnnouncementModel.deleteOne({ _id: query.id, organizationId: query.organizationId });
    if (res.deletedCount > 0) {
      await AnnouncementReadModel.deleteMany({ announcementId: query.id });
      return true;
    }
    return false;
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
    const filter: Record<string, any> = { organizationId: query.organizationId };

    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.type) filter.type = query.type;
    if (query.targetAudience) filter.targetAudience = query.targetAudience;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { message: { $regex: query.search, $options: 'i' } },
      ];
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      AnnouncementModel.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AnnouncementModel.countDocuments(filter),
    ]);

    const data = docs.map((doc) =>
      Announcement.reconstitute({
        id: doc._id,
        organizationId: doc.organizationId,
        senderId: doc.senderId,
        title: doc.title,
        message: doc.message,
        type: doc.type as AnnouncementType,
        targetAudience: doc.targetAudience as AnnouncementAudience,
        targetRoles: doc.targetRoles,
        targetUsers: doc.targetUsers,
        isPinned: doc.isPinned,
        expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : null,
        isActive: doc.isActive,
        createdAt: new Date(doc.createdAt),
        updatedAt: new Date(doc.updatedAt),
      })
    );

    return { data, total };
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    await AnnouncementReadModel.updateOne(
      { announcementId, userId },
      { $setOnInsert: { announcementId, userId, readAt: new Date() } },
      { upsert: true }
    );
  }

  async isReadByUser(announcementId: string, userId: string): Promise<boolean> {
    const exists = await AnnouncementReadModel.exists({ announcementId, userId });
    return !!exists;
  }

  async getStats(organizationId: string): Promise<AnnouncementStats> {
    const [total, active, pinned] = await Promise.all([
      AnnouncementModel.countDocuments({ organizationId }),
      AnnouncementModel.countDocuments({ organizationId, isActive: true }),
      AnnouncementModel.countDocuments({ organizationId, isPinned: true }),
    ]);

    return { total, active, pinned };
  }

  async search(organizationId: string, searchTerm: string): Promise<Announcement[]> {
    const res = await this.list({ organizationId, search: searchTerm, limit: 50 });
    return res.data;
  }
}
