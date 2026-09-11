import { Note, NoteProps } from '../entities/Note';

export interface NoteListQuery {
  organizationId: string;
  creatorId?: string;
  itemType?: string;
  status?: string;
  priority?: string;
  search?: string;
  tag?: string;
  isTrash?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  sharedWithUser?: string;
  assigneeUser?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface GraphNetworkResult {
  nodes: Array<{ id: string; title: string; type: string; status: string }>;
  links: Array<{ source: string; target: string }>;
}

export interface INoteRepository {
  save(note: Note): Promise<void>;
  findById(query: { id: string; organizationId: string }): Promise<Note | null>;
  delete(query: { id: string; organizationId: string; hardDelete?: boolean }): Promise<boolean>;
  list(query: NoteListQuery): Promise<{ data: Note[]; total: number }>;
  getKnowledgeGraph(organizationId: string, userId?: string): Promise<GraphNetworkResult>;
  getHeatmapData(organizationId: string, userId?: string, year?: number): Promise<Record<string, number>>;
  getStatsSummary(organizationId: string, userId?: string): Promise<Record<string, unknown>>;
  bulkUpdate(organizationId: string, ids: string[], updates: Partial<NoteProps>): Promise<number>;
  bulkDelete(organizationId: string, ids: string[]): Promise<number>;
  emptyTrash(organizationId: string, userId?: string): Promise<number>;
}
