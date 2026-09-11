import { MasterItem, MasterItemProps } from '../entities/MasterItem';

export interface IMasterRepository {
  findById(query: { id: string; organizationId: string }): Promise<MasterItem | null>;
  findByTypeAndName(query: { organizationId: string; type: string; name: string }): Promise<MasterItem | null>;
  findByTypeAndCode(query: { organizationId: string; type: string; code: string }): Promise<MasterItem | null>;
  save(master: MasterItem): Promise<void>;
  saveMany(masters: MasterItem[]): Promise<{ inserted: MasterItem[]; failed: Array<{ index: number; error: string }> }>;
  list(query: {
    organizationId: string;
    type?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    parentId?: string | null;
  }): Promise<{ data: MasterItem[]; total: number }>;
  delete(query: { id: string; organizationId: string }): Promise<boolean>;
  bulkUpdate(organizationId: string, items: Array<{ id: string; updates: Partial<MasterItemProps> }>): Promise<number>;
  bulkDelete(organizationId: string, ids: string[]): Promise<number>;
}
