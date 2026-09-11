import mongoose from 'mongoose';
import {
  Channel,
  ChannelProps,
  ChannelType,
  ChatMessage,
  ChatMessageProps,
} from '../../domain/entities/Chat';
import {
  IAiChatRepository,
  MessageListQuery,
  MessageListResult,
} from '../../domain/ports/IAiChatRepository';
import {
  ChannelModel,
  ChannelDoc,
  MessageModel,
  MessageDoc,
} from '../persistence/chat.model';

function toChannelEntity(doc: ChannelDoc): Channel {
  const p: ChannelProps = {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    name: doc.name,
    type: doc.type as ChannelType,
    createdBy: doc.createdBy.toString(),
    members: doc.members.map(m => m.toString()),
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return Channel.fromPersistence(p);
}

function toMessageEntity(doc: MessageDoc): ChatMessage {
  const p: ChatMessageProps = {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    channelId: doc.channelId.toString(),
    senderId: doc.senderId.toString(),
    body: doc.body,
    attachments: (doc.attachments ?? []).map((a: any) => ({
      name: a.name,
      url: a.url,
      type: a.type,
      size: a.size,
      publicId: a.publicId,
      assetId: a.assetId?.toString(),
    })),
    readBy: (doc.readBy ?? []).map(r => r.toString()),
    deleted: doc.deleted,
    editedAt: doc.editedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
  return ChatMessage.fromPersistence(p);
}

export class MongoAiChatRepository implements IAiChatRepository {
  async saveChannel(channel: Channel): Promise<Channel> {
    const p = channel.toPersistence();
    const doc = await ChannelModel.create({
      organizationId: new mongoose.Types.ObjectId(p.organizationId),
      name: p.name,
      type: p.type,
      createdBy: new mongoose.Types.ObjectId(p.createdBy),
      members: p.members.map(m => new mongoose.Types.ObjectId(m)),
      isActive: p.isActive,
    });
    return toChannelEntity(doc);
  }

  async updateChannel(channel: Channel): Promise<Channel> {
    const p = channel.toPersistence();
    const doc = await ChannelModel.findByIdAndUpdate(
      channel.id,
      {
        $set: {
          name: p.name,
          type: p.type,
          members: p.members.map(m => new mongoose.Types.ObjectId(m)),
          isActive: p.isActive,
        },
      },
      { new: true },
    ).lean<ChannelDoc>();
    return toChannelEntity(doc as ChannelDoc);
  }

  async findChannelById(orgId: string, channelId: string): Promise<Channel | null> {
    const doc = await ChannelModel.findOne({ _id: channelId, organizationId: orgId }).lean<ChannelDoc>();
    if (!doc) return null;
    return toChannelEntity(doc as ChannelDoc);
  }

  async listChannels(orgId: string, userId: string): Promise<Channel[]> {
    const uId = new mongoose.Types.ObjectId(userId);
    const docs = await ChannelModel.find({
      organizationId: orgId,
      $or: [{ type: 'public' }, { members: uId }],
    })
      .sort({ updatedAt: -1 })
      .lean<ChannelDoc[]>();
    return docs.map(toChannelEntity);
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    const p = message.toPersistence();
    const doc = await MessageModel.create({
      organizationId: new mongoose.Types.ObjectId(p.organizationId),
      channelId: new mongoose.Types.ObjectId(p.channelId),
      senderId: new mongoose.Types.ObjectId(p.senderId),
      body: p.body,
      attachments: p.attachments,
      readBy: p.readBy.map(r => new mongoose.Types.ObjectId(r)),
      deleted: p.deleted,
    });
    return toMessageEntity(doc);
  }

  async updateMessage(message: ChatMessage): Promise<ChatMessage> {
    const p = message.toPersistence();
    const doc = await MessageModel.findByIdAndUpdate(
      message.id,
      {
        $set: {
          body: p.body,
          attachments: p.attachments,
          readBy: p.readBy.map(r => new mongoose.Types.ObjectId(r)),
          deleted: p.deleted,
          editedAt: p.editedAt,
        },
      },
      { new: true },
    ).lean<MessageDoc>();
    return toMessageEntity(doc as MessageDoc);
  }

  async findMessageById(orgId: string, messageId: string): Promise<ChatMessage | null> {
    const doc = await MessageModel.findOne({ _id: messageId, organizationId: orgId }).lean<MessageDoc>();
    if (!doc) return null;
    return toMessageEntity(doc as MessageDoc);
  }

  async listMessages(
    orgId: string,
    channelId: string,
    query: MessageListQuery,
  ): Promise<MessageListResult> {
    const filter = { organizationId: orgId, channelId };
    const page = Math.max(query.page || 1, 1);
    const limit = Math.min(query.limit || 50, 100);

    const [docs, total] = await Promise.all([
      MessageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<MessageDoc[]>(),
      MessageModel.countDocuments(filter),
    ]);

    return {
      items: docs.map(toMessageEntity),
      total,
      page,
      limit,
    };
  }

  async queryKnowledgeContext(_orgId: string, query: string): Promise<string> {
    return `Live CRM Context regarding: "${query}".`;
  }
}
