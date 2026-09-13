import { randomUUID } from 'crypto';
import {
  Channel,
  ChannelType,
  ChatMessage,
  Attachment,
} from '../../domain/entities/Chat';
import {
  IChatRepository,
  MessageListQuery,
  MessageListResult,
} from '../../domain/ports/IChatRepository';

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

export class ChatUseCases {
  constructor(private readonly repo: IChatRepository) {}

  // ── Channel Operations ───────────────────────────────────────────────────
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

  // ── Message Operations ───────────────────────────────────────────────────
  async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
    if (!input.body?.trim() && (!input.attachments || input.attachments.length === 0)) {
      throw new Error('Message body or attachment is required');
    }

    const channel = await this.repo.findChannelById(input.organizationId, input.channelId);
    if (!channel || !channel.isActive) {
      throw new Error('Channel does not exist or is disabled');
    }

    const id = randomUUID();
    const message = ChatMessage.create(id, {
      organizationId: input.organizationId,
      channelId: input.channelId,
      senderId: input.senderId,
      body: input.body,
      attachments: input.attachments,
    });

    return this.repo.saveMessage(message);
  }

  async getChannelMessages(
    orgId: string,
    channelId: string,
    query: MessageListQuery,
  ): Promise<MessageListResult> {
    return this.repo.listMessages(orgId, channelId, query);
  }

  async editMessage(
    orgId: string,
    messageId: string,
    userId: string,
    newBody: string,
  ): Promise<ChatMessage> {
    const message = await this.repo.findMessageById(orgId, messageId);
    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId) {
      throw new Error('Unauthorized to edit this message');
    }
    const updated = message.edit(newBody);
    return this.repo.updateMessage(updated);
  }

  async deleteMessage(
    orgId: string,
    messageId: string,
    userId: string,
    isAdmin = false,
  ): Promise<ChatMessage> {
    const message = await this.repo.findMessageById(orgId, messageId);
    if (!message) throw new Error('Message not found');
    if (message.senderId !== userId && !isAdmin) {
      throw new Error('Unauthorized to delete this message');
    }
    const updated = message.markDeleted();
    return this.repo.updateMessage(updated);
  }

  async markMessageAsRead(
    orgId: string,
    messageId: string,
    userId: string,
  ): Promise<ChatMessage> {
    const message = await this.repo.findMessageById(orgId, messageId);
    if (!message) throw new Error('Message not found');
    const updated = message.markRead(userId);
    return this.repo.updateMessage(updated);
  }
}
