import { Router } from 'express';
import multer from 'multer';
import { ChatController } from '../controllers/chat.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

export function createChatRouter(ctrl: ChatController): Router {
  const router = Router();

  // Channels
  router.get('/channels', ctrl.listChannels);
  router.post('/channels', ctrl.createChannel);

  // Messages & Uploads
  router.post('/messages', ctrl.sendMessage);
  router.post('/upload', upload.single('file'), ctrl.uploadAttachment);
  router.get('/channels/:channelId/messages', ctrl.getMessages);

  // Channel Membership
  router.post('/channels/:channelId/members', ctrl.addMember);
  router.delete('/channels/:channelId/members/:userId', ctrl.removeMember);
  router.post('/channels/:channelId/leave', ctrl.leaveChannel);
  router.patch('/channels/:channelId/disable', ctrl.disableChannel);
  router.patch('/channels/:channelId/enable', ctrl.enableChannel);

  // Message Operations
  router.patch('/messages/:messageId', ctrl.editMessage);
  router.delete('/messages/:messageId', ctrl.deleteMessage);
  router.patch('/messages/:messageId/read', ctrl.markMessageAsRead);

  return router;
}
