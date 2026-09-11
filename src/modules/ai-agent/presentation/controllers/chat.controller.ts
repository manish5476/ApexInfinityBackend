import { Request, Response, NextFunction } from 'express';
import { AiChatUseCases } from '../../application/use-cases/AiChatUseCases';
import {
  createChannelSchema,
  sendMessageSchema,
  editMessageSchema,
} from '../validation/chat.validation';
import { RequestContextHolder } from '../../../../middleware/requestContext.middleware';

function getContext(req: Request): { organizationId: string; userId: string } {
  const ctx = RequestContextHolder.get();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = (req as any).user;
  const organizationId =
    ctx?.organizationId ||
    user?.organizationId ||
    (req.headers['x-organization-id'] as string) ||
    '';
  const userId = ctx?.userId || user?._id || user?.id || 'system';
  return { organizationId, userId };
}

function param(req: Request, name: string): string {
  return (req.params[name] as string) || '';
}

export class ChatController {
  constructor(private readonly useCases: AiChatUseCases) {}

  listChannels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const channels = await this.useCases.listChannels(organizationId, userId);
      res.status(200).json(channels.map(c => c.toPersistence()));
    } catch (err) {
      next(err);
    }
  };

  createChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const body = createChannelSchema.parse(req.body);
      const channel = await this.useCases.createChannel({
        organizationId,
        userId,
        name: body.name,
        type: body.type,
        members: body.members,
      });
      res.status(201).json(channel.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const body = sendMessageSchema.parse(req.body);
      const message = await this.useCases.sendMessage({
        organizationId,
        channelId: body.channelId,
        senderId: userId,
        body: body.body,
        attachments: body.attachments,
      });
      res.status(201).json(message.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  uploadAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ message: 'No file provided' });
        return;
      }
      res.status(200).json({
        name: file.originalname,
        url: `https://storage.apex.local/chat/${file.originalname}`,
        size: file.size,
        type: file.mimetype,
      });
    } catch (err) {
      next(err);
    }
  };

  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const channelId = param(req, 'channelId');
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const result = await this.useCases.getMessages(organizationId, channelId, { page, limit });
      res.status(200).json({
        items: result.items.map(m => m.toPersistence()),
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      next(err);
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const channelId = param(req, 'channelId');
      const { userId } = req.body;
      const channel = await this.useCases.addMember(organizationId, channelId, userId);
      res.status(200).json(channel.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId: actorId } = getContext(req);
      const channelId = param(req, 'channelId');
      const targetUserId = param(req, 'userId');
      const channel = await this.useCases.removeMember(organizationId, channelId, targetUserId, actorId);
      res.status(200).json(channel.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  leaveChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const channelId = param(req, 'channelId');
      await this.useCases.leaveChannel(organizationId, channelId, userId);
      res.status(200).json({ success: true, message: 'Left channel successfully' });
    } catch (err) {
      next(err);
    }
  };

  disableChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const channelId = param(req, 'channelId');
      const channel = await this.useCases.disableChannel(organizationId, channelId);
      res.status(200).json(channel.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  enableChannel = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const channelId = param(req, 'channelId');
      const channel = await this.useCases.enableChannel(organizationId, channelId);
      res.status(200).json(channel.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  editMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const messageId = param(req, 'messageId');
      const { body } = editMessageSchema.parse(req.body);
      const message = await this.useCases.editMessage(organizationId, messageId, userId, body);
      res.status(200).json(message.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  deleteMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = getContext(req);
      const messageId = param(req, 'messageId');
      const message = await this.useCases.deleteMessage(organizationId, messageId);
      res.status(200).json(message.toPersistence());
    } catch (err) {
      next(err);
    }
  };

  markMessageAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId, userId } = getContext(req);
      const messageId = param(req, 'messageId');
      const message = await this.useCases.markMessageAsRead(organizationId, messageId, userId);
      res.status(200).json(message.toPersistence());
    } catch (err) {
      next(err);
    }
  };
}
