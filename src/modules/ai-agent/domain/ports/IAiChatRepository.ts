import { Channel, ChatMessage } from '../entities/Chat';

export interface MessageListQuery {
  page?: number;
  limit?: number;
  before?: string; // timestamp or message id
}

export interface MessageListResult {
  items: ChatMessage[];
  total: number;
  page: number;
  limit: number;
}

export interface IAiChatRepository {
  // Channels
  saveChannel(channel: Channel): Promise<Channel>;
  updateChannel(channel: Channel): Promise<Channel>;
  findChannelById(orgId: string, channelId: string): Promise<Channel | null>;
  listChannels(orgId: string, userId: string): Promise<Channel[]>;

  // Messages
  saveMessage(message: ChatMessage): Promise<ChatMessage>;
  updateMessage(message: ChatMessage): Promise<ChatMessage>;
  findMessageById(orgId: string, messageId: string): Promise<ChatMessage | null>;
  listMessages(orgId: string, channelId: string, query: MessageListQuery): Promise<MessageListResult>;

  // AI Agent Knowledge Context
  queryKnowledgeContext(orgId: string, query: string): Promise<string>;
}
