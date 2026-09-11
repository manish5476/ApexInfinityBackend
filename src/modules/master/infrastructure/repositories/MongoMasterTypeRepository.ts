import { IMasterTypeRepository } from '../../domain/ports/IMasterTypeRepository';
import { MasterType } from '../../domain/entities/MasterType';
import { FwMasterType } from '../persistence/master.model';

export class MongoMasterTypeRepository implements IMasterTypeRepository {
  private toEntity(doc: any): MasterType {
    return MasterType.reconstitute({
      id: doc._id.toString(),
      name: doc.name,
      label: doc.label,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  async findById(id: string): Promise<MasterType | null> {
    const doc = await FwMasterType.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByName(name: string): Promise<MasterType | null> {
    const doc = await FwMasterType.findOne({ name: name.toLowerCase().trim() });
    return doc ? this.toEntity(doc) : null;
  }

  async save(masterType: MasterType): Promise<void> {
    await FwMasterType.findOneAndUpdate(
      { _id: masterType.id },
      {
        _id: masterType.id,
        name: masterType.name,
        label: masterType.label,
        isActive: masterType.isActive,
      },
      { upsert: true, new: true }
    );
  }

  async list(query?: { isActive?: boolean }): Promise<MasterType[]> {
    const filter: Record<string, any> = {};
    if (query?.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    const docs = await FwMasterType.find(filter).sort({ name: 1 }).lean();
    return docs.map((d) => this.toEntity(d));
  }

  async delete(id: string): Promise<boolean> {
    const doc = await FwMasterType.findByIdAndUpdate(id, { isActive: false });
    return !!doc;
  }
}
