import { IMasterTypeRepository } from '../../domain/ports/IMasterTypeRepository';
import { MasterType } from '../../domain/entities/MasterType';

export class InMemoryMasterTypeRepository implements IMasterTypeRepository {
  public types: MasterType[] = [];

  async findById(id: string): Promise<MasterType | null> {
    const item = this.types.find((x) => x.id === id);
    return item ? MasterType.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async findByName(name: string): Promise<MasterType | null> {
    const item = this.types.find((x) => x.name.toLowerCase() === name.toLowerCase());
    return item ? MasterType.reconstitute({ ...item.props, id: item.id }) : null;
  }

  async save(masterType: MasterType): Promise<void> {
    const idx = this.types.findIndex((x) => x.id === masterType.id);
    if (idx >= 0) {
      this.types[idx] = MasterType.reconstitute({ ...masterType.props, id: masterType.id });
    } else {
      this.types.push(MasterType.reconstitute({ ...masterType.props, id: masterType.id }));
    }
  }

  async list(query?: { isActive?: boolean }): Promise<MasterType[]> {
    let filtered = this.types;
    if (query?.isActive !== undefined) {
      filtered = filtered.filter((x) => x.isActive === query.isActive);
    }
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered.map((x) => MasterType.reconstitute({ ...x.props, id: x.id }));
  }

  async delete(id: string): Promise<boolean> {
    const item = this.types.find((x) => x.id === id);
    if (!item) return false;
    item.deactivate();
    return true;
  }
}
