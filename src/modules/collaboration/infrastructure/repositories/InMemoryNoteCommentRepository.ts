import { INoteCommentRepository } from '../../domain/ports/INoteCommentRepository';
import { NoteComment } from '../../domain/entities/NoteComment';

export class InMemoryNoteCommentRepository implements INoteCommentRepository {
  public items: NoteComment[] = [];

  async save(comment: NoteComment): Promise<void> {
    const idx = this.items.findIndex((x) => x.id === comment.id);
    if (idx >= 0) {
      this.items[idx] = comment;
    } else {
      this.items.push(comment);
    }
  }

  async findById(id: string): Promise<NoteComment | null> {
    const item = this.items.find((x) => x.id === id);
    return item ? NoteComment.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async findByNoteId(noteId: string): Promise<NoteComment[]> {
    return this.items
      .filter((x) => x.noteId === noteId)
      .map((x) => NoteComment.reconstitute({ ...x.props, id: x.id }));
  }

  async delete(id: string): Promise<boolean> {
    const idx = this.items.findIndex((x) => x.id === id);
    if (idx < 0) return false;
    this.items.splice(idx, 1);
    return true;
  }
}
