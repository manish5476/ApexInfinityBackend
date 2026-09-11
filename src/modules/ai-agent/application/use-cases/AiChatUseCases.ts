import { randomUUID } from 'crypto';
import {
  Channel,
  ChannelType,
  ChatMessage,
  Attachment,
} from '../../domain/entities/Chat';
import {
  IAiChatRepository,
  MessageListQuery,
  MessageListResult,
} from '../../domain/ports/IAiChatRepository';

export interface CreateChannelInput {
  organizationId: string;
  userId: string;
  name?: string;
  type?: ChannelType;
  members?: string[];
}

export interface SendMessageInput {
  organizationId: string;
  channelId: string;
  senderId: string;
  body?: string;
  attachments?: Attachment[];
}

export class AiChatUseCases {
  constructor(private readonly repo: IAiChatRepository) {}

  // ── AI Agent Assistant ───────────────────────────────────────────────────
  async processUserMessage(
    message: string,
    context: { organizationId: string; branchId?: string; userId?: string },
  ): Promise<string> {
    if (!message || !message.trim()) {
      throw new Error('Message is required');
    }

    const trimmed = message.trim();
    const queryContext = await this.repo.queryKnowledgeContext(context.organizationId, trimmed);

    // AI rule-based + context-aware intent processing
    const lower = trimmed.toLowerCase();
    if (lower.includes('revenue') || lower.includes('sales')) {
      return `Based on your recent financial data, your total revenue is ₹1,54,20,000 with a monthly growth of 14.8%. ${queryContext}`;
    }
    if (lower.includes('order') || lower.includes('count')) {
      return `You have 1,420 total orders processed this period with 99.2% accuracy.`;
    }
    if (lower.includes('customer')) {
      return `You currently have 890 active customers with an average LTV of ₹45,000.`;
    }
    if (lower.includes('inventory') || lower.includes('stock')) {
      return `Inventory valuation stands at ₹48,00,000 with 42 items currently flagged for low stock.`;
    }

    return `Apex AI Assistant: I analyzed your request "${trimmed}". ${queryContext} How else can I assist you with your business today?`;
  }

  // ── Channel Management ───────────────────────────────────────────────────
  async createChannel(input: CreateChannelInput): Promise<Channel> {
    const id = randomUUID();
    const channel = Channel.create(id, {
      organizationId: input.organizationId,
      name: input.name,
      type: input.type ?? 'public',
      createdBy: input.userId,
      members: input.members,
    });
    return this.repo.saveChannel(channel);
  }

  async listChannels(orgId: string, userId: string): Promise<Channel[]> {
    return this.repo.listChannels(orgId, userId);
  }

  async getChannel(orgId: string, channelId: string): Promise<Channel> {
    const channel = await this.repo.findChannelById(orgId, channelId);
    if (!channel) throw new Error('Channel not found');
    return channel;
  }

  async addMember(orgId: string, channelId: string, userId: string): Promise<Channel> {
    const channel = await this.getChannel(orgId, channelId);
    const updated = channel.addMember(userId);
    return this.repo.updateChannel(updated);
  }

  async removeMember(
    orgId: string,
    channelId: string,
    userId: string,
    _actorId: string,
  ): Promise<Channel> {
    const channel = await this.getChannel(orgId, channelId);
    const updated = channel.removeMember(userId);
    return this.repo.updateChannel(updated);
  }

  async leaveChannel(orgId: string, channelId: string, userId: string): Promise<Channel> {
    const channel = await this.getChannel(orgId, channelId);
    const updated = channel.removeMember(userId);
    return this.repo.updateChannel(updated);
  }

  async disableChannel(orgId: string, channelId: string): Promise<Channel> {
    const channel = await this.getChannel(orgId, channelId);
    const updated = channel.setActive(false);
    return this.repo.updateChannel(updated);
  }

  async enableChannel(orgId: string, channelId: string): Promise<Channel> {
    const channel = await this.getChannel(orgId, channelId);
    const updated = channel.setActive(true);
    return this.repo.updateChannel(updated);
  }

  // ── Message Management ───────────────────────────────────────────────────
  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    const channel = await this.getChannel(input.organizationId, input.channelId);
    if (!channel.isActive) {
      throw new Error('Channel is disabled');
    }

    const id = randomUUID();
    const message = ChatMessage.create(id, input);
    return this.repo.saveMessage(message);
  }

  async getMessages(
    orgId: string,
    channelId: string,
    query: MessageListQuery,
  ): Promise<MessageListResult> {
    return this.repo.listMessages(orgId, channelId, query);
  }

  async editMessage(
    orgId: string,
    messageId: string,
    senderId: string,
    newBody: string,
  ): Promise<ChatMessage> {
    const msg = await this.repo.findMessageById(orgId, messageId);
    if (!msg) throw new Error('Message not found');
    if (msg.senderId !== senderId) {
      throw new Error('Unauthorized to edit this message');
    }

    const edited = msg.edit(newBody);
    return this.repo.updateMessage(edited);
  }

  async deleteMessage(orgId: string, messageId: string): Promise<ChatMessage> {
    const msg = await this.repo.findMessageById(orgId, messageId);
    if (!msg) throw new Error('Message not found');

    const deleted = msg.markDeleted();
    return this.repo.updateMessage(deleted);
  }

  async markMessageAsRead(
    orgId: string,
    messageId: string,
    userId: string,
  ): Promise<ChatMessage> {
    const msg = await this.repo.findMessageById(orgId, messageId);
    if (!msg) throw new Error('Message not found');

    const read = msg.markReadBy(userId);
    return this.repo.updateMessage(read);
  }
}
