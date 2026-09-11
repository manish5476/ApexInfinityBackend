import { IMasterRepository } from '../../domain/ports/IMasterRepository';
import { MasterItem, MasterItemProps } from '../../domain/entities/MasterItem';

export class InMemoryMasterRepository implements IMasterRepository {
  public items: MasterItem[] = [];

  async findById(query: { id: string; organizationId: string }): Promise<MasterItem | null> {
    const item = this.items.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    return item ? MasterItem.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async findByTypeAndName(query: { organizationId: string; type: string; name: string }): Promise<MasterItem | null> {
    const item = this.items.find(
      (x) =>
        x.organizationId === query.organizationId &&
        x.type.toLowerCase() === query.type.toLowerCase() &&
        x.name.toLowerCase() === query.name.toLowerCase()
    );
    return item ? MasterItem.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async findByTypeAndCode(query: { organizationId: string; type: string; code: string }): Promise<MasterItem | null> {
    const item = this.items.find(
      (x) =>
        x.organizationId === query.organizationId &&
        x.type.toLowerCase() === query.type.toLowerCase() &&
        x.code?.toUpperCase() === query.code.toUpperCase()
    );
    return item ? MasterItem.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async save(master: MasterItem): Promise<void> {
    const idx = this.items.findIndex((x) => x.id === master.id);
    if (idx >= 0) {
      this.items[idx] = MasterItem.reconstitute({ ...master.props, id: master.id });
    } else {
      this.items.push(MasterItem.reconstitute({ ...master.props, id: master.id }));
    }
  }

  async saveMany(masters: MasterItem[]): Promise<{ inserted: MasterItem[]; failed: Array<{ index: number; error: string }> }> {
    const inserted: MasterItem[] = [];
    const failed: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < masters.length; i++) {
      const item = masters[i]!;
      const duplicate = this.items.find(
        (x) =>
          x.organizationId === item.organizationId &&
          x.type.toLowerCase() === item.type.toLowerCase() &&
          x.name.toLowerCase() === item.name.toLowerCase()
      );
      if (duplicate) {
        failed.push({ index: i, error: `Duplicate item '${item.name}' for type '${item.type}'` });
      } else {
        await this.save(item);
        inserted.push(item);
      }
    }

    return { inserted, failed };
  }

  async list(query: {
    organizationId: string;
    type?: string;
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    parentId?: string | null;
  }): Promise<{ data: MasterItem[]; total: number }> {
    let filtered = this.items.filter((x) => x.organizationId === query.organizationId);

    if (query.type) {
      filtered = filtered.filter((x) => x.type.toLowerCase() === query.type!.toLowerCase());
    }
    if (query.isActive !== undefined) {
      filtered = filtered.filter((x) => x.isActive === query.isActive);
    }
    if (query.parentId !== undefined) {
      filtered = filtered.filter((x) => x.parentId === query.parentId);
    }
    if (query.search) {
      const term = query.search.toLowerCase();
      filtered = filtered.filter(
        (x) =>
          x.name.toLowerCase().includes(term) ||
          (x.code && x.code.toLowerCase().includes(term)) ||
          (x.description && x.description.toLowerCase().includes(term))
      );
    }

    filtered.sort((a, b) => a.name.localeCompare(b.name));

    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const start = (page - 1) * limit;

    return {
      data: filtered.slice(start, start + limit).map((x) => MasterItem.reconstitute({ ...x.props, id: x.id })),
      total: filtered.length,
    };
  }

  async delete(query: { id: string; organizationId: string }): Promise<boolean> {
    const item = this.items.find((x) => x.id === query.id && x.organizationId === query.organizationId);
    if (!item) return false;
    item.deactivate();
    return true;
  }

  async bulkUpdate(
    organizationId: string,
    items: Array<{ id: string; updates: Partial<MasterItemProps> }>
  ): Promise<number> {
    let count = 0;
    for (const update of items) {
      const existing = this.items.find((x) => x.id === update.id && x.organizationId === organizationId);
      if (existing) {
        existing.updateDetails(update.updates);
        count++;
      }
    }
    return count;
  }

  async bulkDelete(organizationId: string, ids: string[]): Promise<number> {
    let count = 0;
    for (const id of ids) {
      const existing = this.items.find((x) => x.id === id && x.organizationId === organizationId);
      if (existing && existing.isActive) {
        existing.deactivate();
        count++;
      }
    }
    return count;
  }
}
