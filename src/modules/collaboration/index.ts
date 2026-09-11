import { Router } from 'express';
import { Connection } from 'mongoose';
import { INoteRepository } from './domain/ports/INoteRepository';
import { IMeetingRepository } from './domain/ports/IMeetingRepository';
import { INoteCommentRepository } from './domain/ports/INoteCommentRepository';
import { INoteTemplateRepository } from './domain/ports/INoteTemplateRepository';
import { MongoNoteRepository } from './infrastructure/repositories/MongoNoteRepository';
import { MongoMeetingRepository } from './infrastructure/repositories/MongoMeetingRepository';
import { MongoNoteCommentRepository } from './infrastructure/repositories/MongoNoteCommentRepository';
import { MongoNoteTemplateRepository } from './infrastructure/repositories/MongoNoteTemplateRepository';
import { InMemoryNoteRepository } from './infrastructure/repositories/InMemoryNoteRepository';
import { InMemoryMeetingRepository } from './infrastructure/repositories/InMemoryMeetingRepository';
import { InMemoryNoteCommentRepository } from './infrastructure/repositories/InMemoryNoteCommentRepository';
import { InMemoryNoteTemplateRepository } from './infrastructure/repositories/InMemoryNoteTemplateRepository';
import { NoteUseCases } from './application/use-cases/NoteUseCases';
import { MeetingUseCases } from './application/use-cases/MeetingUseCases';
import { NoteTemplateUseCases } from './application/use-cases/NoteTemplateUseCases';
import { CollaborationAnalyticsUseCases } from './application/use-cases/CollaborationAnalyticsUseCases';
import { NoteController } from './presentation/controllers/note.controller';
import { MeetingController } from './presentation/controllers/meeting.controller';
import { TemplateController } from './presentation/controllers/template.controller';
import { createNoteRouter } from './presentation/routes/note.routes';
import { ITokenService } from '../../infrastructure/security/ITokenService';
import { IEventBus } from '../../infrastructure/messaging/IEventBus';

export interface CollaborationModule {
  noteRoutes: Router;
  noteRepository: INoteRepository;
  meetingRepository: IMeetingRepository;
  noteCommentRepository: INoteCommentRepository;
  noteTemplateRepository: INoteTemplateRepository;
  noteUseCases: NoteUseCases;
  meetingUseCases: MeetingUseCases;
  templateUseCases: NoteTemplateUseCases;
  analyticsUseCases: CollaborationAnalyticsUseCases;
  noteController: NoteController;
  meetingController: MeetingController;
  templateController: TemplateController;
}

export function createCollaborationModule(deps: {
  connection: Connection;
  tokenService: ITokenService;
  eventBus: IEventBus;
  useInMemory?: boolean;
}): CollaborationModule {
  const noteRepository: INoteRepository = deps.useInMemory
    ? new InMemoryNoteRepository()
    : new MongoNoteRepository();

  const meetingRepository: IMeetingRepository = deps.useInMemory
    ? new InMemoryMeetingRepository()
    : new MongoMeetingRepository();

  const noteCommentRepository: INoteCommentRepository = deps.useInMemory
    ? new InMemoryNoteCommentRepository()
    : new MongoNoteCommentRepository();

  const noteTemplateRepository: INoteTemplateRepository = deps.useInMemory
    ? new InMemoryNoteTemplateRepository()
    : new MongoNoteTemplateRepository();

  const noteUseCases = new NoteUseCases(noteRepository, noteCommentRepository);
  const meetingUseCases = new MeetingUseCases(meetingRepository);
  const templateUseCases = new NoteTemplateUseCases(noteTemplateRepository);
  const analyticsUseCases = new CollaborationAnalyticsUseCases(noteRepository, meetingRepository);

  const noteController = new NoteController(noteUseCases, analyticsUseCases);
  const meetingController = new MeetingController(meetingUseCases, noteUseCases);
  const templateController = new TemplateController(templateUseCases, noteUseCases);

  const noteRoutes = createNoteRouter(noteController, meetingController, templateController);

  return {
    noteRoutes,
    noteRepository,
    meetingRepository,
    noteCommentRepository,
    noteTemplateRepository,
    noteUseCases,
    meetingUseCases,
    templateUseCases,
    analyticsUseCases,
    noteController,
    meetingController,
    templateController,
  };
}
