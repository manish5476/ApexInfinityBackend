import { AiChatUseCases } from '../../../../src/modules/ai-agent/application/use-cases/AiChatUseCases';
import { InMemoryAiChatRepository } from '../../../../src/modules/ai-agent/infrastructure/repositories/InMemoryAiChatRepository';

describe('AI Agent & Chat Module — Use Cases', () => {
  let repo: InMemoryAiChatRepository;
  let useCases: AiChatUseCases;

  const orgId = 'org-chat-101';
  const user1 = 'user-001';
  const user2 = 'user-002';

  beforeEach(() => {
    repo = new InMemoryAiChatRepository();
    useCases = new AiChatUseCases(repo);
  });

  describe('AI Agent Assistant', () => {
    it('processes user inquiries with context-aware responses', async () => {
      const reply = await useCases.processUserMessage('What is our current revenue?', {
        organizationId: orgId,
      });

      expect(reply).toContain('revenue is ₹1,54,20,000');
    });

    it('answers inventory questions with stock counts', async () => {
      const reply = await useCases.processUserMessage('How is our inventory looking?', {
        organizationId: orgId,
      });

      expect(reply).toContain('Inventory valuation stands at ₹48,00,000');
      expect(reply).toContain('42 items');
    });

    it('rejects empty query messages', async () => {
      await expect(
        useCases.processUserMessage('   ', { organizationId: orgId }),
      ).rejects.toThrow('Message is required');
    });
  });

  describe('Channel Management', () => {
    it('creates a channel and automatically adds creator to members', async () => {
      const channel = await useCases.createChannel({
        organizationId: orgId,
        userId: user1,
        name: 'general-chat',
        type: 'public',
      });

      expect(channel.id).toBeDefined();
      expect(channel.name).toBe('general-chat');
      expect(channel.members).toContain(user1);
      expect(channel.isActive).toBe(true);
    });

    it('adds and removes members from a channel', async () => {
      const channel = await useCases.createChannel({
        organizationId: orgId,
        userId: user1,
        name: 'project-team',
      });

      const withUser2 = await useCases.addMember(orgId, channel.id, user2);
      expect(withUser2.members).toContain(user2);

      const afterRemove = await useCases.removeMember(orgId, channel.id, user2, user1);
      expect(afterRemove.members).not.toContain(user2);
    });

    it('disables and re-enables channels', async () => {
      const channel = await useCases.createChannel({
        organizationId: orgId,
        userId: user1,
        name: 'archive-test',
      });

      const disabled = await useCases.disableChannel(orgId, channel.id);
      expect(disabled.isActive).toBe(false);

      const enabled = await useCases.enableChannel(orgId, channel.id);
      expect(enabled.isActive).toBe(true);
    });
  });

  describe('Chat Messaging & Lifecycle', () => {
    it('sends messages and lists them with pagination', async () => {
      const channel = await useCases.createChannel({
        organizationId: orgId,
        userId: user1,
        name: 'dev-team',
      });

      const msg1 = await useCases.sendMessage({
        organizationId: orgId,
        channelId: channel.id,
        senderId: user1,
        body: 'Hello team!',
      });

      expect(msg1.id).toBeDefined();
      expect(msg1.body).toBe('Hello team!');
      expect(msg1.readBy).toContain(user1);

      const list = await useCases.getMessages(orgId, channel.id, { page: 1, limit: 10 });
      expect(list.total).toBe(1);
      expect(list.items[0]!.id).toBe(msg1.id);
    });

    it('prevents sending messages to disabled channels', async () => {
      const channel = await useCases.createChannel({
        organizationId: orgId,
        userId: user1,
      });
      await useCases.disableChannel(orgId, channel.id);

      await expect(
        useCases.sendMessage({
          organizationId: orgId,
          channelId: channel.id,
          senderId: user1,
          body: 'Test',
        }),
      ).rejects.toThrow('Channel is disabled');
    });

    it('edits message by sender and tracks edited timestamp', async () => {
      const channel = await useCases.createChannel({ organizationId: orgId, userId: user1 });
      const msg = await useCases.sendMessage({
        organizationId: orgId,
        channelId: channel.id,
        senderId: user1,
        body: 'Initial typo',
      });

      const edited = await useCases.editMessage(orgId, msg.id, user1, 'Fixed typo');
      expect(edited.body).toBe('Fixed typo');
      expect(edited.editedAt).toBeDefined();
    });

    it('prevents non-senders from editing messages', async () => {
      const channel = await useCases.createChannel({ organizationId: orgId, userId: user1 });
      const msg = await useCases.sendMessage({
        organizationId: orgId,
        channelId: channel.id,
        senderId: user1,
        body: 'Original',
      });

      await expect(
        useCases.editMessage(orgId, msg.id, user2, 'Unauthorized edit'),
      ).rejects.toThrow('Unauthorized to edit this message');
    });

    it('marks message deleted and marks message read', async () => {
      const channel = await useCases.createChannel({ organizationId: orgId, userId: user1 });
      const msg = await useCases.sendMessage({
        organizationId: orgId,
        channelId: channel.id,
        senderId: user1,
        body: 'Secret message',
      });

      const read = await useCases.markMessageAsRead(orgId, msg.id, user2);
      expect(read.readBy).toContain(user2);

      const deleted = await useCases.deleteMessage(orgId, msg.id);
      expect(deleted.deleted).toBe(true);
      expect(deleted.body).toBe('This message was deleted');
    });
  });
});
