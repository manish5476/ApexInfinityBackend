import { ChatUseCases } from '../../../../src/modules/chat/application/use-cases/ChatUseCases';
import { IChatRepository } from '../../../../src/modules/chat/domain/ports/IChatRepository';
import { Channel, ChatMessage } from '../../../../src/modules/chat/domain/entities/Chat';

describe('Team Chat Module — Use Cases', () => {
  let mockRepo: jest.Mocked<IChatRepository>;
  let useCases: ChatUseCases;

  const orgId = 'org-chat-unit';
  const user1 = 'user-001';
  const user2 = 'user-002';
  const channelId = 'chan-001';

  beforeEach(() => {
    mockRepo = {
      saveChannel: jest.fn().mockImplementation(async (ch: Channel) => ch),
      updateChannel: jest.fn().mockImplementation(async (ch: Channel) => ch),
      findChannelById: jest.fn().mockImplementation(async (_orgId: string, id: string) => {
        if (id === channelId) {
          return Channel.create(channelId, {
            organizationId: orgId,
            name: 'general-discussions',
            type: 'public',
            createdBy: user1,
            members: [user1],
          });
        }
        return null;
      }),
      listChannels: jest.fn().mockResolvedValue([]),
      saveMessage: jest.fn().mockImplementation(async (msg: ChatMessage) => msg),
      updateMessage: jest.fn().mockImplementation(async (msg: ChatMessage) => msg),
      findMessageById: jest.fn().mockImplementation(async (_orgId: string, id: string) => {
        if (id === 'msg-001') {
          return ChatMessage.create('msg-001', {
            organizationId: orgId,
            channelId,
            senderId: user1,
            body: 'Hello Team!',
          });
        }
        return null;
      }),
      listMessages: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 }),
    };

    useCases = new ChatUseCases(mockRepo);
  });

  describe('Channel Management', () => {
    it('creates a channel and automatically adds creator to members', async () => {
      const channel = await useCases.createChannel({
        organizationId: orgId,
        userId: user1,
        name: 'engineering',
        type: 'public',
      });

      expect(mockRepo.saveChannel).toHaveBeenCalled();
      expect(channel.name).toBe('engineering');
      expect(channel.members).toContain(user1);
      expect(channel.isActive).toBe(true);
    });

    it('lists accessible channels for a user', async () => {
      await useCases.listChannels(orgId, user1);
      expect(mockRepo.listChannels).toHaveBeenCalledWith(orgId, user1);
    });

    it('adds and removes members from a channel', async () => {
      const withMember = await useCases.addMember(orgId, channelId, user2);
      expect(mockRepo.updateChannel).toHaveBeenCalled();
      expect(withMember.members).toContain(user2);

      const afterRemove = await useCases.removeMember(orgId, channelId, user2, user1);
      expect(afterRemove.members).not.toContain(user2);
    });

    it('disables and enables channel', async () => {
      const disabled = await useCases.disableChannel(orgId, channelId);
      expect(disabled.isActive).toBe(false);

      const enabled = await useCases.enableChannel(orgId, channelId);
      expect(enabled.isActive).toBe(true);
    });
  });

  describe('Message Operations', () => {
    it('sends message to an active channel', async () => {
      const msg = await useCases.sendMessage({
        organizationId: orgId,
        channelId,
        senderId: user1,
        body: 'Standup in 5 mins',
      });

      expect(mockRepo.saveMessage).toHaveBeenCalled();
      expect(msg.body).toBe('Standup in 5 mins');
      expect(msg.readBy).toContain(user1);
    });

    it('rejects sending empty message without attachments', async () => {
      await expect(
        useCases.sendMessage({
          organizationId: orgId,
          channelId,
          senderId: user1,
          body: '   ',
        }),
      ).rejects.toThrow('Message body or attachment is required');
    });

    it('allows author to edit their message', async () => {
      const edited = await useCases.editMessage(orgId, 'msg-001', user1, 'Updated text');
      expect(mockRepo.updateMessage).toHaveBeenCalled();
      expect(edited.body).toBe('Updated text');
      expect(edited.editedAt).toBeDefined();
    });

    it('prevents non-author from editing message', async () => {
      await expect(
        useCases.editMessage(orgId, 'msg-001', user2, 'Malicious update'),
      ).rejects.toThrow('Unauthorized to edit this message');
    });

    it('marks message as read by user', async () => {
      const read = await useCases.markMessageAsRead(orgId, 'msg-001', user2);
      expect(mockRepo.updateMessage).toHaveBeenCalled();
      expect(read.readBy).toContain(user2);
    });

    it('allows author or admin to delete message', async () => {
      const deleted = await useCases.deleteMessage(orgId, 'msg-001', user1, false);
      expect(deleted.deleted).toBe(true);
      expect(deleted.body).toBe('This message was deleted');
    });
  });
});
