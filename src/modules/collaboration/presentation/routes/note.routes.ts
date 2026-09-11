import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';
import { MeetingController } from '../controllers/meeting.controller';
import { TemplateController } from '../controllers/template.controller';

export function createNoteRouter(
  noteCtrl: NoteController,
  meetingCtrl: MeetingController,
  templateCtrl: TemplateController
): Router {
  const router = Router();

  // 1. Media & Files
  router.post('/upload', noteCtrl.uploadMedia);

  // 2. Search & Graph
  router.get('/search', noteCtrl.searchNotes);
  router.get('/graph/network', noteCtrl.getKnowledgeGraph);

  // 3. Analytics
  router.get('/analytics/heatmap', noteCtrl.getHeatMapData);
  router.get('/analytics/summary', noteCtrl.getNoteAnalytics);
  router.get('/stats/summary', noteCtrl.getNoteStatistics);
  router.get('/activity/recent', noteCtrl.getRecentActivity);

  // 4. Calendar
  router.get('/calendar/view', noteCtrl.getCalendarView);
  router.get('/calendar/monthly', noteCtrl.getNotesForMonth);

  // 5. Export
  router.get('/export/data', noteCtrl.exportNoteData);
  router.get('/export/all', noteCtrl.exportAllUserNotes);

  // 6. Templates
  router.post('/templates', templateCtrl.createNoteTemplate);
  router.get('/templates', templateCtrl.getNoteTemplates);
  router.post('/templates/:templateId/create', templateCtrl.createFromTemplate);
  router.patch('/templates/:templateId', templateCtrl.updateNoteTemplate);
  router.delete('/templates/:templateId', templateCtrl.deleteNoteTemplate);

  // 7. Bulk Operations
  router.patch('/bulk/update', noteCtrl.bulkUpdateNotes);
  router.delete('/bulk/delete', noteCtrl.bulkDeleteNotes);

  // 8. Trash
  router.get('/trash/bin', noteCtrl.getTrash);
  router.post('/trash/:id/restore', noteCtrl.restoreFromTrash);
  router.delete('/trash/empty', noteCtrl.emptyTrash);

  // 9. Meetings
  router.get('/meetings/analytics/summary', meetingCtrl.getMeetingAnalytics);
  router.post('/meetings/:meetingId/rsvp', meetingCtrl.meetingRSVP);
  router.post('/meetings/:meetingId/join', meetingCtrl.joinMeeting);
  router.post('/meetings/:meetingId/leave', meetingCtrl.leaveMeeting);
  router.post('/meetings/:meetingId/participants', meetingCtrl.addParticipants);
  router.delete('/meetings/:meetingId/participants/:userId', meetingCtrl.removeParticipant);
  router.post('/meetings/:meetingId/action-items', meetingCtrl.addActionItem);
  router.post('/meetings/:meetingId/action-items/:actionItemId/convert', meetingCtrl.convertActionItemToTask);
  router.post('/meetings/:meetingId/polls', meetingCtrl.createPoll);
  router.post('/meetings/:meetingId/polls/:pollId/vote', meetingCtrl.votePoll);
  router.delete('/meetings/:meetingId/cancel', meetingCtrl.cancelMeeting);
  router.get('/meetings/:meetingId', meetingCtrl.getMeetingById);
  router.patch('/meetings/:meetingId', meetingCtrl.updateMeeting);
  router.post('/meetings', meetingCtrl.createMeeting);
  router.get('/meetings', meetingCtrl.getUserMeetings);

  // 10. Shared Lists
  router.get('/shared/with-me', noteCtrl.getSharedNotesWithMe);
  router.get('/shared/by-me', noteCtrl.getNotesSharedByMe);
  router.get('/organization/all', noteCtrl.getAllOrganizationNotes);

  // 11. Core Root CRUD
  router.get('/', noteCtrl.getNotes);
  router.post('/', noteCtrl.createNote);

  // 12. Param Routes (/:id/*)
  router.get('/:id/comments', noteCtrl.getComments);
  router.post('/:id/comments', noteCtrl.addComment);
  router.delete('/:id/comments/:commentId', noteCtrl.deleteComment);
  router.post('/:id/comments/:commentId/react', noteCtrl.reactToComment);

  router.post('/:id/assign', noteCtrl.assignUsers);
  router.patch('/:id/assignment-status', noteCtrl.updateAssignmentStatus);

  // Checklist / Subtasks (with aliases)
  router.post('/:id/checklist', noteCtrl.addChecklistItem);
  router.patch('/:id/checklist/:subtaskId', noteCtrl.toggleSubtask);
  router.delete('/:id/checklist/:subtaskId', noteCtrl.removeSubtask);
  router.post('/:id/subtasks', noteCtrl.addChecklistItem);
  router.patch('/:id/subtasks/:subtaskId', noteCtrl.toggleSubtask);
  router.delete('/:id/subtasks/:subtaskId', noteCtrl.removeSubtask);

  router.post('/:id/time-log', noteCtrl.logTime);

  router.post('/:id/share', noteCtrl.shareNote);
  router.patch('/:id/share/permissions', noteCtrl.updateSharePermissions);
  router.delete('/:id/share/:userId', noteCtrl.removeUserFromSharedNote);

  router.post('/:id/link', noteCtrl.linkNote);
  router.post('/:id/unlink', noteCtrl.unlinkNote);
  router.post('/:id/duplicate', noteCtrl.duplicateNote);
  router.post('/:id/convert-to-task', noteCtrl.convertToTask);
  router.patch('/:id/pin', noteCtrl.togglePinNote);
  router.patch('/:id/archive', noteCtrl.archiveNote);
  router.patch('/:id/restore', noteCtrl.restoreNote);

  router.get('/:id/history', noteCtrl.getNoteHistory);
  router.delete('/:id/permanent', noteCtrl.hardDeleteNote);

  router.get('/:id', noteCtrl.getNoteById);
  router.patch('/:id', noteCtrl.updateNote);
  router.delete('/:id', noteCtrl.deleteNote);

  return router;
}
