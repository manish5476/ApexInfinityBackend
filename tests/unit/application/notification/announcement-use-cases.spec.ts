import { InMemoryAnnouncementRepository } from '../../../../src/modules/notification/infrastructure/repositories/InMemoryAnnouncementRepository';
import { AnnouncementUseCases } from '../../../../src/modules/notification/application/use-cases/AnnouncementUseCases';

describe('AnnouncementUseCases', () => {
  let repo: InMemoryAnnouncementRepository;
  let useCases: AnnouncementUseCases;
  const orgId = 'org-announcement-test';
  const adminId = 'admin-user-1';
  const employeeId = 'emp-user-2';

  beforeEach(() => {
    repo = new InMemoryAnnouncementRepository();
    useCases = new AnnouncementUseCases(repo);
  });

  it('should create an announcement with target audience', async () => {
    const announcement = await useCases.createAnnouncement(orgId, adminId, {
      title: 'Company All-Hands Meeting',
      message: 'Join us Friday at 4 PM UTC.',
      type: 'info',
      targetAudience: 'all',
      isPinned: true,
    });

    expect(announcement.id).toBeDefined();
    expect(announcement.title).toBe('Company All-Hands Meeting');
    expect(announcement.targetAudience).toBe('all');
    expect(announcement.isPinned).toBe(true);

    const retrieved = await useCases.getAnnouncementById(orgId, announcement.id);
    expect(retrieved.id).toBe(announcement.id);
  });

  it('should list announcements and enrich with user read status', async () => {
    const a1 = await useCases.createAnnouncement(orgId, adminId, {
      title: 'Policy Update',
      message: 'New remote work guidelines.',
      type: 'warning',
      targetAudience: 'all',
    });

    const a2 = await useCases.createAnnouncement(orgId, adminId, {
      title: 'Engineering Sprint Review',
      message: 'Demo at 2 PM.',
      type: 'info',
      targetAudience: 'role',
      targetRoles: ['developer', 'tech-lead'],
    });

    // Mark a1 as read by employeeId
    await useCases.markAsRead(a1.id, employeeId);

    const list = await useCases.listAnnouncements(orgId, { userId: employeeId });
    expect(list.total).toBe(2);

    const item1 = list.data.find((item) => item.id === a1.id);
    const item2 = list.data.find((item) => item.id === a2.id);

    expect(item1?.isRead).toBe(true);
    expect(item2?.isRead).toBe(false);
  });

  it('should update announcement properties', async () => {
    const announcement = await useCases.createAnnouncement(orgId, adminId, {
      title: 'Draft Announcement',
      message: 'Work in progress',
      type: 'info',
    });

    const updated = await useCases.updateAnnouncement(orgId, announcement.id, {
      title: 'Published Announcement',
      message: 'Ready for all eyes',
      isPinned: true,
    });

    expect(updated.title).toBe('Published Announcement');
    expect(updated.message).toBe('Ready for all eyes');
    expect(updated.isPinned).toBe(true);
  });

  it('should delete an announcement', async () => {
    const announcement = await useCases.createAnnouncement(orgId, adminId, {
      title: 'To Be Deleted',
      message: 'Goodbye',
    });

    await useCases.deleteAnnouncement(orgId, announcement.id);

    await expect(useCases.getAnnouncementById(orgId, announcement.id)).rejects.toThrow('not found');
  });

  it('should search announcements by title or message', async () => {
    await useCases.createAnnouncement(orgId, adminId, {
      title: 'Holiday Schedule Announcement',
      message: 'Office closed next Monday.',
    });

    await useCases.createAnnouncement(orgId, adminId, {
      title: 'Server Maintenance Notice',
      message: 'Brief downtime on Sunday.',
    });

    const results = await useCases.search(orgId, 'Holiday');
    expect(results.length).toBe(1);
    expect(results[0]!.title).toBe('Holiday Schedule Announcement');
  });

  it('should return announcement statistics', async () => {
    const a1 = await useCases.createAnnouncement(orgId, adminId, {
      title: 'Active Announcement 1',
      message: 'Test 1',
      isPinned: true,
    });

    await useCases.createAnnouncement(orgId, adminId, {
      title: 'Active Announcement 2',
      message: 'Test 2',
    });

    await useCases.markAsRead(a1.id, 'user-A');
    await useCases.markAsRead(a1.id, 'user-B');

    const stats = await useCases.getStats(orgId);
    expect(stats.total).toBe(2);
    expect(stats.active).toBe(2);
    expect(stats.pinned).toBe(1);
  });
});
