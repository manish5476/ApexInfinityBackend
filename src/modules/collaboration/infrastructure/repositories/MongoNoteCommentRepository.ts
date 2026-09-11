import { INoteCommentRepository } from '../../domain/ports/INoteCommentRepository';
import { NoteComment } from '../../domain/entities/NoteComment';
import { FwNoteComment, NoteCommentDoc } from '../persistence/collaboration.model';

export class MongoNoteCommentRepository implements INoteCommentRepository {
  private toEntity(doc: any): NoteComment {
    return NoteComment.reconstitute({
      id: doc._id,
      organizationId: doc.organizationId,
      noteId: doc.noteId,
      authorId: doc.authorId,
      content: doc.content,
      parentId: doc.parentId || null,
      reactions: doc.reactions || [],
      isEdited: doc.isEdited,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async save(comment: NoteComment): Promise<void> {
    const props = comment.props;
    await FwNoteComment.findOneAndUpdate(
      { _id: comment.id },
      {
        $set: {
          organizationId: props.organizationId,
          noteId: props.noteId,
          authorId: props.authorId,
          content: props.content,
          parentId: props.parentId,
          reactions: props.reactions,
          isEdited: props.isEdited,
        },
      },
      { upsert: true }
    );
  }

  async findById(id: string): Promise<NoteComment | null> {
    const doc = await FwNoteComment.findOne({ _id: id }).lean();
    return doc ? this.toEntity(doc) : null;
  }

  async findByNoteId(noteId: string): Promise<NoteComment[]> {
    const docs = await FwNoteComment.find({ noteId }).sort({ createdAt: 1 }).lean();
    return docs.map((d) => this.toEntity(d));
  }

  async delete(id: string): Promise<boolean> {
    const res = await FwNoteComment.deleteOne({ _id: id });
    return res.deletedCount > 0;
  }
}
