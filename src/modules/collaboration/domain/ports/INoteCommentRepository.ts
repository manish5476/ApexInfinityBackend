import { NoteComment } from '../entities/NoteComment';

export interface INoteCommentRepository {
  save(comment: NoteComment): Promise<void>;
  findById(id: string): Promise<NoteComment | null>;
  findByNoteId(noteId: string): Promise<NoteComment[]>;
  delete(id: string): Promise<boolean>;
}
