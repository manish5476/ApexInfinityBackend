import mongoose from 'mongoose';
import {
  Channel,
  ChannelProps,
  ChannelType,
  ChatMessage,
  ChatMessageProps,
} from '../../domain/entities/Chat';
import {
  IChatRepository,
  MessageListQuery,
  MessageListResult,
} from '../../domain/ports/IChatRepository';
import {
  ChannelModel,
  ChannelDoc,
  MessageModel,
  MessageDoc,
} from '../persistence/chat.model';

function toObjectId(id: string): mongoose.Types.ObjectId | string {
  return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
}

function toChannelEntity(doc: ChannelDoc): Channel {
  const p: ChannelProps = {
    id: doc._id.toString(),
    organizationId: doc.organizationId.toString(),
    name: doc.name,
    type: doc.type as ChannelType,
    createdBy: doc.createdBy.toString(),
    members: (doc.members || []).map(m => m.toString()),
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

export class MongoChatRepository implements IChatRepository {
  async saveChannel(channel: Channel): Promise<Channel> {
    const p = channel.toPersistence();
    const doc = await ChannelModel.create({
      organizationId: toObjectId(p.organizationId),
      name: p.name,
      type: p.type,
      createdBy: toObjectId(p.createdBy),
      members: p.members.map(toObjectId),
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
          members: p.members.map(toObjectId),
          isActive: p.isActive,
        },
      },
      { new: true },
    ).lean<ChannelDoc>();
    if (!doc) throw new Error('Channel not found');
    return toChannelEntity(doc as ChannelDoc);
  }

  async findChannelById(orgId: string, channelId: string): Promise<Channel | null> {
    const doc = await ChannelModel.findOne({ _id: channelId, organizationId: toObjectId(orgId) }).lean<ChannelDoc>();
    if (!doc) return null;
    return toChannelEntity(doc as ChannelDoc);
  }

  async listChannels(orgId: string, userId: string): Promise<Channel[]> {
    const uId = toObjectId(userId);
    const docs = await ChannelModel.find({
      organizationId: toObjectId(orgId),
      $or: [{ type: 'public' }, { members: uId }],
    })
      .sort({ updatedAt: -1 })
      .lean<ChannelDoc[]>();
    return docs.map(toChannelEntity);
  }

  async saveMessage(message: ChatMessage): Promise<ChatMessage> {
    const p = message.toPersistence();
    const doc = await MessageModel.create({
      organizationId: toObjectId(p.organizationId),
      channelId: toObjectId(p.channelId),
      senderId: toObjectId(p.senderId),
      body: p.body,
      attachments: p.attachments,
      readBy: p.readBy.map(toObjectId),
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
          readBy: p.readBy.map(toObjectId),
          deleted: p.deleted,
          editedAt: p.editedAt,
        },
      },
      { new: true },
    ).lean<MessageDoc>();
    if (!doc) throw new Error('Message not found');
    return toMessageEntity(doc as MessageDoc);
  }

  async findMessageById(orgId: string, messageId: string): Promise<ChatMessage | null> {
    const doc = await MessageModel.findOne({ _id: messageId, organizationId: toObjectId(orgId) }).lean<MessageDoc>();
    if (!doc) return null;
    return toMessageEntity(doc as MessageDoc);
  }

  async listMessages(
    orgId: string,
    channelId: string,
    query: MessageListQuery,
  ): Promise<MessageListResult> {
    const filter = { organizationId: toObjectId(orgId), channelId: toObjectId(channelId) };
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
}
