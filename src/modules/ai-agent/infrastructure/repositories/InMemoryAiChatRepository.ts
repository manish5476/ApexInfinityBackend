import {
  Channel,
  ChannelProps,
  ChatMessage,
  ChatMessageProps,
} from '../../domain/entities/Chat';
import {
  IAiChatRepository,
  MessageListQuery,
  MessageListResult,
} from '../../domain/ports/IAiChatRepository';

export class InMemoryAiChatRepository implements IAiChatRepository {
  private channels = new Map<string, ChannelProps>();
  private messages: ChatMessageProps[] = [];

  // Channels
  async saveChannel(channel: Channel): Promise<Channel> {
    this.channels.set(channel.id, channel.toPersistence());
    return channel;
  }

  async updateChannel(channel: Channel): Promise<Channel> {
    this.channels.set(channel.id, channel.toPersistence());
    return channel;
  }

  async findChannelById(orgId: string, channelId: string): Promise<Channel | null> {
    const props = this.channels.get(channelId);
    if (!props || props.organizationId !== orgId) return null;
    return Channel.fromPersistence(props);
  }

  async listChannels(orgId: string, userId: string): Promise<Channel[]> {
    return Array.from(this.channels.values())
      .filter(c => c.organizationId === orgId && (c.type === 'public' || c.members.includes(userId)))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .map(p => Channel.fromPersistence(p));
  }

  // Messages
  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    this.messages.push(message.toPersistence());
    return message;
  }

  async updateMessage(message: ChatMessage): Promise<ChatMessage> {
    const index = this.messages.findIndex(m => m.id === message.id);
    if (index !== -1) {
      this.messages[index] = message.toPersistence();
    }
    return message;
  }

  async findMessageById(orgId: string, messageId: string): Promise<ChatMessage | null> {
    const props = this.messages.find(m => m.id === messageId && m.organizationId === orgId);
    if (!props) return null;
    return ChatMessage.fromPersistence(props);
  }

  async listMessages(
    orgId: string,
    channelId: string,
    query: MessageListQuery,
  ): Promise<MessageListResult> {
    const matching = this.messages
      .filter(m => m.organizationId === orgId && m.channelId === channelId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = matching.length;
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 50, 100);
    const start = (page - 1) * limit;

    return {
      items: matching.slice(start, start + limit).map(p => ChatMessage.fromPersistence(p)),
      total,
      page,
      limit,
    };
  }

  // AI Agent Knowledge Context
  async queryKnowledgeContext(_orgId: string, query: string): Promise<string> {
    return `Context regarding: "${query}". Top active metrics: 1420 orders, revenue 1.54Cr, 890 active customers.`;
  }
}
